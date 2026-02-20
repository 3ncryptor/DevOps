import multer from 'multer';
import path from 'path';
import { ApiError } from '../utils/ApiError.js';

// Allowed file types
const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

// Max file sizes
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

// Storage configuration - temporary local storage before Cloudinary upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/temp');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
});

// File filter for images
const imageFilter = (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new ApiError(
                400,
                'Only JPEG, PNG, WebP, and GIF images are allowed'
            ),
            false
        );
    }
};

// File filter for documents (seller verification)
const documentFilter = (req, file, cb) => {
    if (ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new ApiError(400, 'Only PDF, JPEG, and PNG documents are allowed'),
            false
        );
    }
};

// Upload configurations
const uploadImage = multer({
    storage,
    fileFilter: imageFilter,
    limits: {
        fileSize: MAX_IMAGE_SIZE,
    },
});

const uploadDocument = multer({
    storage,
    fileFilter: documentFilter,
    limits: {
        fileSize: MAX_DOCUMENT_SIZE,
    },
});

// Pre-configured upload middlewares
export const uploadSingleImage = uploadImage.single('image');
export const uploadMultipleImages = uploadImage.array('images', 10);
export const uploadProductImages = uploadImage.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'gallery', maxCount: 10 },
]);

export const uploadSingleDocument = uploadDocument.single('document');
export const uploadMultipleDocuments = uploadDocument.array('documents', 5);

// Profile/avatar upload
export const uploadAvatar = uploadImage.single('avatar');

// Store branding uploads
export const uploadStoreBranding = uploadImage.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
]);

export { uploadImage, uploadDocument };
