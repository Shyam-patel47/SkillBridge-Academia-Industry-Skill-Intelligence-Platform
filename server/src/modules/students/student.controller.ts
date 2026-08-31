import { Request, Response, NextFunction } from "express";
import { studentService } from "./student.service.js";
import { sendSuccess } from "../../utils/response.util.js";

export class StudentController {
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const profile = await studentService.getProfileByUserId(userId);
      sendSuccess(
        res,
        { profile },
        "Student profile retrieved successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async updateMe(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const updatedProfile = await studentService.updateProfileByUserId(
        userId,
        req.body,
      );
      sendSuccess(
        res,
        { profile: updatedProfile },
        "Student profile updated successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async getMySkills(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const skillsSummary =
        await studentService.getStudentSkillsSummary(userId);
      sendSuccess(
        res,
        skillsSummary,
        "Student skills summary retrieved successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async getMySkillHistory(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const history = await studentService.getStudentSkillHistory(userId);
      sendSuccess(
        res,
        { history },
        "Student skill assessment history retrieved successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async getById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = req.params.id as string;
      const profile = await studentService.getProfileById(id);
      sendSuccess(
        res,
        { profile },
        "Student profile retrieved successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }
}

export const studentController = new StudentController();
