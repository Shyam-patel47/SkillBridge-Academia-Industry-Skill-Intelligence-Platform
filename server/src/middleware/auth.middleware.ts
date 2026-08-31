import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/token.util.js";
import { sendError } from "../utils/response.util.js";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  let token: string | undefined;

  // 1. Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.cookies && req.cookies.accessToken) {
    // 2. Check cookies if available
    token = req.cookies.accessToken;
  }

  if (!token) {
    sendError(
      res,
      "Authentication required. No token provided.",
      401,
      "UNAUTHORIZED",
    );
    return;
  }

  const decoded = verifyAccessToken(token);
  if (!decoded) {
    sendError(res, "Invalid or expired access token.", 401, "TOKEN_EXPIRED");
    return;
  }

  req.user = decoded;
  next();
};
