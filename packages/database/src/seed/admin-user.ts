import { ensureBootstrapAdminUser, getBootstrapAdminEmail } from "../bootstrap-admin";

export async function seedAdminUser(): Promise<void> {
  await ensureBootstrapAdminUser();
  console.log(
    `✅ Bootstrap admin ready: ${getBootstrapAdminEmail()} (set ADMIN_EMAIL / ADMIN_PASSWORD to change)`,
  );
}
