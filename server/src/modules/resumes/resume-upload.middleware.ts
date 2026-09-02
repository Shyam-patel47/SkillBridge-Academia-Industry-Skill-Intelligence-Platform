import multer from "multer";
import { Request, Response, NextFunction } from "express";

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
    files: 1, // Strictly single file upload
  },
  fileFilter: (_req, file, cb) => {
    // 1. Sanitize filename: Strip path traversal attempts and dangerous characters
    const sanitizedFilename = file.originalname
      .replace(/(\.\.[/\\])+/g, "")
      .replace(/[\x00-\x1f\x80-\x9f]/g, "")
      .trim();

    file.originalname = sanitizedFilename;

    const isAllowedMime = allowedMimeTypes.includes(file.mimetype);
    const hasAllowedExt = /\.(pdf|docx|doc|txt|md|rtf)$/i.test(
      sanitizedFilename,
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
 * Validate binary buffer signature to prevent executable file masking attacks
 */
export function validateBufferSignature(
  buffer: Buffer,
  mimeType: string,
): boolean {
  if (!buffer || buffer.length === 0) return false;

  // Check for dangerous executable signatures
  // Windows EXE / DLL header 'MZ'
  if (buffer.length >= 2 && buffer[0] === 0x4d && buffer[1] === 0x5a) {
    return false;
  }
  // Linux ELF header '\x7fELF'
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x7f &&
    buffer[1] === 0x45 &&
    buffer[2] === 0x4c &&
    buffer[3] === 0x46
  ) {
    return false;
  }

  // If claimed to be PDF, verify '%PDF' magic header
  if (mimeType === "application/pdf") {
    const header = buffer.slice(0, 5).toString("ascii");
    if (!header.startsWith("%PDF")) {
      return false;
    }
  }

  return true;
}

/**
 * Robust, safe text extraction from file buffer
 */
export function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string,
  filename: string,
): string {
  // Validate binary signature before processing
  if (!validateBufferSignature(buffer, mimeType)) {
    throw new Error(
      "Security verification failed: Corrupt or unrecognized binary file format.",
    );
  }

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
  const textMatches = rawString.match(/\(([^)]+)\)|\[([^\]]+)\]/g) || [];
  const extractedTokens = textMatches
    .map((t) => t.replace(/^[([\])]+|[([\])]+$/g, ""))
    .filter((t) => t.length > 1 && !/^[0-9\s]+$/.test(t));

  if (extractedTokens.length > 10) {
    return extractedTokens.join(" ");
  }

  // Fallback: UTF-8 sanitized string (strip non-printable binary control characters)
  return buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
}
