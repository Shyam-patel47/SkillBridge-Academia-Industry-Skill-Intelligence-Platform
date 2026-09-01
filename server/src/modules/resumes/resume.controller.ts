import { Request, Response, NextFunction } from "express";
import { resumeService } from "./resume.service.js";
import { extractTextFromBuffer } from "./resume-upload.middleware.js";
import { sendSuccess } from "../../utils/response.util.js";
import { AppError } from "../../middleware/error.middleware.js";

export class ResumeController {
  /**
   * Extract skills from uploaded resume file or pasted text
   */
  async extractSkills(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      let resumeText = req.body.rawText;

      // If file was uploaded via multipart/form-data
      if (req.file) {
        resumeText = extractTextFromBuffer(
          req.file.buffer,
          req.file.mimetype,
          req.file.originalname,
        );
      }

      if (!resumeText || resumeText.trim().length < 10) {
        const error: AppError = new Error(
          "No resume content provided. Please upload a resume file (PDF, DOCX, TXT) or paste resume text.",
        );
        error.statusCode = 400;
        error.code = "MISSING_RESUME_CONTENT";
        throw error;
      }

      const result = await resumeService.extractSkillsFromResume(
        userId,
        resumeText,
      );
      sendSuccess(
        res,
        { extraction: result },
        "Resume skills extracted successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Confirm / Accept Extracted Skills
   */
  async confirmSkills(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await resumeService.confirmExtractedSkills(
        userId,
        req.body,
      );
      sendSuccess(
        res,
        result,
        "Extracted skills confirmed and added to profile",
        200,
      );
    } catch (error) {
      next(error);
    }
  }
}

export const resumeController = new ResumeController();
