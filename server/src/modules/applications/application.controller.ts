import { Request, Response, NextFunction } from "express";
import { applicationService } from "./application.service.js";
import { sendSuccess } from "../../utils/response.util.js";

export class ApplicationController {
  /**
   * Student: Submit Application
   */
  async apply(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const application = await applicationService.apply(userId, req.body);
      sendSuccess(
        res,
        { application },
        "Application submitted successfully",
        201,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Student: List Own Applications
   */
  async getStudentApplications(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { status, search } = req.query as {
        status?: string;
        search?: string;
      };
      const applications = await applicationService.getStudentApplications(
        userId,
        { status, search },
      );
      sendSuccess(
        res,
        { applications, count: applications.length },
        "Student applications retrieved successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Student: Get Application Detail
   */
  async getStudentApplicationDetail(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;
      const application = await applicationService.getStudentApplicationDetail(
        id,
        userId,
      );
      sendSuccess(
        res,
        { application },
        "Application detail retrieved successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Student: Withdraw Application
   */
  async withdrawApplication(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;
      const { reason } = req.body;
      const application = await applicationService.withdrawApplication(
        id,
        userId,
        reason,
      );
      sendSuccess(
        res,
        { application },
        "Application withdrawn successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recruiter: List Applicants for Company / Opportunity
   */
  async getRecruiterApplications(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const { opportunityId, status, search } = req.query as {
        opportunityId?: string;
        status?: string;
        search?: string;
      };
      const applications = await applicationService.getRecruiterApplications(
        userId,
        userRole,
        opportunityId,
        { status, search },
      );
      sendSuccess(
        res,
        { applications, count: applications.length },
        "Applicants retrieved successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recruiter: Get Candidate Application Dossier
   */
  async getRecruiterApplicationDetail(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const application =
        await applicationService.getRecruiterApplicationDetail(
          id,
          userId,
          userRole,
        );
      sendSuccess(
        res,
        { application },
        "Candidate application dossier retrieved successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recruiter: Update Candidate Status in Pipeline
   */
  async updateApplicationStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const application = await applicationService.updateApplicationStatus(
        id,
        userId,
        userRole,
        req.body,
      );
      sendSuccess(
        res,
        { application },
        `Candidate status updated to ${req.body.status} successfully`,
        200,
      );
    } catch (error) {
      next(error);
    }
  }
}

export const applicationController = new ApplicationController();
