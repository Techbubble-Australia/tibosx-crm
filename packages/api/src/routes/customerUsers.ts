import { Router, type IRouter } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@techbubble/database";
import type { AuthRequest } from "../middleware/auth";
import { assertMappedContactAvailable } from "../lib/admin-user-contact-map";
import { emailTbosUserInvite, tbosLoginUrl } from "../lib/user-invite";
import { sendPasswordResetEmail } from "../lib/mail";
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
  PASSWORD_RESET_TTL_MS,
} from "../lib/password-reset";

const router: IRouter = Router();

const listSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  active: true,
  profilePhotoUrl: true,
  passwordNeedsReset: true,
  mappedClientContactId: true,
  mfaEnabled: true,
  mfaEnrolledAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

function serialize(row: {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  active: boolean;
  profilePhotoUrl: string | null;
  passwordNeedsReset: boolean;
  mappedClientContactId: string | null;
  mfaEnabled: boolean;
  mfaEnrolledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone,
    active: row.active,
    profilePhotoUrl: row.profilePhotoUrl,
    passwordNeedsReset: row.passwordNeedsReset,
    mappedClientContactId: row.mappedClientContactId,
    mfaEnabled: row.mfaEnabled,
    mfaEnrolledAt: row.mfaEnrolledAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const updateSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().max(200).optional().nullable(),
  phone: z.string().min(1).max(50).optional(),
  active: z.boolean().optional(),
  password: z.string().min(8).optional(),
  profilePhotoUrl: z.string().max(2000).optional().nullable(),
  mappedClientContactId: z.string().min(1).optional().nullable(),
  passwordNeedsReset: z.boolean().optional(),
});

