import { PrismaClient } from "../generated/client";

const globalForPrisma = globalThis as unknown as { ticketingPrisma?: PrismaClient };

export const ticketingPrisma =
  globalForPrisma.ticketingPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.ticketingPrisma = ticketingPrisma;
}

export * from "../generated/client";
