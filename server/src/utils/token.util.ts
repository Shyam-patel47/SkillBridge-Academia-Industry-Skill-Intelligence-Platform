import jwt from "jsonwebtoken";
import crypto from "crypto";
import { config } from "../config/index.js";
import { AuthUserPayload } from "../types/auth.types.js";

export const generateAccessToken = (payload: AuthUserPayload): string => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn as jwt.SignOptions["expiresIn"],
  });
};

export const generateRefreshTokenString = (): string => {
  return crypto.randomBytes(40).toString("hex");
};

export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const verifyAccessToken = (token: string): AuthUserPayload | null => {
  try {
    const decoded = jwt.verify(
      token,
      config.jwt.accessSecret,
    ) as AuthUserPayload;
    return decoded;
  } catch (_err) {
    return null;
  }
};