router.get("/", async (_req, res) => {
  try {
    const rows = await prisma.customerUser.findMany({
      orderBy: { email: "asc" },
      select: listSelect,
    });
    res.json({ data: rows.map(serialize) });
  } catch (error) {
    console.error("Error fetching customer users:", error);
    res.status(500).json({ error: "Failed to fetch customer users" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const row = await prisma.customerUser.findUnique({
      where: { id: req.params.id },
      select: {
        ...listSelect,
        mappedClientContact: {
          select: {
            id: true,
            name: true,
            email: true,
            client: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({
      data: {
        ...serialize(row),
        mappedClientContact: row.mappedClientContact
          ? {
              id: row.mappedClientContact.id,
              name: row.mappedClientContact.name,
              email: row.mappedClientContact.email,
              clientId: row.mappedClientContact.client.id,
              clientName: row.mappedClientContact.client.name,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Error fetching customer user:", error);
    res.status(500).json({ error: "Failed to fetch customer user" });
  }
});

router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const input = updateSchema.parse(req.body);
    const existing = await prisma.customerUser.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Not found" });

    if (input.mappedClientContactId !== undefined && input.mappedClientContactId) {
      const contactError = await assertMappedContactAvailable(input.mappedClientContactId, existing.id);
      if (contactError) return res.status(400).json({ error: contactError });
    }

    const patch: Record<string, unknown> = {};
    if (input.email !== undefined) patch.email = input.email.trim().toLowerCase();
    if (input.name !== undefined) patch.name = input.name?.trim() || null;
    if (input.phone !== undefined) patch.phone = input.phone.trim();
    if (input.active !== undefined) patch.active = input.active;
    if (input.profilePhotoUrl !== undefined) patch.profilePhotoUrl = input.profilePhotoUrl;
    if (input.mappedClientContactId !== undefined) {
      patch.mappedClientContactId = input.mappedClientContactId;
    }
    if (input.passwordNeedsReset !== undefined) {
      patch.passwordNeedsReset = input.passwordNeedsReset;
    }
    if (input.password) {
      patch.passwordHash = await bcrypt.hash(input.password, 10);
      patch.passwordNeedsReset = false;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.customerUser.update({
        where: { id: existing.id },
        data: patch,
        select: listSelect,
      });
      const adminSync: Record<string, unknown> = {
        email: row.email,
        name: row.name,
        phone: row.phone,
        active: row.active,
        profilePhotoUrl: row.profilePhotoUrl,
        mappedClientContactId: row.mappedClientContactId,
      };
      if (input.password) {
        adminSync.passwordHash = patch.passwordHash;
        adminSync.passwordNeedsReset = false;
      }
      if (input.passwordNeedsReset !== undefined) {
        adminSync.passwordNeedsReset = input.passwordNeedsReset;
      }
      await tx.adminUser.updateMany({
        where: {
          OR: [
            { id: existing.id },
            { email: { equals: existing.email, mode: "insensitive" } },
          ],
        },
        data: adminSync,
      });
      return row;
    });

    res.json({ data: serialize(updated) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error updating customer user:", error);
    res.status(500).json({ error: "Failed to update customer user" });
  }
});

router.post("/:id/invite", async (req: AuthRequest, res) => {
  try {
    const userId = req.params.id;
    if (!userId) return res.status(400).json({ error: "Invalid id" });
    const user = await prisma.customerUser.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, active: true },
    });
    if (!user) return res.status(404).json({ error: "Not found" });
    if (!user.active) return res.status(400).json({ error: "User is inactive" });

    const temporaryPassword = randomBytes(12).toString("base64url");
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    await prisma.$transaction([
      prisma.customerUser.update({
        where: { id: userId },
        data: { passwordHash, passwordNeedsReset: true },
      }),
      prisma.adminUser.updateMany({
        where: { id: userId, role: "client" },
        data: { passwordHash, passwordNeedsReset: true },
      }),
    ]);

    try {
      await emailTbosUserInvite({
        to: user.email,
        name: user.name || user.email,
        temporaryPassword,
        context: "client",
      });
    } catch (emailErr) {
      console.error("Error sending customer user invite:", emailErr);
      const message =
        emailErr instanceof Error ? emailErr.message : "Failed to send invite email";
      return res.status(502).json({
        error: `${message} The user's password was reset — share the temporary password manually.`,
        inviteEmailSent: false,
        temporaryPassword,
        passwordReset: true,
      });
    }

    res.json({
      message: "Invite email sent. A new temporary password replaced any previous password on this account.",
      inviteEmailSent: true,
      passwordReset: true,
    });
  } catch (error) {
    console.error("Error sending customer user invite:", error);
    const message = error instanceof Error ? error.message : "Failed to send invite email";
    res.status(500).json({ error: message });
  }
});

router.post("/:id/reset-password", async (req: AuthRequest, res) => {
  try {
    const userId = req.params.id;
    if (!userId) return res.status(400).json({ error: "Invalid id" });
    const user = await prisma.customerUser.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, active: true },
    });
    if (!user) return res.status(404).json({ error: "Not found" });
    if (!user.active) return res.status(400).json({ error: "User is inactive" });

    const rawToken = generatePasswordResetToken();
    const tokenHash = hashPasswordResetToken(rawToken);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
    const resetUrl = `${tbosLoginUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;

    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name?.trim() || "",
        resetUrl,
      });
    } catch (emailErr) {
      console.error("Customer password reset email failed:", emailErr);
      return res.status(503).json({ error: "Could not send reset email. Check mail settings and try again." });
    }

    const tokenPatch = {
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: expiresAt,
    };
    await prisma.$transaction([
      prisma.customerUser.update({ where: { id: user.id }, data: tokenPatch }),
      prisma.adminUser.updateMany({
        where: {
          OR: [{ id: user.id }, { email: { equals: user.email, mode: "insensitive" } }],
        },
        data: tokenPatch,
      }),
    ]);

    res.json({
      message: `Password reset email sent to ${user.email}. The link expires in 24 hours.`,
      emailSent: true,
    });
  } catch (error) {
    console.error("Error sending customer password reset:", error);
    res.status(500).json({ error: "Failed to send password reset email" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) return res.status(400).json({ error: "Invalid id" });
    const existing = await prisma.customerUser.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!existing) return res.status(404).json({ error: "Not found" });
    await prisma.$transaction([
      prisma.customerUser.delete({ where: { id: userId } }),
      prisma.adminUser.deleteMany({ where: { id: userId, role: "client" } }),
    ]);
    res.json({ message: "Customer user deleted" });
  } catch (error) {
    console.error("Error deleting customer user:", error);
    res.status(500).json({ error: "Failed to delete customer user" });
  }
});

router.post("/:id/deactivate", async (req, res) => {
  try {
    const row = await prisma.customerUser.update({
      where: { id: req.params.id },
      data: { active: false },
      select: listSelect,
    });
    await prisma.adminUser.updateMany({
      where: { id: req.params.id, role: "client" },
      data: { active: false },
    });
    res.json({ data: serialize(row) });
  } catch (error) {
    console.error("Error deactivating customer user:", error);
    res.status(500).json({ error: "Failed to deactivate customer user" });
  }
});

export { router as customerUserRoutes };
