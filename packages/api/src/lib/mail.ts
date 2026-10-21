import { Resend } from "resend";

export type CareerApplicationEmailData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  country: string;
  visaStatus: string;
  salaryExpectationLabel: string;
  documentUrls: string[];
  message?: string | null;
};

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function requireResendClient(): Resend {
  const resend = getResendClient();
  if (!resend) {
    throw new Error(
      "Email is not configured on the API server. Set RESEND_API_KEY (and MAIL_FROM) on the API service, then restart.",
    );
  }
  return resend;
}

function getMailFrom(): string {
  return process.env.MAIL_FROM?.trim() || "TechBubble Careers <careers@techbubble.com.au>";
}

/** TBOS transactional mail (invites, password reset). Must use a domain verified in Resend. */
function getTbosMailFrom(): string {
  const explicit = process.env.TBOS_MAIL_FROM?.trim();
  if (explicit) return explicit;
  return "TIBOSX <noreply@techbubble.net.au>";
}

/** TIBOSX product notifications (tickets, timesheets, contact form). */
function getNotificationMailFrom(): string {
  return getTbosMailFrom();
}

function getHrEmail(): string {
  return process.env.CAREERS_HR_EMAIL?.trim() || "hr@techbubble.com.au";
}

export function buildResumeAbsoluteUrl(resumePath: string): string {
  const base = (process.env.PUBLIC_WEB_URL || "http://localhost:3000").replace(/\/$/, "");
  const path = resumePath.startsWith("/") ? resumePath : `/${resumePath}`;
  return `${base}${path}`;
}

