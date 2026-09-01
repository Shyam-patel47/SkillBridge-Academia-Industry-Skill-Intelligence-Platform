import multer from "multer";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../../middleware/error.middleware.js";

// Max file size: 5 MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const allowedMimeTypes = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/rtf",
  "text/rtf",
];

const storage = multer.memoryStorage();

export const uploadResumeFile = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    const isAllowedMime = allowedMimeTypes.includes(file.mimetype);
    const hasAllowedExt = /\.(pdf|docx|doc|txt|md|rtf)$/i.test(
      file.originalname,
    );

    if (isAllowedMime || hasAllowedExt) {
      cb(null, true);
    } else {
      const error: any = new Error(
        "Invalid file type. Only PDF, DOCX, TXT, and Markdown files are supported (Max 5MB).",
      );
      error.statusCode = 415;
      error.code = "INVALID_FILE_TYPE";
      cb(error, false);
    }
  },
}).single("resumeFile");

/**
 * Robust, safe text extraction from file buffer
 */
export function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string,
  filename: string,
): string {
  // If plain text / markdown / rtf
  if (
    mimeType.includes("text") ||
    filename.endsWith(".txt") ||
    filename.endsWith(".md") ||
    filename.endsWith(".rtf")
  ) {
    return buffer.toString("utf-8");
  }

  // If PDF, extract printable text tokens cleanly
  const rawString = buffer.toString("binary");
  // Simple clean PDF text stream extractor
  const textMatches = rawString.match(/\(([^)]+)\)|\[([^\]]+)\]/g) || [];
  const extractedTokens = textMatches
    .map((t) => t.replace(/^[([\])]+|[([\])]+$/g, ""))
    .filter((t) => t.length > 1 && !/^[0-9\s]+$/.test(t));

  if (extractedTokens.length > 10) {
    return extractedTokens.join(" ");
  }

  // Fallback: UTF-8 sanitized string
  return buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
}
