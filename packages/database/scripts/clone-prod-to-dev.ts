/**
 * Copy production PostgreSQL to development with optional anonymization and debug-portal preserve.
 *
 * Requires: pg_dump, pg_restore, psql on PATH.
 *
 * Usage:
 *   PROD_DATABASE_URL="postgresql://..." DEV_DATABASE_URL="postgresql://..." \
 *     pnpm --filter @techbubble/database db:clone-prod-to-dev
 *
 * Options (env):
 *   SKIP_DUMP=1                         — anonymize only (no dump/restore)
 *   CLONE_PRESERVE_DEBUG=1              — keep DEV debug portal tickets (default: 1)
 *   CLONE_ANONYMIZE_EMAILS=1            — overwrite emails/phones except allowlist (default: 1)
 *   CLONE_EMAIL_ALLOWLIST=a@x,b@y       — emails to keep (default: Jeet, Herbert, Dhruv)
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

const POSTGRES_CLI = ["pg_dump", "pg_restore"] as const;

const DEFAULT_EMAIL_ALLOWLIST = [
  "jeet@techbubble.com.au",
  "herbert.a@proprly.tech",
  "dhruv@techbubble.com.au",
];

function envFlag(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (raw == null || raw === "") return defaultValue;
  return raw === "1" || raw === "true" || raw === "yes";
}

function parseAllowlist(): Set<string> {
  const raw = process.env.CLONE_EMAIL_ALLOWLIST?.trim();
  const emails = raw
    ? raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
    : DEFAULT_EMAIL_ALLOWLIST;
  return new Set(emails);
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`Missing ${name}`);
    process.exit(1);
  }
  return value;
}

function assertNotProdTarget(devUrl: string) {
  const lower = devUrl.toLowerCase();
  if (lower.includes("shortline.proxy.rlwy.net") || lower.includes("production")) {
    console.error("Refusing to restore: DEV_DATABASE_URL looks like production.");
    process.exit(1);
  }
}

function assertPostgresCliOnPath() {
  const missing: string[] = [];
  for (const bin of POSTGRES_CLI) {
    const found = spawnSync("sh", ["-c", `command -v ${bin}`], { encoding: "utf8" });
    if (found.status !== 0 || !found.stdout.trim()) missing.push(bin);
  }
  if (!missing.length) return;

  console.error(
    [
      "PostgreSQL client tools are required but not on PATH:",
      missing.map((b) => `  - ${b}`).join("\n"),
      "",
      "On macOS (Homebrew):",
      "  brew install libpq",
      '  export PATH="/opt/homebrew/opt/libpq/bin:$PATH"',
    ].join("\n"),
  );
  process.exit(1);
}

function run(cmd: string, args: string[]) {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    env: process.env,
  });
  if (result.error) {
    throw new Error(`${cmd} failed: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed with exit code ${result.status ?? "unknown"}`);
  }
}

function anonymizedEmail(original: string, table: string, id: string): string {
  const key = `${table}:${id}:${original}`.toLowerCase();
  const hash = createHash("sha256").update(key).digest("hex").slice(0, 10);
  return `anon+${hash}@example.test`;
}

function anonymizedPhone(original: string, table: string, id: string): string {
  const hash = createHash("sha256").update(`${table}:${id}:${original}`).digest("hex");
  const digits = hash.replace(/\D/g, "").slice(0, 8).padEnd(8, "0");
  return `+61400${digits.slice(0, 6)}`;
}

function keepEmail(email: string | null | undefined, allowlist: Set<string>): boolean {
  if (!email) return false;
  return allowlist.has(email.trim().toLowerCase());
}

type DevMfaEnrollment = { totpSecretEnc: string; mfaEnrolledAt: Date | null; mfaEnabled: boolean };
type DevMfaSnapshot = { admin: Map<string, DevMfaEnrollment>; customer: Map<string, DevMfaEnrollment> };

const MFA_RESET = { mfaEnabled: true, totpSecretEnc: null, mfaEnrolledAt: null } as const;

async function snapshotDevMfa(devUrl: string): Promise<DevMfaSnapshot> {
  const prisma = new PrismaClient({ datasources: { db: { url: devUrl } } });
  const toMap = (rows: Array<{ id: string; totpSecretEnc: string | null; mfaEnrolledAt: Date | null; mfaEnabled: boolean }>) =>
    new Map(
      rows
        .filter((row) => row.totpSecretEnc)
        .map((row) => [row.id, { totpSecretEnc: row.totpSecretEnc!, mfaEnrolledAt: row.mfaEnrolledAt, mfaEnabled: row.mfaEnabled }]),
    );
  try {
    const select = { id: true, totpSecretEnc: true, mfaEnrolledAt: true, mfaEnabled: true } as const;
    const [admins, customers] = await Promise.all([
      prisma.adminUser.findMany({ select }),
      prisma.customerUser.findMany({ select }),
    ]);
    return { admin: toMap(admins), customer: toMap(customers) };
  } catch (error) {
    console.warn("Could not read dev MFA enrollments — all users will re-enroll.", error);
    return { admin: new Map(), customer: new Map() };
  } finally {
    await prisma.$disconnect();
  }
}

async function applyDevMfa(devUrl: string, snapshot: DevMfaSnapshot) {
  const prisma = new PrismaClient({ datasources: { db: { url: devUrl } } });
  try {
    await prisma.adminUser.updateMany({ data: MFA_RESET });
    await prisma.customerUser.updateMany({ data: MFA_RESET });
    for (const [id, enrollment] of snapshot.admin) {
      await prisma.adminUser.updateMany({ where: { id }, data: enrollment });
    }
    for (const [id, enrollment] of snapshot.customer) {
      await prisma.customerUser.updateMany({ where: { id }, data: enrollment });
    }
    console.log(
      `MFA: kept ${snapshot.admin.size + snapshot.customer.size} dev enrollment(s); everyone else will set up MFA on next dev login.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

type DebugSnapshot = {
  sprints: unknown[];
  statuses: unknown[];
  tickets: unknown[];
  comments: unknown[];
  logs: unknown[];
};

async function snapshotDebugPortal(devUrl: string): Promise<DebugSnapshot | null> {
  const prisma = new PrismaClient({ datasources: { db: { url: devUrl } } });
  try {
    const [sprints, statuses, tickets, comments, logs] = await Promise.all([
      prisma.debugSprint.findMany(),
      prisma.debugTicketStatus.findMany(),
      prisma.debugCaptureTicket.findMany(),
      prisma.debugCaptureTicketComment.findMany(),
      prisma.debugCaptureTicketLog.findMany(),
    ]);
    console.log(
      `Debug portal snapshot: ${tickets.length} ticket(s), ${comments.length} comment(s), ${sprints.length} sprint(s).`,
    );
    return { sprints, statuses, tickets, comments, logs };
  } catch (error) {
    console.warn("Could not snapshot debug portal data — it will be replaced from production.", error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

async function restoreDebugPortal(devUrl: string, snapshot: DebugSnapshot) {
  const prisma = new PrismaClient({ datasources: { db: { url: devUrl } } });
  try {
    await prisma.$transaction(async (tx) => {
      await tx.debugCaptureTicketLog.deleteMany();
      await tx.debugCaptureTicketComment.deleteMany();
      await tx.debugCaptureTicket.deleteMany();
      await tx.debugSprint.deleteMany();
      await tx.debugTicketStatus.deleteMany();

      if (snapshot.statuses.length) {
        await tx.debugTicketStatus.createMany({ data: snapshot.statuses as never[], skipDuplicates: true });
      }
      if (snapshot.sprints.length) {
        await tx.debugSprint.createMany({ data: snapshot.sprints as never[], skipDuplicates: true });
      }
      if (snapshot.tickets.length) {
        await tx.debugCaptureTicket.createMany({ data: snapshot.tickets as never[], skipDuplicates: true });
      }
      if (snapshot.comments.length) {
        await tx.debugCaptureTicketComment.createMany({ data: snapshot.comments as never[], skipDuplicates: true });
      }
      if (snapshot.logs.length) {
        await tx.debugCaptureTicketLog.createMany({ data: snapshot.logs as never[], skipDuplicates: true });
      }
    });
    console.log(`Debug portal restored (${snapshot.tickets.length} ticket(s) kept on development).`);
  } finally {
    await prisma.$disconnect();
  }
}

async function anonymizeDevDatabase(devUrl: string, allowlist: Set<string>) {
  const prisma = new PrismaClient({ datasources: { db: { url: devUrl } } });
  try {
    const adminUsers = await prisma.adminUser.findMany({ select: { id: true, email: true, phone: true } });
    for (const row of adminUsers) {
      if (keepEmail(row.email, allowlist)) continue;
      await prisma.adminUser.update({
        where: { id: row.id },
        data: {
          email: anonymizedEmail(row.email, "AdminUser", row.id),
          phone: row.phone ? anonymizedPhone(row.phone, "AdminUser", row.id) : null,
        },
      });
    }

    const ticketingUsers = await prisma.ticketingUser.findMany({ select: { id: true, email: true } });
    for (const row of ticketingUsers) {
      if (keepEmail(row.email, allowlist)) continue;
      await prisma.ticketingUser.update({
        where: { id: row.id },
        data: { email: anonymizedEmail(row.email, "TicketingUser", row.id) },
      });
    }

    const customerUsers = await prisma.customerUser.findMany({
      select: { id: true, email: true, phone: true },
    });
    for (const row of customerUsers) {
      if (keepEmail(row.email, allowlist)) continue;
      await prisma.customerUser.update({
        where: { id: row.id },
        data: {
          email: anonymizedEmail(row.email, "CustomerUser", row.id),
          phone: row.phone ? anonymizedPhone(row.phone, "CustomerUser", row.id) : null,
        },
      });
    }

    const contacts = await prisma.clientContact.findMany({
      select: { id: true, email: true, phoneCountryCode: true, phoneNumber: true },
    });
    for (const row of contacts) {
      if (keepEmail(row.email, allowlist)) continue;
      const fakePhone = anonymizedPhone(row.phoneNumber, "ClientContact", row.id);
      await prisma.clientContact.update({
        where: { id: row.id },
        data: {
          email: anonymizedEmail(row.email, "ClientContact", row.id),
          phoneCountryCode: "+61",
          phoneNumber: fakePhone.replace(/^\+61/, ""),
        },
      });
    }

    const profiles = await prisma.candidateProfile.findMany({
      select: { id: true, email: true, phone: true },
    });
    for (const row of profiles) {
      if (keepEmail(row.email, allowlist)) continue;
      await prisma.candidateProfile.update({
        where: { id: row.id },
        data: {
          email: anonymizedEmail(row.email, "CandidateProfile", row.id),
          phone: anonymizedPhone(row.phone, "CandidateProfile", row.id),
        },
      });
    }

    const applications = await prisma.careerApplication.findMany({
      select: { id: true, email: true, phone: true },
    });
    for (const row of applications) {
      if (keepEmail(row.email, allowlist)) continue;
      await prisma.careerApplication.update({
        where: { id: row.id },
        data: {
          email: anonymizedEmail(row.email, "CareerApplication", row.id),
          phone: row.phone ? anonymizedPhone(row.phone, "CareerApplication", row.id) : null,
        },
      });
    }

    console.log(`Anonymization complete (kept ${allowlist.size} allowlisted email(s)).`);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const skipDump = envFlag("SKIP_DUMP", false);
  const preserveDebug = envFlag("CLONE_PRESERVE_DEBUG", true);
  const anonymizeEmails = envFlag("CLONE_ANONYMIZE_EMAILS", true);
  const allowlist = parseAllowlist();
  const devUrl = requireEnv("DEV_DATABASE_URL");
  assertNotProdTarget(devUrl);

  console.log(
    [
      `Options: preserveDebug=${preserveDebug} anonymizeEmails=${anonymizeEmails}`,
      `Allowlist: ${[...allowlist].join(", ") || "(none)"}`,
    ].join("\n"),
  );

  if (skipDump) {
    console.log("SKIP_DUMP set — anonymizing development only (no dump/restore).");
    if (anonymizeEmails) await anonymizeDevDatabase(devUrl, allowlist);
    await applyDevMfa(devUrl, { admin: new Map(), customer: new Map() });
    console.log("Done.");
    return;
  }

  assertPostgresCliOnPath();

  const prodUrl = requireEnv("PROD_DATABASE_URL");
  const workDir = mkdtempSync(join(tmpdir(), "tbos-prod-clone-"));
  const dumpPath = join(workDir, "prod.dump");
  const debugPath = join(workDir, "debug-snapshot.json");

  console.log("Saving development MFA enrollments…");
  const devMfa = await snapshotDevMfa(devUrl);

  let debugSnapshot: DebugSnapshot | null = null;
  if (preserveDebug) {
    console.log("Saving development debug portal tickets…");
    debugSnapshot = await snapshotDebugPortal(devUrl);
    if (debugSnapshot) writeFileSync(debugPath, JSON.stringify(debugSnapshot));
  }

  console.log("Dumping production database…");
  run("pg_dump", ["--format=custom", "--no-owner", "--no-acl", `--file=${dumpPath}`, prodUrl]);

  console.log("Restoring into development (this replaces dev data)…");
  run("pg_restore", ["--clean", "--if-exists", "--no-owner", "--no-acl", `--dbname=${devUrl}`, dumpPath]);

  if (anonymizeEmails) {
    console.log("Masking personal email and phone fields on development…");
    await anonymizeDevDatabase(devUrl, allowlist);
  } else {
    console.log("Skipping email/phone overwrite (CLONE_ANONYMIZE_EMAILS=0).");
  }

  console.log("Replacing production MFA secrets with development enrollments…");
  await applyDevMfa(devUrl, devMfa);

  if (preserveDebug && debugSnapshot) {
    console.log("Restoring development debug portal tickets…");
    await restoreDebugPortal(devUrl, debugSnapshot);
  }

  rmSync(workDir, { recursive: true, force: true });
  console.log("Done. Development database now mirrors production with the selected options.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
