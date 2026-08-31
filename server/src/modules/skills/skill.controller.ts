import { Request, Response, NextFunction } from "express";
import { skillService } from "./skill.service.js";
import { sendSuccess } from "../../utils/response.util.js";

export class SkillController {
  async getCategories(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const categories = await skillService.getCategories();
      sendSuccess(
        res,
        { categories },
        "Skill categories retrieved successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async createCategory(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const adminUserId = req.user!.id;
      const category = await skillService.createCategory(req.body, adminUserId);
      sendSuccess(
        res,
        { category },
        "Skill category created successfully",
        201,
      );
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const adminUserId = req.user!.id;
      const id = req.params.id as string;
      const category = await skillService.updateCategory(
        id,
        req.body,
        adminUserId,
      );
      sendSuccess(
        res,
        { category },
        "Skill category updated successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const adminUserId = req.user!.id;
      const id = req.params.id as string;
      const result = await skillService.deleteCategory(id, adminUserId);
      sendSuccess(res, result, "Skill category deleted successfully", 200);
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
      const { search, categoryId, categorySlug } = req.query as {
        search?: string;
        categoryId?: string;
        categorySlug?: string;
      };
      const skills = await skillService.getSkills({
        search,
        categoryId,
        categorySlug,
      });
      sendSuccess(
        res,
        { skills, total: skills.length },
        "Skills retrieved successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async getTaxonomy(
    _req: Request,
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

  async getSkillById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const idOrSlug = req.params.id as string;
      const skill = await skillService.getSkillById(idOrSlug);
      sendSuccess(res, { skill }, "Skill retrieved successfully", 200);
    } catch (error) {
      next(error);
    }
  }

  async createSkill(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const adminUserId = req.user!.id;
      const skill = await skillService.createSkill(req.body, adminUserId);
      sendSuccess(res, { skill }, "Skill created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  async updateSkill(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const adminUserId = req.user!.id;
      const id = req.params.id as string;
      const skill = await skillService.updateSkill(id, req.body, adminUserId);
      sendSuccess(res, { skill }, "Skill updated successfully", 200);
    } catch (error) {
      next(error);
    }
  }

  async deleteSkill(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const adminUserId = req.user!.id;
      const id = req.params.id as string;
      const result = await skillService.deleteSkill(id, adminUserId);
      sendSuccess(res, result, "Skill deleted successfully", 200);
    } catch (error) {
      next(error);
    }
  }

  async getSummary(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const summary = await skillService.getTaxonomySummary();
      sendSuccess(
        res,
        { summary },
        "Taxonomy summary metrics retrieved successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }
}

export const skillController = new SkillController();
