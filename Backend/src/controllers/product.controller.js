import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  createProduct,
  getProductWithDetails,
  getPublishedProduct,
  updateProduct,
  publishProduct,
  archiveProduct,
  deleteProduct,
  getProductsByStore,
  searchProducts,
  addProductImages,
  removeProductImage,
  getPriceHistory
} from "../services/product.service.js";
import {
  updateStock,
  getInventory,
  getLowStockProducts,
  getStoreInventory
} from "../services/inventory.service.js";
import { PRODUCT_STATUS } from "../constants/index.js";

/**
 * Extract client info from request
 */
const getClientInfo = (req) => ({
  ipAddress: req.ip || req.connection?.remoteAddress,
  userAgent: req.get("User-Agent")
});

// ============== SELLER ENDPOINTS ==============

/**
 * @desc    Create a new product
 * @route   POST /api/v1/products
 * @access  Private (SELLER)
 */
const createProductHandler = asyncHandler(async (req, res) => {
  const { ipAddress, userAgent } = getClientInfo(req);
  const { storeId } = req.body;

  if (!storeId) {
    return res.status(400).json(new ApiResponse(400, null, "Store ID is required"));
  }

  const product = await createProduct(
    req.seller._id,
    storeId,
    req.body,
    ipAddress,
    userAgent
  );

  res
    .status(201)
    .json(new ApiResponse(201, product, "Product created successfully"));
});

/**
 * @desc    Get my products
 * @route   GET /api/v1/products/my-products
 * @access  Private (SELLER)
 */
const getMyProducts = asyncHandler(async (req, res) => {
  const { storeId, status, categoryId, search, page = 1, limit = 20, sort } = req.query;

  if (!storeId) {
    return res.status(400).json(new ApiResponse(400, null, "Store ID is required"));
  }

  const result = await getProductsByStore(storeId, {
    status,
    categoryId,
    search,
    page: parseInt(page),
    limit: parseInt(limit),
    sort
  });

  res
    .status(200)
    .json(new ApiResponse(200, result, "Products retrieved"));
});

/**
 * @desc    Get my product by ID
 * @route   GET /api/v1/products/my-products/:productId
 * @access  Private (SELLER)
 */
const getMyProductById = asyncHandler(async (req, res) => {
  const product = await getProductWithDetails(req.params.productId);

  // Verify ownership is done by middleware
  res
    .status(200)
    .json(new ApiResponse(200, product, "Product retrieved"));
});

/**
 * @desc    Update my product
 * @route   PATCH /api/v1/products/my-products/:productId
 * @access  Private (SELLER)
 */
const updateMyProduct = asyncHandler(async (req, res) => {
  const { ipAddress, userAgent } = getClientInfo(req);
  const product = await updateProduct(
    req.params.productId,
    req.seller._id,
    req.body,
    ipAddress,
    userAgent
  );

  res
    .status(200)
    .json(new ApiResponse(200, product, "Product updated successfully"));
});

/**
 * @desc    Publish product
 * @route   POST /api/v1/products/my-products/:productId/publish
 * @access  Private (SELLER)
 */
const publishMyProduct = asyncHandler(async (req, res) => {
  const { ipAddress, userAgent } = getClientInfo(req);
  const product = await publishProduct(
    req.params.productId,
    req.seller._id,
    ipAddress,
    userAgent
  );

  res
    .status(200)
    .json(new ApiResponse(200, product, "Product published successfully"));
});

/**
 * @desc    Archive product
 * @route   POST /api/v1/products/my-products/:productId/archive
 * @access  Private (SELLER)
 */
const archiveMyProduct = asyncHandler(async (req, res) => {
  const { ipAddress, userAgent } = getClientInfo(req);
  const product = await archiveProduct(
    req.params.productId,
    req.seller._id,
    ipAddress,
    userAgent
  );

  res
    .status(200)
    .json(new ApiResponse(200, product, "Product archived"));
});

/**
 * @desc    Delete product
 * @route   DELETE /api/v1/products/my-products/:productId
 * @access  Private (SELLER)
 */
const deleteMyProduct = asyncHandler(async (req, res) => {
  const { ipAddress, userAgent } = getClientInfo(req);
  await deleteProduct(
    req.params.productId,
    req.seller._id,
    ipAddress,
    userAgent
  );

  res
    .status(200)
    .json(new ApiResponse(200, null, "Product deleted"));
});

/**
 * @desc    Add images to product
 * @route   POST /api/v1/products/my-products/:productId/images
 * @access  Private (SELLER)
 */
