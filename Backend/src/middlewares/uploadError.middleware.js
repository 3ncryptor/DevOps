import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

/**
 * Middleware to handle Multer errors gracefully
 * Wraps multer upload middleware and converts errors to ApiError
 */
const handleMulterError = (uploadMiddleware) => {
    return (req, res, next) => {
        uploadMiddleware(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                // Multer-specific errors
                switch (err.code) {
                    case 'LIMIT_FILE_SIZE':
                        return next(
                            new ApiError(
                                400,
                                'File size exceeds the allowed limit'
                            )
                        );
                    case 'LIMIT_FILE_COUNT':
                        return next(
                            new ApiError(400, 'Too many files uploaded')
                        );
                    case 'LIMIT_UNEXPECTED_FILE':
                        return next(
                            new ApiError(400, `Unexpected field: ${err.field}`)
                        );
                    case 'LIMIT_PART_COUNT':
                        return next(
                            new ApiError(
                                400,
                                'Too many parts in multipart request'
                            )
                        );
                    case 'LIMIT_FIELD_KEY':
                        return next(new ApiError(400, 'Field name too long'));
                    case 'LIMIT_FIELD_VALUE':
                        return next(new ApiError(400, 'Field value too long'));
                    case 'LIMIT_FIELD_COUNT':
                        return next(new ApiError(400, 'Too many fields'));
                    default:
                        return next(
                            new ApiError(400, `Upload error: ${err.message}`)
                        );
                }
            } else if (err) {
                // Other errors (including our custom ApiError from file filter)
                return next(err);
            }
            next();
        });
    };
};

export { handleMulterError };
