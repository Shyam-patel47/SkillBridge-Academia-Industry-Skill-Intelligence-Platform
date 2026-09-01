import { Router } from "express";
import { healthRoutes } from "./health.routes.js";
import { authRoutes } from "../modules/auth/auth.routes.js";
import { studentRoutes } from "../modules/students/student.routes.js";
import { skillRoutes } from "../modules/skills/skill.routes.js";
import { assessmentRoutes } from "../modules/assessments/assessment.routes.js";
import { careerRoutes } from "../modules/careers/career.routes.js";
import { learningRoutes } from "../modules/learning/learning.routes.js";
import { companyRoutes } from "../modules/companies/company.routes.js";
import { opportunityRoutes } from "../modules/opportunities/opportunity.routes.js";
import { applicationRoutes } from "../modules/applications/application.routes.js";
import { portfolioRoutes } from "../modules/portfolios/portfolio.routes.js";
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

// Learning Recommendations & Programs routes
router.use("/learning", learningRoutes);

// Company & Industry Portal routes
router.use("/companies", companyRoutes);

// Industry Opportunities routes
router.use("/opportunities", opportunityRoutes);

// Application Lifecycle routes
router.use("/applications", applicationRoutes);

// Digital Portfolio routes
router.use("/portfolios", portfolioRoutes);

// RBAC Test routes
router.use("/test-role", testRoleRoutes);

export const apiRoutes = router;
