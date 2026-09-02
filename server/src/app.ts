import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import { config } from "./config/index.js";
import { apiRoutes } from "./routes/index.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { notFoundHandler } from "./middleware/notFound.middleware.js";
import {
  apiLimiter,
  authLimiter,
  aiLimiter,
} from "./middleware/rateLimiter.js";

// Extend Express Request type with correlation id
declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

export const createApp = (): Express => {
  const app = express();

  // Trust first proxy if behind reverse proxy (Nginx / Cloudflare / Load Balancer)
  app.set("trust proxy", 1);

  // Request Correlation ID Middleware (X-Request-Id)
  app.use((req: Request, res: Response, next: NextFunction) => {
    const incomingReqId = req.headers["x-request-id"] as string | undefined;
    const reqId = incomingReqId || crypto.randomUUID();
    req.id = reqId;
    res.setHeader("X-Request-Id", reqId);
    next();
  });

  // Hardened Security Headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
          ],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: [
            "'self'",
            config.clientUrl,
            "https://generativelanguage.googleapis.com",
          ],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: config.isProduction ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: "same-origin" },
      crossOriginResourcePolicy: { policy: "cross-origin" },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: "deny" }, // Anti-clickjacking
      hidePoweredBy: true, // Prevent X-Powered-By leakage
      hsts: config.isProduction
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
      noSniff: true, // Prevent MIME-type sniffing
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      xssFilter: true, // Reflective XSS filter
    }),
  );

  // CORS Configuration
  const allowedOrigins = [
    config.clientUrl,
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (
          !origin ||
          allowedOrigins.includes(origin) ||
          !config.isProduction
        ) {
          callback(null, true);
        } else {
          callback(new Error("CORS policy violation: Unauthorized origin"));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-Request-Id",
      ],
      exposedHeaders: [
        "RateLimit-Limit",
        "RateLimit-Remaining",
        "RateLimit-Reset",
        "X-Request-Id",
      ],
      maxAge: 86400, // 24 hours preflight cache
    }),
  );

  // Cookie parser
  app.use(cookieParser());

  // Environment-Aware Structured Request Logging
  morgan.token("req-id", (req: Request) => req.id || "-");

  if (config.isDevelopment) {
    app.use(
      morgan(
        "[:req-id] :method :url :status :response-time ms - :res[content-length]",
      ),
    );
  } else {
    // Production structured logging without leaking sensitive payloads
    app.use(
      morgan(
        JSON.stringify({
          reqId: ":req-id",
          timestamp: ":date[iso]",
          method: ":method",
          url: ":url",
          status: ":status",
          durationMs: ":response-time",
          bytes: ":res[content-length]",
          ip: ":remote-addr",
          userAgent: ":user-agent",
        }),
      ),
    );
  }

  // Safe Request Body Parsers (prevent body size exhaustion attacks)
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true, limit: "5mb" }));

  // Root Welcome & Health Endpoint
  app.get("/", (_req, res) => {
    res.json({
      service: "SkillBridge Skill Intelligence API",
      status: "active",
      version: "1.0.0",
      security: {
        hsts: config.isProduction,
        rateLimiting: "active",
        rbac: "enforced",
      },
      apiDocs: `${config.apiPrefix}/docs`,
      health: `${config.apiPrefix}/health`,
    });
  });

  // Dedicated Rate Limiting for Auth & AI Compute Endpoints
  app.use(`${config.apiPrefix}/auth`, authLimiter);
  app.use("/api/auth", authLimiter);
  app.use(`${config.apiPrefix}/resumes/extract`, aiLimiter);
  app.use(`${config.apiPrefix}/opportunities/parse-jd`, aiLimiter);

  // Global API Rate Limiter
  app.use(config.apiPrefix, apiLimiter, apiRoutes);
  if (config.apiPrefix !== "/api") {
    app.use("/api", apiLimiter, apiRoutes);
  }

  // 404 Handler
  app.use(notFoundHandler);

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
