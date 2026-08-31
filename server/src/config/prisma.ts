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

export default prisma;
