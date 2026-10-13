import type { z } from "zod";

/** Human-readable summary for API error responses (still include details array when useful). */
export function formatZodError(error: z.ZodError): string {
  const parts = error.errors.map((e) => {
    const path = e.path.length > 0 ? `${e.path.join(".")}: ` : "";
    return `${path}${e.message}`;
  });
  if (parts.length === 0) return "Validation error";
  return parts.length === 1 ? parts[0]! : parts.join(" · ");
}
