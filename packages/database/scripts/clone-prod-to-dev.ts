/**
 * Copy production PostgreSQL to development with email/phone anonymization.
 *
 * Requires: pg_dump, pg_restore, psql on PATH.
 *
 * Usage:
 *   PROD_DATABASE_URL="postgresql://..." DEV_DATABASE_URL="postgresql://..." \
 *     pnpm --filter @techbubble/database db:clone-prod-to-dev
 *
 * If dump/restore already succeeded and only anonymization failed:
 *   SKIP_DUMP=1 DEV_DATABASE_URL="postgresql://..." PROD_DATABASE_URL=x \
 *     pnpm --filter @techbubble/database db:clone-prod-to-dev
 * Whitelisted emails are left unchanged (see ANONYMIZE_EMAIL_ALLOWLIST).
 *
 * MFA: production authenticator secrets are never kept on development. Existing dev enrollments are
 * restored after the copy; every other account must set up MFA again on dev (DEV.TIBOSX.AI entry).
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

const POSTGRES_CLI = ["pg_dump", "pg_restore"] as const;

const ANONYMIZE_EMAIL_ALLOWLIST = new Set(
  ["jeet@techbubble.com.au", "dhruv@techbubble.com.au"].map((e) => e.toLowerCase()),
);

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`Missing ${name}`);
    process.exit(1);
  }
  return value;
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
      '  export PATH="/opt/homebrew/opt/libpq/bin:$PATH"   # Apple Silicon',
      '  export PATH="/usr/local/opt/libpq/bin:$PATH"     # Intel Mac',
      "",
      "Then re-run:",
      "  PROD_DATABASE_URL=... DEV_DATABASE_URL=... pnpm --filter @techbubble/database db:clone-prod-to-dev",
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

function keepEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ANONYMIZE_EMAIL_ALLOWLIST.has(email.trim().toLowerCase());
}

type DevMfaEnrollment = { totpSecretEnc: string; mfaEnrolledAt: Date | null; mfaEnabled: boolean };
type DevMfaSnapshot = { admin: Map<string, DevMfaEnrollment>; customer: Map<string, DevMfaEnrollment> };

const MFA_RESET = { mfaEnabled: true, totpSecretEnc: null, mfaEnrolledAt: null } as const;

/** Dev authenticator enrollments (by user id) to put back after the production copy. */
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
    console.warn("Could not read dev MFA enrollments (empty or new dev DB?) — all users will re-enroll.", error);
    return { admin: new Map(), customer: new Map() };
  } finally {
    await prisma.$disconnect();
  }
}

/** Replace copied production MFA secrets with dev enrollments, or clear them so users re-enroll on dev. */
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

async function anonymizeDevDatabase(devUrl: string) {
  const prisma = new PrismaClient({ datasources: { db: { url: devUrl } } });
  try {
    const adminUsers = await prisma.adminUser.findMany({ select: { id: true, email: true, phone: true } });
    for (const row of adminUsers) {
      if (keepEmail(row.email)) continue;
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
      if (keepEmail(row.email)) continue;
      await prisma.ticketingUser.update({
        where: { id: row.id },
        data: { email: anonymizedEmail(row.email, "TicketingUser", row.id) },
      });
    }

    const customerUsers = await prisma.customerUser.findMany({
      select: { id: true, email: true, phone: true },
    });
    for (const row of customerUsers) {
      if (keepEmail(row.email)) continue;
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
      if (keepEmail(row.email)) continue;
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
      if (keepEmail(row.email)) continue;
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
      if (keepEmail(row.email)) continue;
      await prisma.careerApplication.update({
        where: { id: row.id },
        data: {
          email: anonymizedEmail(row.email, "CareerApplication", row.id),
          phone: row.phone ? anonymizedPhone(row.phone, "CareerApplication", row.id) : null,
        },
      });
    }

    console.log("Anonymization complete (allowlisted emails unchanged).");
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const skipDump = process.env.SKIP_DUMP === "1" || process.env.SKIP_DUMP === "true";
  const devUrl = requireEnv("DEV_DATABASE_URL");

  if (skipDump) {
    console.log("SKIP_DUMP set — anonymizing development only (no dump/restore).");
    await anonymizeDevDatabase(devUrl);
    // Dev was already overwritten, so its own enrollments are gone; clear the copied prod secrets.
    await applyDevMfa(devUrl, { admin: new Map(), customer: new Map() });
    console.log("Done.");
    return;
  }

  assertPostgresCliOnPath();

  const prodUrl = requireEnv("PROD_DATABASE_URL");
  const workDir = mkdtempSync(join(tmpdir(), "tbos-prod-clone-"));
  const dumpPath = join(workDir, "prod.dump");

  console.log("Saving development MFA enrollments…");
  const devMfa = await snapshotDevMfa(devUrl);

  console.log("Dumping production database…");
  run("pg_dump", ["--format=custom", "--no-owner", "--no-acl", `--file=${dumpPath}`, prodUrl]);

  console.log("Restoring into development (this replaces dev data)…");
  run("pg_restore", ["--clean", "--if-exists", "--no-owner", "--no-acl", `--dbname=${devUrl}`, dumpPath]);

  console.log("Masking personal email and phone fields on development…");
  await anonymizeDevDatabase(devUrl);

  console.log("Replacing production MFA secrets with development enrollments…");
  await applyDevMfa(devUrl, devMfa);

  rmSync(workDir, { recursive: true, force: true });
  console.log("Done. Development database now mirrors production with anonymized contact details.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