function buildEmailHtml(data: CareerApplicationEmailData): string {
  const documentLinks = data.documentUrls
    .map((url, index) => {
      const absolute = buildResumeAbsoluteUrl(url);
      return `<li><a href="${escapeHtml(absolute)}">Document ${index + 1}</a></li>`;
    })
    .join("");

  const lines = [
    `<p><strong>Name:</strong> ${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}</p>`,
    `<p><strong>Email:</strong> <a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></p>`,
    `<p><strong>Phone:</strong> ${escapeHtml(data.phone)}</p>`,
    `<p><strong>Position:</strong> ${escapeHtml(data.position)}</p>`,
    `<p><strong>Country:</strong> ${escapeHtml(data.country)}</p>`,
    `<p><strong>Visa status:</strong> ${escapeHtml(data.visaStatus)}</p>`,
    `<p><strong>Salary expectation:</strong> ${escapeHtml(data.salaryExpectationLabel)}</p>`,
    `<p><strong>Documents:</strong></p><ul>${documentLinks}</ul>`,
  ];
  if (data.message?.trim()) {
    lines.push(`<p><strong>Message:</strong></p><p>${escapeHtml(data.message.trim())}</p>`);
  }
  return `<!DOCTYPE html><html><body>${lines.join("")}</body></html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const TIBOSX_EMAIL_BLUE = "#2563eb";

export function buildTibosxNotificationEmail(input: {
  headerTitle: string;
  subjectLine: string;
  greeting?: string;
  bodyHtml: string;
  bodyText: string;
}): { subject: string; html: string; text: string } {
  const subject = input.subjectLine.includes("TIBOSX")
    ? input.subjectLine
    : `${input.subjectLine}. TIBOSX.AI`;
  const greeting = input.greeting ?? "Hi Team,";
  const disclaimer =
    "Note: This is an automated message. Please do not reply to this email — it is sent from an unmonitored address.";
  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:${TIBOSX_EMAIL_BLUE};padding:16px 24px;">
              <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;">${escapeHtml(input.headerTitle)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;color:#111827;font-size:15px;line-height:1.55;">
              <p style="margin:0 0 16px;">${escapeHtml(greeting)}</p>
              ${input.bodyHtml}
              <p style="margin:24px 0 0;">Thanks,<br/><strong>TIBOSX</strong></p>
              <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
              <p style="margin:0;font-size:12px;color:#6b7280;">📢 <strong>Note:</strong> ${escapeHtml(disclaimer.replace(/^Note:\s*/, ""))}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  const text = [greeting, "", input.bodyText, "", "Thanks,", "TIBOSX", "", disclaimer].join("\n");
  return { subject, html, text };
}

export async function sendTimesheetApprovalRequestEmail(input: {
  to: string;
  memberName: string;
  targetLabel: string;
  portalUrl: string;
}): Promise<void> {
  const target = input.targetLabel || "a support project";
  const bodyText = `${input.memberName} submitted a timesheet for ${target}.\n\nSign in to TIBOSX to approve or reject:\n${input.portalUrl}`;
  const bodyHtml = `<p><strong>${escapeHtml(input.memberName)}</strong> submitted a timesheet for <strong>${escapeHtml(target)}</strong>.</p><p>Sign in to <strong>TIBOSX</strong> to approve or reject:<br/><a href="${escapeHtml(input.portalUrl)}">${escapeHtml(input.portalUrl)}</a></p>`;
  await sendSupportTicketNotificationEmail({
    to: input.to,
    headerTitle: "Timesheet awaiting approval!",
    subjectLine: "Timesheet awaiting approval",
    body: bodyText,
    bodyHtml,
    greeting: "Hi Team,",
  });
}

export async function sendTimesheetPmApprovalRequestEmail(input: {
  to: string;
  memberName: string;
  targetLabel: string;
  reviewUrl: string;
}): Promise<void> {
  const target = input.targetLabel || "a project";
  const bodyText = `${input.memberName} submitted a timesheet for ${target}.\n\nReview and approve in TBOS:\n${input.reviewUrl}`;
  const bodyHtml = `<p><strong>${escapeHtml(input.memberName)}</strong> submitted a timesheet for <strong>${escapeHtml(target)}</strong>.</p><p>Review and approve in <strong>TBOS</strong>:<br/><a href="${escapeHtml(input.reviewUrl)}">${escapeHtml(input.reviewUrl)}</a></p>`;
  await sendSupportTicketNotificationEmail({
    to: input.to,
    headerTitle: "Timesheet to review!",
    subjectLine: "Timesheet to review",
    body: bodyText,
    bodyHtml,
    greeting: "Hi Team,",
  });
}

export async function sendTimesheetMemberDecisionEmail(input: {
  to: string;
  memberName: string;
  targetLabel: string;
  reviewUrl: string;
  decision: "approved" | "rejected";
  reason?: string;
}): Promise<void> {
  const verb = input.decision === "approved" ? "approved" : "rejected";
  const lines = [
    `Hello ${input.memberName},`,
    "",
    `Your timesheet for ${input.targetLabel || "your project"} was ${verb}.`,
  ];
  if (input.decision === "rejected" && input.reason?.trim()) {
    lines.push("", `Reason: ${input.reason.trim()}`);
  }
  lines.push("", `Open timesheet: ${input.reviewUrl}`);
  const bodyText = lines.join("\n");
  const bodyHtml = `<p>Your timesheet for <strong>${escapeHtml(input.targetLabel || "your project")}</strong> was <strong>${verb}</strong>.</p>${input.decision === "rejected" && input.reason?.trim() ? `<p>Reason: ${escapeHtml(input.reason.trim())}</p>` : ""}<p><a href="${escapeHtml(input.reviewUrl)}">Open timesheet</a></p>`;
  await sendSupportTicketNotificationEmail({
    to: input.to,
    headerTitle: `Timesheet ${verb}!`,
    subjectLine: `Timesheet ${verb}`,
    body: bodyText,
    bodyHtml,
    greeting: `Hello ${input.memberName},`,
  });
}

export type ContactFormEmailData = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  interest?: string | null;
  country?: string | null;
  message: string;
};

export async function sendContactFormNotificationEmail(input: {
  to: string;
  submission: ContactFormEmailData;
}): Promise<void> {
  const s = input.submission;
  const name = `${s.firstName} ${s.lastName}`.trim();
  const subject = `Contact form: ${name}`;
  const text = [
    `Name: ${name}`,
    `Email: ${s.email}`,
    s.phone ? `Phone: ${s.phone}` : null,
    s.company ? `Company: ${s.company}` : null,
    s.interest ? `Interest: ${s.interest}` : null,
    s.country ? `Country: ${s.country}` : null,
    "",
    "Message:",
    s.message,
  ]
    .filter(Boolean)
    .join("\n");
  const bodyHtml = `<p>New contact form submission from <strong>${escapeHtml(name)}</strong> (${escapeHtml(s.email)}).</p><pre style="white-space:pre-wrap;font-family:inherit;">${escapeHtml(text)}</pre>`;
  await sendSupportTicketNotificationEmail({
    to: input.to,
    headerTitle: "Contact form received!",
    subjectLine: "Contact form received",
    body: text,
    bodyHtml,
    greeting: "Hi Team,",
  });
}

export async function sendSupportTicketNotificationEmail(input: {
  to: string;
  subject?: string;
  body: string;
  headerTitle?: string;
  subjectLine?: string;
  bodyHtml?: string;
  greeting?: string;
}): Promise<void> {
  const resend = getResendClient();
  const built = buildTibosxNotificationEmail({
    headerTitle: input.headerTitle ?? input.subjectLine ?? "Notification",
    subjectLine: input.subjectLine ?? input.subject ?? "Notification",
    greeting: input.greeting,
    bodyHtml:
      input.bodyHtml ??
      `<p style="margin:0;white-space:pre-wrap;">${escapeHtml(input.body).replace(/\n/g, "<br/>")}</p>`,
    bodyText: input.body,
  });
  if (!resend) {
    console.info("[support-ticket-email] RESEND not configured; would send to", input.to, built.subject);
    return;
  }

  const { error } = await resend.emails.send({
    from: getNotificationMailFrom(),
    to: [input.to],
    subject: built.subject,
    text: built.text,
    html: built.html,
  });

  if (error) {
    throw new Error(error.message || "Failed to send support ticket email");
  }
}

export async function sendPasswordResetEmail(input: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<void> {
  const resend = getResendClient();
  const greeting = input.name.trim() ? `Hello ${input.name.trim()},` : "Hello,";
  const text = `We received a request to reset the password for your TIBOSX account.\n\nReset your password here (link expires in 1 hour):\n${input.resetUrl}\n\nIf you did not request this, you can ignore this email.`;
  const bodyHtml = `<p>We received a request to reset the password for your <strong>TIBOSX</strong> account.</p><p><a href="${escapeHtml(input.resetUrl)}">Reset your password</a> (link expires in 1 hour).</p><p>If you did not request this, you can ignore this email.</p>`;
  const built = buildTibosxNotificationEmail({
    headerTitle: "Password reset",
    subjectLine: "Password reset",
    greeting,
    bodyHtml,
    bodyText: text,
  });

  if (!resend) {
    console.info("[password-reset-email] RESEND not configured; would send to", input.to, built.subject, input.resetUrl);
    return;
  }

  const { error } = await resend.emails.send({
    from: getTbosMailFrom(),
    to: [input.to],
    subject: built.subject,
    text: built.text,
    html: built.html,
  });
  if (error) {
    throw new Error(error.message || "Failed to send password reset email");
  }
}

export async function sendUserInviteEmail(input: {
  to: string;
  name: string;
  temporaryPassword: string;
  loginUrl: string;
  extraText?: string;
}): Promise<void> {
  const resend = requireResendClient();
  const greeting = `Hello ${input.name},`;
  const text = `An account has been created for you on TIBOSX.\n\nSign-in email: ${input.to}\nTemporary password: ${input.temporaryPassword}\n\nSign in: ${input.loginUrl}${input.extraText ?? ""}`;
  const bodyHtml = `<p>An account has been created for you on <strong>TIBOSX</strong>.</p><p>Sign-in email: <strong>${escapeHtml(input.to)}</strong><br/>Temporary password: <strong>${escapeHtml(input.temporaryPassword)}</strong></p><p><a href="${escapeHtml(input.loginUrl)}">Sign in to TIBOSX</a></p><p>You will set a new password and enroll in MFA on first sign-in.</p>`;
  const built = buildTibosxNotificationEmail({
    headerTitle: "Welcome to TIBOSX!",
    subjectLine: "Your account invitation",
    greeting,
    bodyHtml,
    bodyText: text,
  });

  const { error } = await resend.emails.send({
    from: getTbosMailFrom(),
    to: [input.to],
    subject: built.subject,
    text: built.text,
    html: built.html,
  });
  if (error) {
    throw new Error(error.message || "Failed to send invite email");
  }
}

export async function sendCareerApplicationEmail(data: CareerApplicationEmailData): Promise<void> {
  const resend = getResendClient();
  if (!resend) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const applicantName = `${data.firstName} ${data.lastName}`.trim();

  const { error } = await resend.emails.send({
    from: getMailFrom(),
    to: [getHrEmail()],
    replyTo: data.email,
    subject: `New career application: ${data.position} — ${applicantName}`,
    html: buildEmailHtml(data),
  });

  if (error) {
    throw new Error(error.message || "Failed to send career application email");
  }
}
