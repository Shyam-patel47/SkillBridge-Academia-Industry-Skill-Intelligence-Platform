import { Router } from "express";
import { healthRoutes } from "./health.routes.js";
import { authRoutes } from "../modules/auth/auth.routes.js";
import { testRoleRoutes } from "./test-role.routes.js";

const router = Router();

// Base health route
router.use("/health", healthRoutes);

// Auth routes
router.use("/auth", authRoutes);

// RBAC Test routes
router.use("/test-role", testRoleRoutes);

export const apiRoutes = router;
