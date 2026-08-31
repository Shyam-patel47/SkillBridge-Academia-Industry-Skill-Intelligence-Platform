import { Router } from "express";
import { authController } from "./auth.controller.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from "./auth.schema.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authLimiter } from "../../middleware/rateLimiter.js";

const router = Router();

// Public Auth Endpoints (Rate Limited)
router.post(
  "/register",
  authLimiter,
  validateRequest(registerSchema),
  (req, res, next) => authController.register(req, res, next),
);

router.post(
  "/login",
  authLimiter,
  validateRequest(loginSchema),
  (req, res, next) => authController.login(req, res, next),
);

router.post("/refresh", validateRequest(refreshTokenSchema), (req, res, next) =>
  authController.refresh(req, res, next),
);

// Logout (can be called with or without auth token)
router.post("/logout", (req, res, next) =>
  authController.logout(req, res, next),
);

// Protected Auth Endpoints
router.get("/me", authenticate, (req, res, next) =>
  authController.getMe(req, res, next),
);

export const authRoutes = router;
