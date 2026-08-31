import { Request, Response, NextFunction } from "express";
import { assessmentService } from "./assessment.service.js";
import { sendSuccess } from "../../utils/response.util.js";

export class AssessmentController {
  async getAssessments(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      const { category, search } = req.query as {
        category?: string;
        search?: string;
      };
      const assessments = await assessmentService.getAssessments(
        userId,
        category,
        search,
      );
      sendSuccess(
        res,
        { assessments },
        "Assessments retrieved successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async getAssessmentForSession(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const idOrSlug = req.params.id as string;
      const assessment =
        await assessmentService.getAssessmentForSession(idOrSlug);
      sendSuccess(res, { assessment }, "Assessment session initialized", 200);
    } catch (error) {
      next(error);
    }
  }

  async submitAssessment(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const idOrSlug = req.params.id as string;
      const userId = req.user!.id;
      const { answers } = req.body;

      const result = await assessmentService.submitAssessment(
        idOrSlug,
        userId,
        answers,
      );
      sendSuccess(
        res,
        { result },
        "Assessment submitted and scored successfully",
        201,
      );
    } catch (error) {
      next(error);
    }
  }

  async getResult(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const idOrSlug = req.params.id as string;
      const userId = req.user!.id;

      const result = await assessmentService.getAssessmentResult(
        idOrSlug,
        userId,
      );
      sendSuccess(
        res,
        { result },
        "Assessment result retrieved successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }
}

export const assessmentController = new AssessmentController();
