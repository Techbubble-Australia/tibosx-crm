import { Router, type IRouter } from "express";
import { z } from "zod";
import { prisma } from "@techbubble/database";
import {
  CREDENTIAL_VARIABLE_TYPES,
  mergeVariablesFromHtml,
  type CredentialTemplateVariable,
} from "../lib/credential-template-vars";

const router: IRouter = Router();

const variableSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(CREDENTIAL_VARIABLE_TYPES),
  options: z.array(z.string()).default([]),
  required: z.boolean().default(true),
});

const templateSchema = z.object({
  name: z.string().min(1).max(200),
  html: z.string().min(1),
  variables: z.array(variableSchema).optional(),
});

function serializeTemplate(row: {
  id: string;
  name: string;
  html: string;
  variables: unknown;
  createdAt: Date;
  updatedAt: Date;
}) {
  const variables = Array.isArray(row.variables) ? (row.variables as CredentialTemplateVariable[]) : [];
  return {
    id: row.id,
    name: row.name,
    html: row.html,
    variables,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

router.get("/", async (_req, res) => {
  try {
    const rows = await prisma.credentialTemplate.findMany({ orderBy: { name: "asc" } });
    res.json({ data: rows.map(serializeTemplate) });
  } catch (error) {
    console.error("Error fetching credential templates:", error);
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const row = await prisma.credentialTemplate.findUnique({ where: { id: req.params.id } });
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ data: serializeTemplate(row) });
  } catch (error) {
    console.error("Error fetching credential template:", error);
    res.status(500).json({ error: "Failed to fetch template" });
  }
});

router.post("/parse-variables", async (req, res) => {
  try {
    const html = z.object({ html: z.string() }).parse(req.body).html;
    const variables = mergeVariablesFromHtml(html);
    res.json({ data: variables });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    res.status(500).json({ error: "Failed to parse variables" });
  }
});

router.post("/", async (req, res) => {
  try {
    const data = templateSchema.parse(req.body);
    const variables = data.variables?.length
      ? data.variables
      : mergeVariablesFromHtml(data.html);
    const row = await prisma.credentialTemplate.create({
      data: { name: data.name.trim(), html: data.html, variables },
    });
    res.status(201).json({ data: serializeTemplate(row) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error creating credential template:", error);
    res.status(500).json({ error: "Failed to create template" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const data = templateSchema.parse(req.body);
    const variables = data.variables?.length
      ? data.variables
      : mergeVariablesFromHtml(data.html);
    const row = await prisma.credentialTemplate.update({
      where: { id: req.params.id },
      data: { name: data.name.trim(), html: data.html, variables },
    });
    res.json({ data: serializeTemplate(row) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("Error updating credential template:", error);
    res.status(500).json({ error: "Failed to update template" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.credentialTemplate.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted" });
  } catch (error) {
    console.error("Error deleting credential template:", error);
    res.status(500).json({ error: "Failed to delete template" });
  }
});

export { router as credentialTemplateRoutes };
