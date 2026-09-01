import { Router } from "express";
import { UserRole } from "@prisma/client";
import { portfolioController } from "./portfolio.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../middleware/role.middleware.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import {
  updatePortfolioSettingsSchema,
  createProjectSchema,
  updateProjectSchema,
  createCertificationSchema,
  updateCertificationSchema,
  createAchievementSchema,
  updateAchievementSchema,
} from "./portfolio.schema.js";

const router = Router();

// ==========================================
// 1. Public Portfolio Endpoint (Unauthenticated)
// ==========================================
router.get("/public/:slug", (req, res, next) =>
  portfolioController.getPublicPortfolio(req, res, next),
);

// ==========================================
// 2. Student Portfolio Studio (Protected: STUDENT)
// ==========================================
router.get(
  "/me",
  authenticate,
  authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
  (req, res, next) => portfolioController.getMyPortfolio(req, res, next),
);

router.patch(
  "/me/settings",
  authenticate,
  authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
  validateRequest(updatePortfolioSettingsSchema),
  (req, res, next) =>
    portfolioController.updatePortfolioSettings(req, res, next),
);

// ==========================================
// 3. Projects CRUD (Protected: STUDENT)
// ==========================================
router.post(
  "/me/projects",
  authenticate,
  authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
  validateRequest(createProjectSchema),
  (req, res, next) => portfolioController.addProject(req, res, next),
);

router.patch(
  "/me/projects/:id",
  authenticate,
  authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
  validateRequest(updateProjectSchema),
  (req, res, next) => portfolioController.updateProject(req, res, next),
);

router.delete(
  "/me/projects/:id",
  authenticate,
  authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
  (req, res, next) => portfolioController.deleteProject(req, res, next),
);

// ==========================================
// 4. Certifications CRUD (Protected: STUDENT)
// ==========================================
router.post(
  "/me/certifications",
  authenticate,
  authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
  validateRequest(createCertificationSchema),
  (req, res, next) => portfolioController.addCertification(req, res, next),
);

router.patch(
  "/me/certifications/:id",
  authenticate,
  authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
  validateRequest(updateCertificationSchema),
  (req, res, next) => portfolioController.updateCertification(req, res, next),
);

router.delete(
  "/me/certifications/:id",
  authenticate,
  authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
  (req, res, next) => portfolioController.deleteCertification(req, res, next),
);

// ==========================================
// 5. Achievements CRUD (Protected: STUDENT)
// ==========================================
router.post(
  "/me/achievements",
  authenticate,
  authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
  validateRequest(createAchievementSchema),
  (req, res, next) => portfolioController.addAchievement(req, res, next),
);

router.patch(
  "/me/achievements/:id",
  authenticate,
  authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
  validateRequest(updateAchievementSchema),
  (req, res, next) => portfolioController.updateAchievement(req, res, next),
);

router.delete(
  "/me/achievements/:id",
  authenticate,
  authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
  (req, res, next) => portfolioController.deleteAchievement(req, res, next),
);

export const portfolioRoutes = router;
