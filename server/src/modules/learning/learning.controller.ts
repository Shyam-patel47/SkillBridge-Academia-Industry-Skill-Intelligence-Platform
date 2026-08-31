import { Request, Response, NextFunction } from "express";
import { learningService } from "./learning.service.js";
import { sendSuccess } from "../../utils/response.util.js";

export class LearningController {
  async getRecommendations(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { targetCareer } = req.query as { targetCareer?: string };
      const recommendationsData =
        await learningService.getRecommendationsForStudent(
          userId,
          targetCareer,
        );
      sendSuccess(
        res,
        recommendationsData,
        "Learning recommendations calculated successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async getAllPrograms(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { search, difficulty } = req.query as {
        search?: string;
        difficulty?: string;
      };
      const programs = await learningService.getAllPrograms(search, difficulty);
      sendSuccess(
        res,
        { programs, count: programs.length },
        "Learning programs retrieved successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async getProgramById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const idOrSlug = req.params.id as string;
      const program = await learningService.getProgramById(idOrSlug);
      sendSuccess(
        res,
        { program },
        "Learning program retrieved successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async createProgram(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const adminUserId = req.user!.id;
      const program = await learningService.createProgram(
        req.body,
        adminUserId,
      );
      sendSuccess(
        res,
        { program },
        "Learning program created successfully",
        201,
      );
    } catch (error) {
      next(error);
    }
  }
}

export const learningController = new LearningController();
