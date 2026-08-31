import { Router, Request, Response } from "express";
import { sendSuccess } from "../utils/response.util.js";
import { config } from "../config/index.js";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  const healthData = {
    status: "healthy",
    service: "SkillBridge API",
    uptime: `${process.uptime().toFixed(2)}s`,
    timestamp: new Date().toISOString(),
    environment: config.env,
    version: "1.0.0",
  };

  sendSuccess(res, healthData, "SkillBridge API is operating normally");
});

export const healthRoutes = router;
