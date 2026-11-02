import type { TicketStatus } from "@/lib/tickets";
import { resolveMediaPreviewUrl } from "@/lib/media-url";

export type AgentPromptTicket = {
  ticketId: string;
  type: string;
  status: TicketStatus;
  reportedEnvironment: string;
  userDescription: string;
  reporterEmail: string;
  reporterRole: string;
  reporterUserId?: string;
  currentUrl: string;
  userAgent: string;
  screenshotUrl: string | null;
  elementDiagnostics: unknown;
  apiPrerequisite: unknown;
  fullPayload: unknown;
  createdAt: string;
};

type ElementDiagnosticsShape = {
  tagName?: string;
  id?: string | null;
  className?: string | null;
  cssSelector?: string;
  innerText?: string | null;
  captureScope?: string;
  boundingRect?: { top: number; left: number; width: number; height: number };
};

type ApiPrerequisiteShape = {
  endpoint?: string;
  method?: string;
  status?: number | null;
  latencyMs?: number;
  captureSource?: string;
  payloadCaptured?: unknown;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function screenshotUrlForTicket(ticket: AgentPromptTicket): string | null {
  const direct = resolveMediaPreviewUrl(ticket.screenshotUrl);
  if (direct) return direct;
  const payload = asRecord(ticket.fullPayload);
  if (payload && typeof payload.screenshotUrl === "string") {
    return resolveMediaPreviewUrl(payload.screenshotUrl);
  }
  return null;
}

function formatJsonBlock(value: unknown, maxLen = 6000): string {
  try {
    const text = JSON.stringify(value, null, 2);
    if (text.length <= maxLen) return text;
    return `${text.slice(0, maxLen)}\n… (truncated)`;
  } catch {
    return String(value);
  }
}

/** Structured brief for a coding agent (Cursor, etc.) to reproduce and fix the reported issue. */
export function buildAgentIssuePrompt(ticket: AgentPromptTicket): string {
  const el = (ticket.elementDiagnostics ?? {}) as ElementDiagnosticsShape;
  const api = ticket.apiPrerequisite as ApiPrerequisiteShape | null;
  const shot = screenshotUrlForTicket(ticket);
  const lines: string[] = [];

  lines.push(`# Debug capture: ${ticket.ticketId}`);
  lines.push("");
  lines.push("## Summary");
  lines.push(`- **Type:** ${ticket.type}`);
  lines.push(`- **Reported environment:** ${ticket.reportedEnvironment}`);
  lines.push(`- **Page URL:** ${ticket.currentUrl}`);
  lines.push("");

  lines.push("## User report");
  lines.push(ticket.userDescription.trim() || "(No description provided.)");
  lines.push("");

  lines.push("## UI / DOM context");
  if (el.captureScope) lines.push(`- **Capture scope:** ${el.captureScope}`);
  if (el.tagName) lines.push(`- **Element tag:** ${el.tagName}`);
  if (el.id) lines.push(`- **Element id:** ${el.id}`);
  if (el.className) lines.push(`- **Element classes:** ${el.className}`);
  if (el.cssSelector) lines.push(`- **CSS selector path:** \`${el.cssSelector}\``);
  if (el.innerText) lines.push(`- **Visible text (trimmed):** ${el.innerText}`);
  if (el.boundingRect) {
    const r = el.boundingRect;
    lines.push(
      `- **Bounding rect (viewport px):** top ${r.top}, left ${r.left}, ${r.width}×${r.height}`,
    );
  }
  if (!el.tagName && !el.cssSelector) {
    lines.push("- (No element diagnostics recorded.)");
  }
  lines.push("");

  if (api?.endpoint) {
    lines.push("## API context at capture");
    lines.push(`- **${api.method ?? "GET"}** \`${api.endpoint}\``);
    if (api.status != null) lines.push(`- **HTTP status:** ${api.status}`);
    if (typeof api.latencyMs === "number") lines.push(`- **Latency:** ${api.latencyMs} ms`);
    if (api.captureSource) lines.push(`- **Source:** ${api.captureSource}`);
    lines.push("");
    lines.push("### Response / payload snapshot");
    lines.push("```json");
    lines.push(formatJsonBlock(api.payloadCaptured, 4000));
    lines.push("```");
    lines.push("");
  }

  lines.push("## Screenshot");
  if (shot) {
    lines.push(`Open the capture image for visual context: ${shot}`);
  } else {
    lines.push("No screenshot was stored for this ticket.");
  }
  lines.push("");

  lines.push("## Agent instructions");
  lines.push(
    "You are fixing an issue in the TechBubble TBOS monorepo (`techbubble-website`). Use the user report, page URL, DOM selector, API snapshot, and screenshot above to locate the root cause. Prefer a minimal, focused change that matches existing patterns. If the issue is environment-specific, call that out. After fixing, describe how to verify on the same page URL.",
  );
  lines.push("");
  lines.push("## Technical metadata");
  lines.push(`- **User-Agent:** ${ticket.userAgent}`);
  lines.push("");
  lines.push("<details>");
  lines.push("<summary>Full capture payload (JSON)</summary>");
  lines.push("");
  lines.push("```json");
  lines.push(formatJsonBlock(ticket.fullPayload, 8000));
  lines.push("```");
  lines.push("</details>");

  return lines.join("\n");
}

export function resolveTicketScreenshotUrl(ticket: AgentPromptTicket): string | null {
  return screenshotUrlForTicket(ticket);
}
