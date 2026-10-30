/**
 * Copy production PostgreSQL to development with email/phone anonymization.
 *
 * Requires: pg_dump, pg_restore, psql on PATH.
 *
 * Usage:
 *   PROD_DATABASE_URL="postgresql://..." DEV_DATABASE_URL="postgresql://..." \
 *     pnpm --filter @techbubble/database db:clone-prod-to-dev
 *
 * Whitelisted emails are left unchanged (see ANONYMIZE_EMAIL_ALLOWLIST).
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

    const contacts = await prisma.clientContact.findMany({
      select: { id: true, email: true, phone: true },
    });
    for (const row of contacts) {
      if (keepEmail(row.email)) continue;
      await prisma.clientContact.update({
        where: { id: row.id },
        data: {
          email: anonymizedEmail(row.email, "ClientContact", row.id),
          phone: row.phone ? anonymizedPhone(row.phone, "ClientContact", row.id) : null,
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
  assertPostgresCliOnPath();

  const prodUrl = requireEnv("PROD_DATABASE_URL");
  const devUrl = requireEnv("DEV_DATABASE_URL");

  const workDir = mkdtempSync(join(tmpdir(), "tbos-prod-clone-"));
  const dumpPath = join(workDir, "prod.dump");

  console.log("Dumping production database…");
  run("pg_dump", ["--format=custom", "--no-owner", "--no-acl", `--file=${dumpPath}`, prodUrl]);

  console.log("Restoring into development (this replaces dev data)…");
  run("pg_restore", ["--clean", "--if-exists", "--no-owner", "--no-acl", `--dbname=${devUrl}`, dumpPath]);

  console.log("Masking personal email and phone fields on development…");
  await anonymizeDevDatabase(devUrl);

  rmSync(workDir, { recursive: true, force: true });
  console.log("Done. Development database now mirrors production with anonymized contact details.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
