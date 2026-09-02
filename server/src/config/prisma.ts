import { PrismaClient } from "@prisma/client";
import { config } from "./index.js";

// Global singleton declaration to avoid multiple instances in development HMR
declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    log: config.isDevelopment ? ["query", "error", "warn"] : ["error"],
  });

if (config.isDevelopment) {
  globalThis.prismaGlobal = prisma;
}

/**
 * Sensible NeonDB cold-start and connection resilience helper.
 * Attempts to connect with exponential backoff on transient startup delays.
 */
export async function connectPrismaWithRetry(
  maxRetries = 3,
  initialDelayMs = 500,
): Promise<boolean> {
  let attempt = 0;
  let delay = initialDelayMs;

  while (attempt < maxRetries) {
    try {
      attempt++;
      await prisma.$queryRaw`SELECT 1`;
      if (config.isDevelopment) {
        console.log(
          `[Database] PostgreSQL / NeonDB connection established successfully.`,
        );
      }
      return true;
    } catch (err: any) {
      console.warn(
        `[Database] Connection attempt ${attempt}/${maxRetries} to database failed: ${err.message}. Retrying in ${delay}ms...`,
      );
      if (attempt >= maxRetries) {
        console.error(
          `[Database] CRITICAL: Failed to connect to database after ${maxRetries} attempts.`,
        );
        return false;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  return false;
}

export default prisma;
