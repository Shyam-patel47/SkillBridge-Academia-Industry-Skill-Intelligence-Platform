import { createApp } from "./app.js";
import { config } from "./config/index.js";
import { prisma } from "./config/prisma.js";

const startServer = (): void => {
  const app = createApp();

  const server = app.listen(config.port, () => {
    console.log(`=========================================`);
    console.log(`🚀 SkillBridge Production Server Active!`);
    console.log(`📡 Environment: ${config.env}`);
    console.log(
      `🌐 API Base URL: http://localhost:${config.port}${config.apiPrefix}`,
    );
    console.log(
      `🩺 Health Probe: http://localhost:${config.port}${config.apiPrefix}/health`,
    );
    console.log(
      `📚 OpenAPI Docs: http://localhost:${config.port}${config.apiPrefix}/docs`,
    );
    console.log(`=========================================`);
  });

  // Graceful shutdown procedure
  let isShuttingDown = false;

  const handleShutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`\n[${signal}] Initiating graceful shutdown...`);

    // 1. Stop accepting new HTTP requests
    server.close(async () => {
      console.log("  ✅ HTTP server closed. In-flight requests completed.");

      try {
        // 2. Disconnect Prisma connection pool cleanly
        await prisma.$disconnect();
        console.log("  ✅ Prisma database connection pool disconnected.");
      } catch (err) {
        console.error("  ❌ Error disconnecting Prisma:", err);
      }

      console.log("🏁 SkillBridge shutdown complete. Exiting cleanly.");
      process.exit(0);
    });

    // 3. Force exit if shutdown hangs beyond 10 seconds
    setTimeout(() => {
      console.error("⚠️ Forced shutdown triggered after 10s timeout.");
      process.exit(1);
    }, 10000).unref();
  };

  // Process Signal Listeners
  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  process.on("SIGINT", () => handleShutdown("SIGINT"));

  // Global Exception Traps
  process.on("unhandledRejection", (reason, promise) => {
    console.error(
      "CRITICAL: Unhandled Promise Rejection at:",
      promise,
      "reason:",
      reason,
    );
  });

  process.on("uncaughtException", (error) => {
    console.error("FATAL: Uncaught Exception thrown:", error);
    handleShutdown("UNCAUGHT_EXCEPTION");
  });
};

startServer();
