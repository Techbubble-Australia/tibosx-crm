import bcrypt from "bcryptjs";
import { prisma } from "../client";

const SALT_ROUNDS = 12;

export async function seedAdminUser(): Promise<void> {
  const email = process.env.ADMIN_EMAIL ?? "admin@techbubble.com";
  const password = process.env.ADMIN_PASSWORD ?? "admin123";
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  await prisma.adminUser.upsert({
    where: { email },
    create: { email, passwordHash, role: "admin" },
    update: { passwordHash, role: "admin" },
  });

  console.log(`✅ Admin user ready: ${email} (set ADMIN_EMAIL / ADMIN_PASSWORD to change)`);
}
