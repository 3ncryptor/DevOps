# Image Upload Service Documentation

## Overview

This document covers the complete file upload system for the E-commerce platform. The system uses **Multer** for handling multipart/form-data and **Cloudinary** for cloud storage and image transformations.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Configuration](#configuration)
3. [File Structure](#file-structure)
4. [Multer Middleware](#multer-middleware)
5. [Cloudinary Service](#cloudinary-service)
6. [Image Transformations](#image-transformations)
7. [Usage Examples](#usage-examples)
8. [Testing Guide](#testing-guide)
9. [Error Handling](#error-handling)
10. [Best Practices](#best-practices)

---

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Multer    │────▶│  Cloudinary │────▶│  Database   │
│  (FormData) │     │ (Temp Save) │     │  (Upload)   │     │ (Store URL) │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ./public/temp/
                    (auto-cleaned)
```

**Flow:**
1. Client sends file via `multipart/form-data`
2. Multer saves file temporarily to `./public/temp/`
3. Cloudinary service uploads to cloud
4. Local temp file is deleted automatically
5. Cloudinary URL is stored in database

---

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Getting Cloudinary Credentials

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Go to **Dashboard**
3. Copy:
   - **Cloud Name** → `CLOUDINARY_CLOUD_NAME`
   - **API Key** → `CLOUDINARY_API_KEY`
   - **API Secret** → `CLOUDINARY_API_SECRET`

---

## File Structure

```
src/
├── config/
│   └── cloudinary.config.js    # Cloudinary SDK initialization
├── middlewares/
│   ├── multer.middleware.js    # File upload middlewares
│   └── uploadError.middleware.js # Multer error handler
├── services/
│   └── cloudinary.service.js   # Upload/delete operations
├── utils/
│   ├── imageTransform.js       # Image transformation utilities
│   └── fileCleanup.js          # Temp file management
public/
└── temp/                       # Temporary upload directory
    └── .gitkeep
```

---

## Multer Middleware

### Available Upload Middlewares

| Middleware | Field Name(s) | Max Files | Max Size | Use Case |
|------------|---------------|-----------|----------|----------|
| `uploadSingleImage` | `image` | 1 | 5MB | Generic single image |
| `uploadMultipleImages` | `images` | 10 | 5MB each | Multiple images |
| `uploadAvatar` | `avatar` | 1 | 5MB | User profile picture |
| `uploadProductImages` | `thumbnail`, `gallery` | 1 + 10 | 5MB each | Product images |
| `uploadStoreBranding` | `logo`, `banner` | 1 + 1 | 5MB each | Store branding |
| `uploadSingleDocument` | `document` | 1 | 10MB | Verification docs |
| `uploadMultipleDocuments` | `documents` | 5 | 10MB each | Multiple docs |

### Allowed File Types

**Images:** `image/jpeg`, `image/png`, `image/webp`, `image/gif`

**Documents:** `application/pdf`, `image/jpeg`, `image/png`

### Import

```javascript
import {
  uploadSingleImage,
  uploadMultipleImages,
  uploadAvatar,
  uploadProductImages,
  uploadStoreBranding,
  uploadSingleDocument,
  uploadMultipleDocuments
} from "../middlewares/multer.middleware.js";
```

---

## Cloudinary Service

### Functions

#### `uploadToCloudinary(localFilePath, options)`

Upload a single file to Cloudinary.

```javascript
import { uploadToCloudinary, CLOUDINARY_FOLDERS } from "../services/cloudinary.service.js";

const result = await uploadToCloudinary(req.file.path, {
  folder: CLOUDINARY_FOLDERS.PRODUCTS
});

// Result:
// {
//   url: "https://res.cloudinary.com/.../image.jpg",
//   publicId: "ecommerce/products/image-123",
//   width: 800,
//   height: 600,
//   format: "jpg",
//   bytes: 102400
// }
```

#### `uploadMultipleToCloudinary(localFilePaths, options)`

Upload multiple files in parallel.

```javascript
const paths = req.files.map(f => f.path);
const results = await uploadMultipleToCloudinary(paths, {
  folder: CLOUDINARY_FOLDERS.PRODUCTS
});
// Returns array of upload results
```

#### `deleteFromCloudinary(publicId)`

Delete a single file from Cloudinary.

```javascript
await deleteFromCloudinary("ecommerce/products/image-123");
```

#### `deleteMultipleFromCloudinary(publicIds)`

Delete multiple files.

```javascript
await deleteMultipleFromCloudinary([
  "ecommerce/products/img1",
  "ecommerce/products/img2"
]);
```

#### `extractPublicId(url)`

Extract public ID from a Cloudinary URL.

```javascript
const publicId = extractPublicId("https://res.cloudinary.com/.../ecommerce/products/img.jpg");
// Returns: "ecommerce/products/img"
```

### Folder Constants

```javascript
import { CLOUDINARY_FOLDERS } from "../services/cloudinary.service.js";

CLOUDINARY_FOLDERS.PRODUCTS   // "ecommerce/products"
CLOUDINARY_FOLDERS.AVATARS    // "ecommerce/avatars"
CLOUDINARY_FOLDERS.STORES     // "ecommerce/stores"
CLOUDINARY_FOLDERS.DOCUMENTS  // "ecommerce/documents"
CLOUDINARY_FOLDERS.CATEGORIES // "ecommerce/categories"
```

---

## Image Transformations

### Presets

```javascript
import { IMAGE_TRANSFORMATIONS } from "../utils/imageTransform.js";
```

| Preset | Dimensions | Crop | Use Case |
|--------|------------|------|----------|
| `THUMBNAIL_SMALL` | 100×100 | fill | Tiny previews |
| `THUMBNAIL_MEDIUM` | 200×200 | fill | List items |
| `THUMBNAIL_LARGE` | 300×300 | fill | Grid views |
| `PRODUCT_CARD` | 400×400 | fill | Product cards |
| `PRODUCT_DETAIL` | 800×800 | limit | Product page |
| `PRODUCT_ZOOM` | 1200×1200 | limit | Zoom view |
| `AVATAR_SMALL` | 50×50 | fill + face | Small avatar |
| `AVATAR_MEDIUM` | 100×100 | fill + face | Medium avatar |
| `AVATAR_LARGE` | 200×200 | fill + face | Profile page |
| `STORE_LOGO` | 200×200 | fit | Store logo |
| `STORE_BANNER` | 1200×300 | fill | Desktop banner |
| `STORE_BANNER_MOBILE` | 600×200 | fill | Mobile banner |
| `CATEGORY_ICON` | 80×80 | fill | Category icon |
| `CATEGORY_BANNER` | 800×200 | fill | Category header |

### Helper Functions

```javascript
import {
  getTransformedUrl,
  getProductImageUrls,
  getAvatarUrls,
  getStoreBrandingUrls
} from "../utils/imageTransform.js";

// Get single transformed URL
const thumbUrl = getTransformedUrl(publicId, IMAGE_TRANSFORMATIONS.THUMBNAIL_MEDIUM);

// Get all product image sizes
const productUrls = getProductImageUrls(publicId);
// { thumbnail, card, detail, zoom }

// Get all avatar sizes
const avatarUrls = getAvatarUrls(publicId);
// { small, medium, large }

// Get store branding URLs
const brandingUrls = getStoreBrandingUrls(logoPublicId, bannerPublicId);
// { logo, banner: { desktop, mobile } }
```

---

## Usage Examples

### Example 1: User Avatar Upload

**Route:**
```javascript
// routes/v1/user.routes.js
import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { uploadAvatar } from "../../middlewares/multer.middleware.js";
import { handleMulterError } from "../../middlewares/uploadError.middleware.js";
import { updateAvatar } from "../../controllers/user.controller.js";

const router = Router();

router.patch(
  "/avatar",
  authMiddleware,
  handleMulterError(uploadAvatar),
  updateAvatar
);

export default router;
```

**Controller:**
```javascript
// controllers/user.controller.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadToCloudinary, deleteFromCloudinary, CLOUDINARY_FOLDERS } from "../services/cloudinary.service.js";
import { UserProfile } from "../models/userProfile.model.js";

const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Avatar image is required");
  }

  // Upload to Cloudinary
  const result = await uploadToCloudinary(req.file.path, {
    folder: CLOUDINARY_FOLDERS.AVATARS,
    transformation: [{ width: 500, height: 500, crop: "fill", gravity: "face" }]
  });

  // Get existing profile to delete old avatar
  const existingProfile = await UserProfile.findOne({ userId: req.user.id });
  
  if (existingProfile?.personal?.profileImageUrl) {
    const oldPublicId = extractPublicId(existingProfile.personal.profileImageUrl);
    if (oldPublicId) {
      await deleteFromCloudinary(oldPublicId);
    }
  }

  // Update profile
  const profile = await UserProfile.findOneAndUpdate(
    { userId: req.user.id },
    { "personal.profileImageUrl": result.url },
    { new: true }
  );

  res.status(200).json(
    new ApiResponse(200, { avatarUrl: result.url }, "Avatar updated successfully")
  );
});

export { updateAvatar };
```

### Example 2: Product Images Upload

**Route:**
```javascript
// routes/v1/product.routes.js
router.post(
  "/",
  authMiddleware,
  authorizeRoles("SELLER"),
  handleMulterError(uploadProductImages),
  createProduct
);
```

**Controller:**
```javascript
// controllers/product.controller.js
const createProduct = asyncHandler(async (req, res) => {
  const { title, description, price, categoryId } = req.body;

  // Validate files
  if (!req.files?.thumbnail?.[0]) {
    throw new ApiError(400, "Product thumbnail is required");
  }

  // Upload thumbnail
  const thumbnail = await uploadToCloudinary(req.files.thumbnail[0].path, {
    folder: CLOUDINARY_FOLDERS.PRODUCTS
  });

  // Upload gallery images (if any)
  let galleryImages = [];
  if (req.files.gallery?.length > 0) {
    const galleryPaths = req.files.gallery.map(f => f.path);
    galleryImages = await uploadMultipleToCloudinary(galleryPaths, {
      folder: CLOUDINARY_FOLDERS.PRODUCTS
    });
  }

  // Create product in database
  const product = await Product.create({
    storeId: req.seller.storeId,
    categoryId,
    identity: { title, description },
    // ... other fields
  });

  // Save images to ProductImage collection
  await ProductImage.create({
    productId: product._id,
    url: thumbnail.url,
    publicId: thumbnail.publicId,
    sortOrder: 0
  });

  for (let i = 0; i < galleryImages.length; i++) {
    await ProductImage.create({
      productId: product._id,
      url: galleryImages[i].url,
      publicId: galleryImages[i].publicId,
      sortOrder: i + 1
    });
  }

  res.status(201).json(
    new ApiResponse(201, product, "Product created successfully")
  );
});
```

### Example 3: Store Branding Upload

**Route:**
```javascript
router.patch(
  "/:storeId/branding",
  authMiddleware,
  authorizeRoles("SELLER"),
  handleMulterError(uploadStoreBranding),
  updateStoreBranding
);
```

**Controller:**
```javascript
const updateStoreBranding = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const updates = {};

  // Upload logo if provided
  if (req.files?.logo?.[0]) {
    const logo = await uploadToCloudinary(req.files.logo[0].path, {
      folder: CLOUDINARY_FOLDERS.STORES
    });
    updates["branding.logoUrl"] = logo.url;
  }

  // Upload banner if provided
  if (req.files?.banner?.[0]) {
    const banner = await uploadToCloudinary(req.files.banner[0].path, {
      folder: CLOUDINARY_FOLDERS.STORES
    });
    updates["branding.bannerUrl"] = banner.url;
  }

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, "No files provided");
  }

  const store = await Store.findByIdAndUpdate(storeId, updates, { new: true });

  res.status(200).json(
    new ApiResponse(200, store, "Store branding updated")
  );
});
```

---

## Testing Guide

### Using cURL

#### Test Single Image Upload

```bash
curl -X PATCH http://localhost:8000/api/v1/users/avatar \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "avatar=@/path/to/image.jpg"
```

#### Test Multiple Images Upload

```bash
curl -X POST http://localhost:8000/api/v1/products \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "thumbnail=@/path/to/thumbnail.jpg" \
  -F "gallery=@/path/to/image1.jpg" \
  -F "gallery=@/path/to/image2.jpg" \
  -F "title=Test Product" \
  -F "description=Test Description" \
  -F "price=99.99"
```

### Using Postman

1. **Create a new request**
2. **Set method** to `POST` or `PATCH`
3. **Set URL** (e.g., `http://localhost:8000/api/v1/users/avatar`)
4. **Headers tab:** Add `Authorization: Bearer YOUR_TOKEN`
5. **Body tab:**
   - Select `form-data`
   - Add key: `avatar` (or relevant field name)
   - Change type dropdown to `File`
   - Select your image file
6. **Send**

### Test Cases

| Test Case | Expected Result |
|-----------|-----------------|
| Upload valid JPEG | 200/201 with URL in response |
| Upload valid PNG | 200/201 with URL in response |
| Upload invalid file type (e.g., .exe) | 400 "Only JPEG, PNG..." |
| Upload file > 5MB | 400 "File size exceeds..." |
| Upload without auth token | 401 "Authorization token missing" |
| Upload with wrong field name | 400 "Unexpected field" |
| Upload more than max files | 400 "Too many files" |
| No file in request | 400 "File is required" |

### Verify Upload in Cloudinary

1. Go to [cloudinary.com](https://cloudinary.com) → **Media Library**
2. Navigate to `ecommerce/` folder
3. Verify uploaded images appear in correct subfolder

---

## Error Handling

### Multer Errors

The `handleMulterError` middleware converts Multer errors to `ApiError`:

| Multer Error Code | HTTP Status | Message |
|-------------------|-------------|---------|
| `LIMIT_FILE_SIZE` | 400 | File size exceeds the allowed limit |
| `LIMIT_FILE_COUNT` | 400 | Too many files uploaded |
| `LIMIT_UNEXPECTED_FILE` | 400 | Unexpected field: {field} |
| `LIMIT_PART_COUNT` | 400 | Too many parts in multipart request |
| `LIMIT_FIELD_KEY` | 400 | Field name too long |
| `LIMIT_FIELD_VALUE` | 400 | Field value too long |
| `LIMIT_FIELD_COUNT` | 400 | Too many fields |

### Cloudinary Errors

Cloudinary service errors return `ApiError` with status 500:

```json
{
  "statusCode": 500,
  "message": "Failed to upload file: {cloudinary_error_message}",
  "success": false,
  "data": null
}
```

### File Type Validation Errors

```json
{
  "statusCode": 400,
  "message": "Only JPEG, PNG, WebP, and GIF images are allowed",
  "success": false,
  "data": null
}
```

---

## Best Practices

### 1. Always Use Error Handler Wrapper

```javascript
// ✅ Good
handleMulterError(uploadSingleImage)

// ❌ Bad - errors won't be formatted properly
uploadSingleImage
```

### 2. Validate File Presence in Controller

```javascript
if (!req.file) {
  throw new ApiError(400, "Image is required");
}
```

### 3. Delete Old Files When Replacing

```javascript
// Delete old image before saving new one
if (existingUrl) {
  const publicId = extractPublicId(existingUrl);
  await deleteFromCloudinary(publicId);
}
```

### 4. Store publicId Along with URL

```javascript
// Store both for easy deletion later
await ProductImage.create({
  url: result.url,
  publicId: result.publicId  // ✅ Important!
});
```

### 5. Use Appropriate Folders

```javascript
// ✅ Organized
folder: CLOUDINARY_FOLDERS.PRODUCTS

// ❌ All files in root
folder: "ecommerce"
```

### 6. Handle Cleanup on Failures

The `uploadToCloudinary` function automatically cleans up temp files on both success and failure. For manual cleanup:

```javascript
import { removeTempFile, removeTempFiles } from "../utils/fileCleanup.js";

// Single file
removeTempFile(req.file.path);

// Multiple files
removeTempFiles(req.files.map(f => f.path));
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot read properties of undefined (reading 'path')" | File not uploaded - check field name matches middleware |
| "File size exceeds limit" | Increase `MAX_IMAGE_SIZE` in multer.middleware.js or compress image |
| "Invalid token" on Cloudinary | Check `CLOUDINARY_API_SECRET` in .env |
| Files accumulating in `./public/temp` | Run `cleanupTempFiles()` or check if uploads are failing before cleanup |
| "ENOENT: no such file or directory" | Ensure `./public/temp/` directory exists |

---

## Environment Variables Reference

```env
# Required for file uploads
CLOUDINARY_CLOUD_NAME=dxxxxxxxxx
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=aBcDeFgHiJkLmNoPqRsTuVwXyZ
```

---

## Related Files

- [src/config/cloudinary.config.js](../src/config/cloudinary.config.js) - SDK configuration
- [src/middlewares/multer.middleware.js](../src/middlewares/multer.middleware.js) - Upload middlewares
- [src/middlewares/uploadError.middleware.js](../src/middlewares/uploadError.middleware.js) - Error handler
- [src/services/cloudinary.service.js](../src/services/cloudinary.service.js) - Cloud operations
- [src/utils/imageTransform.js](../src/utils/imageTransform.js) - Transformations
- [src/utils/fileCleanup.js](../src/utils/fileCleanup.js) - Cleanup utilities
