import { Router } from "express";
import { healthRoutes } from "./health.routes.js";
import { authRoutes } from "../modules/auth/auth.routes.js";
import { studentRoutes } from "../modules/students/student.routes.js";
import { skillRoutes } from "../modules/skills/skill.routes.js";
import { assessmentRoutes } from "../modules/assessments/assessment.routes.js";
import { careerRoutes } from "../modules/careers/career.routes.js";
import { testRoleRoutes } from "./test-role.routes.js";

const router = Router();

// Base health route
router.use("/health", healthRoutes);

// Auth routes
router.use("/auth", authRoutes);

// Student Profile routes
router.use("/students", studentRoutes);

// Skill Taxonomy routes
router.use("/skills", skillRoutes);

// Assessment Engine routes
router.use("/assessments", assessmentRoutes);

// Career Intelligence & Skill Gap routes
router.use("/careers", careerRoutes);

// RBAC Test routes
router.use("/test-role", testRoleRoutes);

export const apiRoutes = router;
