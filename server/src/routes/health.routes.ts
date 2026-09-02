import { Router, Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response.util.js";
import { config } from "../config/index.js";
import { prisma } from "../config/prisma.js";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  let dbStatus = "connected";
  let dbLatencyMs = 0;

  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - start;
  } catch (err: any) {
    dbStatus = "disconnected";
    console.error("Health check database probe failed:", err.message);
  }

  const memoryUsage = process.memoryUsage();

  const healthData = {
    status: dbStatus === "connected" ? "healthy" : "degraded",
    service: "SkillBridge Core Intelligence API",
    version: "1.0.0",
    environment: config.env,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
    },
    system: {
      heapUsedMB: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
      heapTotalMB:
        Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
      rssMB: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
    },
  };

  if (dbStatus !== "connected") {
    return sendError(
      res,
      "SkillBridge API operating in degraded state: Database unreachable.",
      503,
      "SERVICE_DEGRADED",
      healthData,
    );
  }

  sendSuccess(
    res,
    healthData,
    "SkillBridge API is operating normally with healthy database connection",
  );
});

export const healthRoutes = router;
