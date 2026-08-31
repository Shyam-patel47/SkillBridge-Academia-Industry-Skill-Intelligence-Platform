import { Request, Response } from "express";
import { sendError } from "../utils/response.util.js";

export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(
    res,
    `Route ${req.method} ${req.originalUrl} not found`,
    404,
    "NOT_FOUND",
  );
};