const addProductImagesHandler = asyncHandler(async (req, res) => {
  const { images } = req.body;

  if (!images || !Array.isArray(images) || images.length === 0) {
    return res.status(400).json(new ApiResponse(400, null, "Images array is required"));
  }

  const result = await addProductImages(
    req.params.productId,
    req.seller._id,
    images
  );

  res
    .status(201)
    .json(new ApiResponse(201, result, "Images added"));
});

/**
 * @desc    Remove image from product
 * @route   DELETE /api/v1/products/my-products/:productId/images/:imageId
 * @access  Private (SELLER)
 */
const removeProductImageHandler = asyncHandler(async (req, res) => {
  await removeProductImage(
    req.params.productId,
    req.params.imageId,
    req.seller._id
  );

  res
    .status(200)
    .json(new ApiResponse(200, null, "Image removed"));
});

/**
 * @desc    Update product inventory
 * @route   PATCH /api/v1/products/my-products/:productId/inventory
 * @access  Private (SELLER)
 */
const updateProductInventory = asyncHandler(async (req, res) => {
  const { ipAddress, userAgent } = getClientInfo(req);
  const inventory = await updateStock(
    req.params.productId,
    req.seller._id,
    req.body,
    ipAddress,
    userAgent
  );

  res
    .status(200)
    .json(new ApiResponse(200, inventory, "Inventory updated"));
});

/**
 * @desc    Get low stock products
 * @route   GET /api/v1/products/low-stock
 * @access  Private (SELLER)
 */
const getLowStock = asyncHandler(async (req, res) => {
  const { storeId, page = 1, limit = 20 } = req.query;

  if (!storeId) {
    return res.status(400).json(new ApiResponse(400, null, "Store ID is required"));
  }

  const result = await getLowStockProducts(storeId, parseInt(page), parseInt(limit));

  res
    .status(200)
    .json(new ApiResponse(200, result, "Low stock products retrieved"));
});

/**
 * @desc    Get store inventory
 * @route   GET /api/v1/products/inventory
 * @access  Private (SELLER)
 */
const getInventoryList = asyncHandler(async (req, res) => {
  const { storeId, page = 1, limit = 20 } = req.query;

  if (!storeId) {
    return res.status(400).json(new ApiResponse(400, null, "Store ID is required"));
  }

  const result = await getStoreInventory(storeId, parseInt(page), parseInt(limit));

  res
    .status(200)
    .json(new ApiResponse(200, result, "Inventory retrieved"));
});

// ============== PUBLIC ENDPOINTS ==============

/**
 * @desc    Search products
 * @route   GET /api/v1/products
 * @access  Public
 */
const searchProductsHandler = asyncHandler(async (req, res) => {
  const { search, categoryId, storeId, minPrice, maxPrice, page = 1, limit = 20 } = req.query;

  const result = await searchProducts({
    search,
    categoryId,
    storeId,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    page: parseInt(page),
    limit: parseInt(limit)
  });

  res
    .status(200)
    .json(new ApiResponse(200, result, "Products retrieved"));
});

/**
 * @desc    Get product by ID
 * @route   GET /api/v1/products/:productId
 * @access  Public
 */
const getProductById = asyncHandler(async (req, res) => {
  const product = await getPublishedProduct(req.params.productId);

  res
    .status(200)
    .json(new ApiResponse(200, product, "Product retrieved"));
});

/**
 * @desc    Get products by store
 * @route   GET /api/v1/products/store/:storeId
 * @access  Public
 */
const getProductsByStoreHandler = asyncHandler(async (req, res) => {
  const { categoryId, search, minPrice, maxPrice, page = 1, limit = 20, sort } = req.query;

  const result = await getProductsByStore(req.params.storeId, {
    status: PRODUCT_STATUS.PUBLISHED,
    categoryId,
    search,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    page: parseInt(page),
    limit: parseInt(limit),
    sort
  });

  res
    .status(200)
    .json(new ApiResponse(200, result, "Products retrieved"));
});

/**
 * @desc    Get product price history
 * @route   GET /api/v1/products/my-products/:productId/price-history
 * @access  Private (SELLER)
 */
const getPriceHistoryHandler = asyncHandler(async (req, res) => {
  const history = await getPriceHistory(req.params.productId, req.seller._id);

  res
    .status(200)
    .json(new ApiResponse(200, history, "Price history retrieved"));
});

export {
  // Seller endpoints
  createProductHandler,
  getMyProducts,
  getMyProductById,
  updateMyProduct,
  publishMyProduct,
  archiveMyProduct,
  deleteMyProduct,
  addProductImagesHandler,
  removeProductImageHandler,
  updateProductInventory,
  getLowStock,
  getInventoryList,
  getPriceHistoryHandler,
  // Public endpoints
  searchProductsHandler,
  getProductById,
  getProductsByStoreHandler
};
