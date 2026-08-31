import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service.js";
import { sendSuccess } from "../../utils/response.util.js";

export class AuthController {
  async register(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const ipAddress =
        req.ip ||
        (req.headers["x-forwarded-for"] as string) ||
        req.socket.remoteAddress;
      const userAgent = req.headers["user-agent"];

      const result = await authService.register(req.body, ipAddress, userAgent);

      // Set cookie for browser clients (Optional convenience)
      res.cookie("accessToken", result.tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000, // 15 mins
      });

      sendSuccess(res, result, "User registered successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ipAddress =
        req.ip ||
        (req.headers["x-forwarded-for"] as string) ||
        req.socket.remoteAddress;
      const userAgent = req.headers["user-agent"];

      const result = await authService.login(req.body, ipAddress, userAgent);

      res.cookie("accessToken", result.tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000,
      });

      sendSuccess(res, result, "Login successful", 200);
    } catch (error) {
      next(error);
    }
  }

  async refresh(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
      const result = await authService.refresh(refreshToken);

      res.cookie("accessToken", result.tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000,
      });

      sendSuccess(res, result, "Tokens refreshed successfully", 200);
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
      const userId = req.user?.id;

      const result = await authService.logout(refreshToken, userId);

      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      sendSuccess(res, result, "Logged out successfully", 200);
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const user = await authService.getCurrentUser(userId);
      sendSuccess(res, { user }, "User profile retrieved successfully", 200);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
