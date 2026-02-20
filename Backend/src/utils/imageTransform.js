import cloudinary from '../config/cloudinary.config.js';

/**
 * Image transformation presets for Cloudinary
 * Use these when fetching/displaying images
 */
export const IMAGE_TRANSFORMATIONS = {
    // Thumbnails
    THUMBNAIL_SMALL: { width: 100, height: 100, crop: 'fill', quality: 'auto' },
    THUMBNAIL_MEDIUM: {
        width: 200,
        height: 200,
        crop: 'fill',
        quality: 'auto',
    },
    THUMBNAIL_LARGE: { width: 300, height: 300, crop: 'fill', quality: 'auto' },

    // Product images
    PRODUCT_CARD: { width: 400, height: 400, crop: 'fill', quality: 'auto' },
    PRODUCT_DETAIL: { width: 800, height: 800, crop: 'limit', quality: 'auto' },
    PRODUCT_ZOOM: { width: 1200, height: 1200, crop: 'limit', quality: 'auto' },

    // Avatar/Profile
    AVATAR_SMALL: {
        width: 50,
        height: 50,
        crop: 'fill',
        gravity: 'face',
        quality: 'auto',
    },
    AVATAR_MEDIUM: {
        width: 100,
        height: 100,
        crop: 'fill',
        gravity: 'face',
        quality: 'auto',
    },
    AVATAR_LARGE: {
        width: 200,
        height: 200,
        crop: 'fill',
        gravity: 'face',
        quality: 'auto',
    },

    // Store branding
    STORE_LOGO: { width: 200, height: 200, crop: 'fit', quality: 'auto' },
    STORE_BANNER: { width: 1200, height: 300, crop: 'fill', quality: 'auto' },
    STORE_BANNER_MOBILE: {
        width: 600,
        height: 200,
        crop: 'fill',
        quality: 'auto',
    },

    // Category
    CATEGORY_ICON: { width: 80, height: 80, crop: 'fill', quality: 'auto' },
    CATEGORY_BANNER: { width: 800, height: 200, crop: 'fill', quality: 'auto' },
};

/**
 * Generate a transformed Cloudinary URL
 * @param {string} publicId - Cloudinary public ID
 * @param {object} transformation - Transformation options
 * @returns {string} Transformed URL
 */
const getTransformedUrl = (publicId, transformation = {}) => {
    if (!publicId) return null;

    return cloudinary.url(publicId, {
        secure: true,
        ...transformation,
    });
};

/**
 * Generate multiple transformation URLs for responsive images
 * @param {string} publicId - Cloudinary public ID
 * @param {object} transformations - Object with named transformations
 * @returns {object} Object with URLs for each transformation
 */
const getResponsiveUrls = (publicId, transformations = {}) => {
    if (!publicId) return null;

    const urls = {};
    for (const [name, transformation] of Object.entries(transformations)) {
        urls[name] = getTransformedUrl(publicId, transformation);
    }
    return urls;
};

/**
 * Get product image URLs with all common sizes
 * @param {string} publicId - Cloudinary public ID
 * @returns {object} URLs for different sizes
 */
const getProductImageUrls = (publicId) => {
    return getResponsiveUrls(publicId, {
        thumbnail: IMAGE_TRANSFORMATIONS.THUMBNAIL_MEDIUM,
        card: IMAGE_TRANSFORMATIONS.PRODUCT_CARD,
        detail: IMAGE_TRANSFORMATIONS.PRODUCT_DETAIL,
        zoom: IMAGE_TRANSFORMATIONS.PRODUCT_ZOOM,
    });
};

/**
 * Get avatar URLs with all common sizes
 * @param {string} publicId - Cloudinary public ID
 * @returns {object} URLs for different sizes
 */
const getAvatarUrls = (publicId) => {
    return getResponsiveUrls(publicId, {
        small: IMAGE_TRANSFORMATIONS.AVATAR_SMALL,
        medium: IMAGE_TRANSFORMATIONS.AVATAR_MEDIUM,
        large: IMAGE_TRANSFORMATIONS.AVATAR_LARGE,
    });
};

/**
 * Get store branding URLs
 * @param {string} logoPublicId - Logo public ID
 * @param {string} bannerPublicId - Banner public ID
 * @returns {object} URLs for logo and banner
 */
const getStoreBrandingUrls = (logoPublicId, bannerPublicId) => {
    return {
        logo: logoPublicId
            ? getTransformedUrl(logoPublicId, IMAGE_TRANSFORMATIONS.STORE_LOGO)
            : null,
        banner: bannerPublicId
            ? getResponsiveUrls(bannerPublicId, {
                  desktop: IMAGE_TRANSFORMATIONS.STORE_BANNER,
                  mobile: IMAGE_TRANSFORMATIONS.STORE_BANNER_MOBILE,
              })
            : null,
    };
};

export {
    getTransformedUrl,
    getResponsiveUrls,
    getProductImageUrls,
    getAvatarUrls,
    getStoreBrandingUrls,
};
