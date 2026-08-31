import rateLimit from "express-rate-limit";
import { sendError } from "../utils/response.util.js";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      "Too many authentication requests from this IP, please try again in 15 minutes.",
      429,
      "TOO_MANY_REQUESTS",
    );
  },
});
