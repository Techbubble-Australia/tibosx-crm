import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma } from "@techbubble/database";

const router: IRouter = Router();

const contactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phoneCountryCode: z.string().min(1).max(8),
  phoneNumber: z.string().min(4).max(20),
  order: z.number().int().default(0),
});

const clientSchema = z.object({
  name: z.string().min(1).max(200),
  website: z.string().max(500).optional().default(""),
  country: z.string().min(1).max(200),
  order: z.number().int().default(0),
  active: z.boolean().default(true),
  contacts: z.array(contactSchema).optional().default([]),
});

router.get("/", async (_req, res) => {
  try {
    const rows = await prisma.client.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: {
        contacts: {
          orderBy: [{ order: "asc" }, { name: "asc" }],
        },
      },
    });
    res.json({ data: rows });
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ error: "Failed to fetch clients" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const row = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        contacts: {
          orderBy: [{ order: "asc" }, { name: "asc" }],
        },
      },
    });
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ data: row });
  } catch (error) {
    console.error("Error fetching client:", error);
    res.status(500).json({ error: "Failed to fetch client" });
  }
});

router.post("/", async (req, res) => {
  try {
    const data = clientSchema.parse(req.body);
    const row = await prisma.client.create({
      data: {
        name: data.name,
        website: data.website ?? "",
        country: data.country,
        order: data.order,
        active: data.active,
        contacts: {
          create: data.contacts.map((contact, index) => ({
            name: contact.name,
            email: contact.email,
            phoneCountryCode: contact.phoneCountryCode,
            phoneNumber: contact.phoneNumber,
            order: contact.order ?? index,
          })),
        },
      },
      include: {
        contacts: {
          orderBy: [{ order: "asc" }, { name: "asc" }],
        },
      },
    });
    res.status(201).json({ data: row });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error creating client:", error);
    res.status(500).json({ error: "Failed to create client" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const data = clientSchema.partial().parse(req.body);
    const existing = await prisma.client.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: "Not found" });
    }

    const { contacts, ...clientFields } = data;

    await prisma.$transaction(async (tx) => {
      await tx.client.update({
        where: { id: req.params.id },
        data: clientFields,
      });

      if (contacts) {
        await tx.clientContact.deleteMany({ where: { clientId: req.params.id } });
        for (let index = 0; index < contacts.length; index++) {
          const contact = contacts[index]!;
          await tx.clientContact.create({
            data: {
              clientId: req.params.id,
              name: contact.name,
              email: contact.email,
              phoneCountryCode: contact.phoneCountryCode,
              phoneNumber: contact.phoneNumber,
              order: contact.order ?? index,
            },
          });
        }
      }
    });

    const row = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        contacts: {
          orderBy: [{ order: "asc" }, { name: "asc" }],
        },
      },
    });
    res.json({ data: row });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error updating client:", error);
    res.status(500).json({ error: "Failed to update client" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const jobCount = await prisma.jobListing.count({ where: { clientId: req.params.id } });
    if (jobCount > 0) {
      return res.status(409).json({
        error: "Cannot delete client while job listings reference it",
        jobCount,
      });
    }
    await prisma.client.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted" });
  } catch (error) {
    console.error("Error deleting client:", error);
    res.status(500).json({ error: "Failed to delete client" });
  }
});

export { router as clientRoutes };
