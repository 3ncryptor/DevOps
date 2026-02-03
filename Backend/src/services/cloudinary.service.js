import cloudinary from "../config/cloudinary.config.js";
import fs from "fs";
import { ApiError } from "../utils/ApiError.js";

/**
 * Upload a file to Cloudinary
 * @param {string} localFilePath - Path to the local file
 * @param {object} options - Upload options
 * @returns {Promise<object>} Cloudinary upload result
 */
const uploadToCloudinary = async (localFilePath, options = {}) => {
  if (!localFilePath) {
    throw new ApiError(400, "File path is required");
  }

  try {
    const defaultOptions = {
      resource_type: "auto",
      folder: "ecommerce"
    };

    const uploadOptions = { ...defaultOptions, ...options };
    const result = await cloudinary.uploader.upload(localFilePath, uploadOptions);

    // Remove local file after successful upload
    fs.unlinkSync(localFilePath);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    };
  } catch (error) {
    // Clean up local file on error
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    throw new ApiError(500, `Failed to upload file: ${error.message}`);
  }
};

/**
 * Upload multiple files to Cloudinary
 * @param {string[]} localFilePaths - Array of local file paths
 * @param {object} options - Upload options
 * @returns {Promise<object[]>} Array of upload results
 */
const uploadMultipleToCloudinary = async (localFilePaths, options = {}) => {
  const uploadPromises = localFilePaths.map((filePath) =>
    uploadToCloudinary(filePath, options)
  );

  return Promise.all(uploadPromises);
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<object>} Deletion result
 */
const deleteFromCloudinary = async (publicId) => {
  if (!publicId) {
    throw new ApiError(400, "Public ID is required");
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new ApiError(500, `Failed to delete file: ${error.message}`);
  }
};

/**
 * Delete multiple files from Cloudinary
 * @param {string[]} publicIds - Array of public IDs
 * @returns {Promise<object>} Deletion result
 */
const deleteMultipleFromCloudinary = async (publicIds) => {
  if (!publicIds || publicIds.length === 0) {
    throw new ApiError(400, "Public IDs are required");
  }

  try {
    const result = await cloudinary.api.delete_resources(publicIds);
    return result;
  } catch (error) {
    throw new ApiError(500, `Failed to delete files: ${error.message}`);
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} Public ID
 */
const extractPublicId = (url) => {
  if (!url) return null;

  try {
    // URL format: https://res.cloudinary.com/{cloud}/image/upload/v{version}/{folder}/{publicId}.{ext}
    const urlParts = url.split("/");
    const fileWithExt = urlParts[urlParts.length - 1];
    const folder = urlParts[urlParts.length - 2];
    const publicId = fileWithExt.split(".")[0];

    // Return with folder if present
    if (folder !== "upload" && !folder.startsWith("v")) {
      return `${folder}/${publicId}`;
    }
    return publicId;
  } catch {
    return null;
  }
};

// Folder constants for organization
export const CLOUDINARY_FOLDERS = {
  PRODUCTS: "ecommerce/products",
  AVATARS: "ecommerce/avatars",
  STORES: "ecommerce/stores",
  DOCUMENTS: "ecommerce/documents",
  CATEGORIES: "ecommerce/categories"
};

export {
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  deleteFromCloudinary,
  deleteMultipleFromCloudinary,
  extractPublicId
};
