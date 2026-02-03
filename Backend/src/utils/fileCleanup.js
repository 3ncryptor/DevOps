import fs from "fs";
import path from "path";
import { logger } from "../config/logger.config.js";

const TEMP_DIR = "./public/temp";

/**
 * Clean up temporary files older than specified age
 * @param {number} maxAgeMs - Maximum age in milliseconds (default: 1 hour)
 */
const cleanupTempFiles = async (maxAgeMs = 60 * 60 * 1000) => {
  try {
    const files = fs.readdirSync(TEMP_DIR);
    const now = Date.now();
    let cleaned = 0;

    for (const file of files) {
      // Skip .gitkeep
      if (file === ".gitkeep") continue;

      const filePath = path.join(TEMP_DIR, file);
      const stats = fs.statSync(filePath);
      const age = now - stats.mtimeMs;

      if (age > maxAgeMs) {
        fs.unlinkSync(filePath);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`Cleaned up ${cleaned} temporary files`);
    }

    return cleaned;
  } catch (error) {
    logger.error("Error cleaning temp files", { error: error.message });
    return 0;
  }
};

/**
 * Remove a specific temporary file
 * @param {string} filePath - Path to the file
 */
const removeTempFile = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    logger.error("Error removing temp file", { filePath, error: error.message });
    return false;
  }
};

/**
 * Remove multiple temporary files
 * @param {string[]} filePaths - Array of file paths
 */
const removeTempFiles = (filePaths) => {
  if (!filePaths || !Array.isArray(filePaths)) return;

  for (const filePath of filePaths) {
    removeTempFile(filePath);
  }
};

/**
 * Get file paths from multer request files
 * @param {object} files - req.files from multer
 * @returns {string[]} Array of file paths
 */
const getFilePathsFromRequest = (files) => {
  if (!files) return [];

  // Single file (req.file)
  if (files.path) {
    return [files.path];
  }

  // Array of files (req.files from .array())
  if (Array.isArray(files)) {
    return files.map((f) => f.path);
  }

  // Fields object (req.files from .fields())
  const paths = [];
  for (const fieldFiles of Object.values(files)) {
    if (Array.isArray(fieldFiles)) {
      paths.push(...fieldFiles.map((f) => f.path));
    }
  }
  return paths;
};

/**
 * Ensure temp directory exists
 */
const ensureTempDir = () => {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
};

export {
  cleanupTempFiles,
  removeTempFile,
  removeTempFiles,
  getFilePathsFromRequest,
  ensureTempDir
};
