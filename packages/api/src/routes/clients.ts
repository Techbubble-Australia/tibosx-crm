import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma } from "@techbubble/database";
import { CLIENT_STATUSES } from "../lib/client-status";

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
  order: z.number().int().optional(),
  status: z.enum(CLIENT_STATUSES).default("ACTIVE"),
  contacts: z.array(contactSchema).optional().default([]),
});

function serializeClient(row: {
  id: string;
  name: string;
  website: string;
  country: string;
  order: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  contacts?: unknown[];
  _count?: { opportunities: number };
}) {
  return {
    id: row.id,
    name: row.name,
    website: row.website,
    country: row.country,
    order: row.order,
    status: row.status,
    opportunityCount: row._count?.opportunities ?? 0,
    contacts: row.contacts ?? [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function allocateNextClientOrder(): Promise<number> {
  const result = await prisma.client.aggregate({ _max: { order: true } });
  return (result._max.order ?? 0) + 1;
}

router.get("/next-order", async (_req, res) => {
  try {
    const order = await allocateNextClientOrder();
    res.json({ data: { order } });
  } catch (error) {
    console.error("Error fetching next client order:", error);
    res.status(500).json({ error: "Failed to fetch next order" });
  }
});

router.get("/", async (_req, res) => {
  try {
    const rows = await prisma.client.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: {
        contacts: {
          orderBy: [{ order: "asc" }, { name: "asc" }],
        },
        _count: { select: { opportunities: true } },
      },
    });
    res.json({ data: rows.map(serializeClient) });
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ error: "Failed to fetch clients" });
  }
});

router.patch("/reorder", async (req, res) => {
  try {
    const body = z.object({ orderedIds: z.array(z.string().min(1)).min(1) }).parse(req.body);
    await prisma.$transaction(
      body.orderedIds.map((id, index) =>
        prisma.client.update({ where: { id }, data: { order: index + 1 } }),
      ),
    );
    res.json({ message: "Reordered" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error reordering clients:", error);
    res.status(500).json({ error: "Failed to reorder clients" });
  }
});

router.patch("/:id/order", async (req, res) => {
  try {
    const body = z.object({ order: z.number().int() }).parse(req.body);
    const existing = await prisma.client.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: "Client not found" });
    }
    const row = await prisma.client.update({
      where: { id: req.params.id },
      data: { order: body.order },
      include: {
        contacts: {
          orderBy: [{ order: "asc" }, { name: "asc" }],
        },
        _count: { select: { opportunities: true } },
      },
    });
    res.json({ data: serializeClient(row) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error updating client order:", error);
    res.status(500).json({ error: "Failed to update client order" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (req.params.id === "next-order") {
      return res.status(404).json({ error: "Not found" });
    }
    const row = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        contacts: {
          orderBy: [{ order: "asc" }, { name: "asc" }],
        },
        _count: { select: { opportunities: true } },
      },
    });
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ data: serializeClient(row) });
  } catch (error) {
    console.error("Error fetching client:", error);
    res.status(500).json({ error: "Failed to fetch client" });
  }
});

router.post("/", async (req, res) => {
  try {
    const data = clientSchema.parse(req.body);
    const order = data.order && data.order > 0 ? data.order : await allocateNextClientOrder();
    const row = await prisma.client.create({
      data: {
        name: data.name,
        website: data.website ?? "",
        country: data.country,
        order,
        status: data.status,
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
        _count: { select: { opportunities: true } },
      },
    });
    res.status(201).json({ data: serializeClient(row) });
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
        _count: { select: { opportunities: true } },
      },
    });
    res.json({ data: serializeClient(row!) });
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
    const oppCount = await prisma.opportunity.count({ where: { clientId: req.params.id } });
    if (oppCount > 0) {
      return res.status(409).json({
        error: "Cannot delete client while opportunities reference it",
        opportunityCount: oppCount,
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
