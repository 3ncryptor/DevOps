import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  getCartWithDetails,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  validateCartForCheckout,
  groupCartByStore,
  getCartItemCount
} from "../services/cart.service.js";

/**
 * @desc    Get user's cart
 * @route   GET /api/v1/cart
 * @access  Private
 */
const getCart = asyncHandler(async (req, res) => {
  const cart = await getCartWithDetails(req.user.id);

  res
    .status(200)
    .json(new ApiResponse(200, cart, "Cart retrieved"));
});

/**
 * @desc    Get cart item count
 * @route   GET /api/v1/cart/count
 * @access  Private
 */
const getCount = asyncHandler(async (req, res) => {
  const count = await getCartItemCount(req.user.id);

  res
    .status(200)
    .json(new ApiResponse(200, { count }, "Cart count retrieved"));
});

/**
 * @desc    Add item to cart
 * @route   POST /api/v1/cart/items
 * @access  Private
 */
const addItem = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    return res.status(400).json(new ApiResponse(400, null, "Product ID is required"));
  }

  const cart = await addToCart(req.user.id, productId, parseInt(quantity));

  res
    .status(200)
    .json(new ApiResponse(200, cart, "Item added to cart"));
});

/**
 * @desc    Update cart item quantity
 * @route   PATCH /api/v1/cart/items/:productId
 * @access  Private
 */
const updateItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    return res.status(400).json(new ApiResponse(400, null, "Valid quantity is required"));
  }

  const cart = await updateCartItem(req.user.id, productId, parseInt(quantity));

  res
    .status(200)
    .json(new ApiResponse(200, cart, "Cart updated"));
});

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/v1/cart/items/:productId
 * @access  Private
 */
const removeItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const cart = await removeFromCart(req.user.id, productId);

  res
    .status(200)
    .json(new ApiResponse(200, cart, "Item removed from cart"));
});

/**
 * @desc    Clear entire cart
 * @route   DELETE /api/v1/cart
 * @access  Private
 */
const clearCartHandler = asyncHandler(async (req, res) => {
  const cart = await clearCart(req.user.id);

  res
    .status(200)
    .json(new ApiResponse(200, cart, "Cart cleared"));
});

/**
 * @desc    Validate cart for checkout
 * @route   POST /api/v1/cart/validate
 * @access  Private
 */
const validateCart = asyncHandler(async (req, res) => {
  const validation = await validateCartForCheckout(req.user.id);

  const statusCode = validation.isValid ? 200 : 422;
  const message = validation.isValid 
    ? "Cart is valid for checkout" 
    : "Some items have issues";

  res
    .status(statusCode)
    .json(new ApiResponse(statusCode, validation, message));
});

/**
 * @desc    Get cart grouped by store
 * @route   GET /api/v1/cart/by-store
 * @access  Private
 */
const getCartByStore = asyncHandler(async (req, res) => {
  const grouped = await groupCartByStore(req.user.id);

  res
    .status(200)
    .json(new ApiResponse(200, grouped, "Cart grouped by store"));
});

export {
  getCart,
  getCount,
  addItem,
  updateItem,
  removeItem,
  clearCartHandler,
  validateCart,
  getCartByStore
};
