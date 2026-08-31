import { Router } from "express";
import { UserRole } from "@prisma/client";
import { skillController } from "./skill.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../middleware/role.middleware.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import {
  createSkillCategorySchema,
  updateSkillCategorySchema,
  createSkillSchema,
  updateSkillSchema,
  skillQuerySchema,
} from "./skill.schema.js";

const router = Router();

// ==========================================
// Category Routes
// ==========================================
router.get("/categories", (req, res, next) =>
  skillController.getCategories(req, res, next),
);

router.post(
  "/categories",
  authenticate,
  authorizeRoles(UserRole.SUPER_ADMIN),
  validateRequest(createSkillCategorySchema),
  (req, res, next) => skillController.createCategory(req, res, next),
);

router.put(
  "/categories/:id",
  authenticate,
  authorizeRoles(UserRole.SUPER_ADMIN),
  validateRequest(updateSkillCategorySchema),
  (req, res, next) => skillController.updateCategory(req, res, next),
);

router.delete(
  "/categories/:id",
  authenticate,
  authorizeRoles(UserRole.SUPER_ADMIN),
  (req, res, next) => skillController.deleteCategory(req, res, next),
);

// ==========================================
// Skill Routes
// ==========================================
router.get("/taxonomy", (req, res, next) =>
  skillController.getTaxonomy(req, res, next),
);
router.get("/summary", (req, res, next) =>
  skillController.getSummary(req, res, next),
);

router.get("/", validateRequest(skillQuerySchema), (req, res, next) =>
  skillController.getAllSkills(req, res, next),
);

router.get("/:id", (req, res, next) =>
  skillController.getSkillById(req, res, next),
);

router.post(
  "/",
  authenticate,
  authorizeRoles(UserRole.SUPER_ADMIN),
  validateRequest(createSkillSchema),
  (req, res, next) => skillController.createSkill(req, res, next),
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles(UserRole.SUPER_ADMIN),
  validateRequest(updateSkillSchema),
  (req, res, next) => skillController.updateSkill(req, res, next),
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles(UserRole.SUPER_ADMIN),
  (req, res, next) => skillController.deleteSkill(req, res, next),
);

export const skillRoutes = router;
