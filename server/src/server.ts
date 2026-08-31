import { createApp } from "./app.js";
import { config } from "./config/index.js";

const startServer = (): void => {
  const app = createApp();

  const server = app.listen(config.port, () => {
    console.log(`=========================================`);
    console.log(`🚀 SkillBridge Server Running!`);
    console.log(`📡 Environment: ${config.env}`);
    console.log(`🌐 URL: http://localhost:${config.port}`);
    console.log(
      `🩺 Health: http://localhost:${config.port}${config.apiPrefix}/health`,
    );
    console.log(`=========================================`);
  });

  // Graceful shutdown handling
  const handleShutdown = (signal: string) => {
    console.log(`\nReceived ${signal}. Gracefully terminating server...`);
    server.close(() => {
      console.log("SkillBridge HTTP server closed.");
      process.exit(0);
    });

    // Force shutdown if taking too long
    setTimeout(() => {
      console.error("Forced shutdown due to timeout.");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  process.on("SIGINT", () => handleShutdown("SIGINT"));
};

startServer();
