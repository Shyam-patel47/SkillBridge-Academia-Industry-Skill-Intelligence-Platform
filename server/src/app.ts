import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { config } from "./config/index.js";
import { apiRoutes } from "./routes/index.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { notFoundHandler } from "./middleware/notFound.middleware.js";

export const createApp = (): Express => {
  const app = express();

  // Security Headers
  app.use(helmet());

  // CORS
  app.use(
    cors({
      origin: [
        config.clientUrl,
        "http://localhost:5173",
        "http://localhost:3000",
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  // Cookie parser
  app.use(cookieParser());

  // Request Logging
  if (config.isDevelopment) {
    app.use(morgan("dev"));
  } else {
    app.use(morgan("combined"));
  }

  // Body Parsers
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Root Welcome Endpoint
  app.get("/", (_req, res) => {
    res.json({
      service: "SkillBridge API",
      status: "active",
      version: "1.0.0",
      apiDocs: `${config.apiPrefix}/health`,
    });
  });

  // Mount API Routes under both configured prefix (e.g. /api/v1) and /api
  app.use(config.apiPrefix, apiRoutes);
  if (config.apiPrefix !== "/api") {
    app.use("/api", apiRoutes);
  }

  // 404 Handler
  app.use(notFoundHandler);

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
