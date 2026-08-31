import { Request, Response, NextFunction } from "express";
import { skillService } from "./skill.service.js";
import { sendSuccess } from "../../utils/response.util.js";

export class SkillController {
  async getTaxonomy(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const taxonomy = await skillService.getAllSkillsGroupedByCategory();
      sendSuccess(
        res,
        { categories: taxonomy },
        "Skill taxonomy retrieved successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async getAllSkills(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const skills = await skillService.getAllSkillsFlat();
      sendSuccess(res, { skills }, "Skills list retrieved successfully", 200);
    } catch (error) {
      next(error);
    }
  }
}

export const skillController = new SkillController();
