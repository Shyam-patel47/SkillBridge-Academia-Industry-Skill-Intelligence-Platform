import { Router } from "express";
import { skillController } from "./skill.controller.js";

const router = Router();

// Public / Authenticated Skill Taxonomy lookup
router.get("/taxonomy", (req, res, next) =>
  skillController.getTaxonomy(req, res, next),
);
router.get("/", (req, res, next) =>
  skillController.getAllSkills(req, res, next),
);

export const skillRoutes = router;
