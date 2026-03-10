import path from "path";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXT = [".txt", ".pdf"];
const ALLOWED_MIME = ["text/plain", "application/pdf"];

export function checkFileIsSafe(file: File) {
  if (!file) throw new Error("No file");

  if (file.size > MAX_SIZE || file.size === 0) {
    throw new Error("File too large or empty (max 5MB)");
  }

  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) {
    throw new Error("Only .txt and .pdf allowed");
  }

  if (!ALLOWED_MIME.includes(file.type)) {
    throw new Error("Invalid file type");
  }

  return { ext };
}

export function isPathSafe(baseDir: string, targetPath: string) {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(targetPath);
  if (!resolvedTarget.startsWith(resolvedBase)) {
    throw new Error("Invalid file path");
  }
}

export function checkContentIsSafe(text: string) {
  const badPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /eval\s*\(/gi,
    /Function\s*\(\s*["']new Function/gi,
    /setTimeout\s*\(\s*["']eval/gi,
    /<?php/i,
    /exec\s*\(/gi,
    /system\s*\(/gi,
    /require\s*\(\s*["']child_process/gi,
    /process\.exit/gi,
    /document\.write\s*\(/gi,
  ];

  for (const pattern of badPatterns) {
    if (pattern.test(text)) {
      throw new Error("Suspicious content detected");
    }
  }

  if (text.length > 500000) {
    throw new Error("File content too large");
  }
}