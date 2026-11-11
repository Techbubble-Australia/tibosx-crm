import { prisma } from "@techbubble/database";
import { effectiveRoleList } from "./admin-roles";
import { isDevelopmentAppEnv } from "./app-env";
import { sendTimesheetReminderEmail } from "./mail";
import { sendEmailIfEnabled } from "./notifications/send-if-enabled";
import { tbosAdminPublicBase } from "./tbos-public-url";
import { openDaysInMonth } from "./timesheet-monthly";

const TIME_ZONE = "Australia/Sydney";
/** Reminders go out from this hour (Sydney time) on each reminder day. */
const SEND_HOUR = 9;
const CHECK_EVERY_MS = 15 * 60 * 1000;
const NOTIFICATION_ID = "timesheet.reminder";

type SydneyNow = { isoDay: string; monthKey: string; hour: number };

export function sydneyNow(now = new Date()): SydneyNow {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  const isoDay = `${parts.year}-${parts.month}-${parts.day}`;
  return { isoDay, monthKey: isoDay.slice(0, 7), hour: Number(parts.hour) };
}

/** The last `count` weekdays (Mon–Fri) of the month, earliest first. */
export function lastBusinessDays(monthKey: string, count = 2): string[] {
  const [y, m] = monthKey.split("-").map(Number) as [number, number];
  const days: string[] = [];
  for (let d = new Date(Date.UTC(y, m, 0)); days.length < count; d.setUTCDate(d.getUTCDate() - 1)) {
    const weekday = d.getUTCDay();
    if (weekday !== 0 && weekday !== 6) days.unshift(d.toISOString().slice(0, 10));
  }
  return days;
}

function monthLabel(monthKey: string): string {
  return new Date(`${monthKey}-01T00:00:00.000Z`).toLocaleDateString("en-AU", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export type TimesheetReminderRecipient = { email: string; name: string; projects: string[] };

/**
 * Internal (non-client) users on Active projects that run during the month, who have not yet
 * submitted that month's timesheet for the project.
 */
export async function timesheetReminderRecipients(monthKey: string): Promise<TimesheetReminderRecipient[]> {
  const [y, m] = monthKey.split("-").map(Number) as [number, number];
  const monthStart = new Date(Date.UTC(y, m - 1, 1));
  const nextMonth = new Date(Date.UTC(y, m, 1));

  const members = await prisma.projectMember.findMany({
    where: {
      adminUserId: { not: null },
      project: { status: "ACTIVE" },
      adminUser: { active: true },
    },
    select: {
      adminUserId: true,
      projectId: true,
      project: { select: { title: true, projectNumber: true, startDate: true, endDate: true } },
      adminUser: { select: { email: true, name: true, role: true, additionalRoles: true } },
    },
  });

  const submitted = await prisma.timesheet.findMany({
    where: {
      period: "MONTHLY",
      status: { in: ["SUBMITTED", "APPROVED"] },
      startDate: { gte: monthStart, lt: nextMonth },
      projectId: { not: null },
    },
    select: { memberUserId: true, projectId: true },
  });
  const done = new Set(submitted.map((t) => `${t.memberUserId}:${t.projectId}`));

  const byUser = new Map<string, TimesheetReminderRecipient>();
  for (const member of members) {
    const user = member.adminUser;
    if (!user || !member.adminUserId) continue;
    if (!effectiveRoleList(user.role, user.additionalRoles).some((role) => role !== "client")) continue;
    if (done.has(`${member.adminUserId}:${member.projectId}`)) continue;
    if (openDaysInMonth(monthKey, member.project).length === 0) continue;

    const entry = byUser.get(member.adminUserId) ?? {
      email: user.email,
      name: user.name?.trim() || user.email,
      projects: [],
    };
    entry.projects.push(`${member.project.projectNumber} — ${member.project.title}`);
    byUser.set(member.adminUserId, entry);
  }
  return [...byUser.values()];
}

/** Sends one reminder round; `finalDay` changes the wording on the month's last business day. */
export async function sendTimesheetReminders(monthKey: string, finalDay: boolean): Promise<number> {
  const recipients = await timesheetReminderRecipients(monthKey);
  const timesheetsUrl = `${tbosAdminPublicBase()}/timesheets`;
  const label = monthLabel(monthKey);
  let sent = 0;
  for (const recipient of recipients) {
    try {
      await sendEmailIfEnabled(NOTIFICATION_ID, recipient.email, async () => {
        await sendTimesheetReminderEmail({
          to: recipient.email,
          memberName: recipient.name,
          monthLabel: label,
          projectLabels: recipient.projects,
          timesheetsUrl,
          finalDay,
        });
        sent += 1;
      });
    } catch (error) {
      console.error(`Timesheet reminder to ${recipient.email} failed:`, error);
    }
  }
  return sent;
}

/** Runs today's reminder round once (across all API instances) if today is a reminder day. */
export async function runTimesheetRemindersIfDue(now = new Date()): Promise<void> {
  const { isoDay, monthKey, hour } = sydneyNow(now);
  const reminderDays = lastBusinessDays(monthKey);
  if (!reminderDays.includes(isoDay) || hour < SEND_HOUR) return;

  const key = `timesheet-reminder:${isoDay}`;
  try {
    await prisma.scheduledJobRun.create({ data: { key } });
  } catch (error) {
    if ((error as { code?: string })?.code === "P2002") return;
    throw error;
  }

  const finalDay = isoDay === reminderDays[reminderDays.length - 1];
  const sent = await sendTimesheetReminders(monthKey, finalDay);
  await prisma.scheduledJobRun.update({ where: { key }, data: { detail: { sent, finalDay } } });
  console.log(`Timesheet reminders for ${isoDay}: ${sent} sent.`);
}

/**
 * On by default outside development (so a dev API pointed at real data doesn't email people);
 * TIMESHEET_REMINDERS_ENABLED=true/false overrides.
 */
function remindersEnabled(): boolean {
  const flag = process.env.TIMESHEET_REMINDERS_ENABLED?.trim().toLowerCase();
  if (flag === "true") return true;
  if (flag === "false") return false;
  return !isDevelopmentAppEnv();
}

export function startTimesheetReminderScheduler(): void {
  if (!remindersEnabled()) {
    console.log("Timesheet reminders are off (set TIMESHEET_REMINDERS_ENABLED=true to enable).");
    return;
  }
  const tick = () => {
    runTimesheetRemindersIfDue().catch((error) => console.error("Timesheet reminder job failed:", error));
  };
  setTimeout(tick, 60_000);
  setInterval(tick, CHECK_EVERY_MS);
}
