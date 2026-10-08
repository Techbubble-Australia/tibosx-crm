import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@techbubble/database";

/** Ticketing user id used as message author / audit actor for TBOS staff actions. */
export async function resolveTbosActorUserId(tbosUser: {
  id: string;
  email: string;
  role: string;
}): Promise<string> {
  const email = tbosUser.email.toLowerCase();
  const tbosRole = tbosUser.role.trim().toLowerCase();

  let consultant = await prisma.ticketingUser.findFirst({
    where: {
      role: "CONSULTANT",
      consultantVerified: true,
      OR: [{ tbosAdminUserId: tbosUser.id }, { email }],
    },
  });

  if (!consultant) {
    consultant = await prisma.ticketingUser.create({
      data: {
        email,
        name: email.split("@")[0] || "TBOS User",
        passwordHash: await bcrypt.hash(randomUUID(), 10),
        role: "CONSULTANT",
        consultantVerified: true,
        tbosAdminUserId: tbosUser.id,
        tbosRole,
      },
    });
  } else if (!consultant.tbosAdminUserId || consultant.tbosRole !== tbosRole) {
    consultant = await prisma.ticketingUser.update({
      where: { id: consultant.id },
      data: {
        tbosAdminUserId: consultant.tbosAdminUserId ?? tbosUser.id,
        tbosRole,
      },
    });
  }

  return consultant.id;
}
