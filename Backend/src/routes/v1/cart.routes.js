import { Router } from "express";
import {
  getCart,
  getCount,
  addItem,
  updateItem,
  removeItem,
  clearCartHandler,
  validateCart,
  getCartByStore
} from "../../controllers/cart.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/role.middleware.js";
import ROLES from "../../constants/roles.js";

const router = Router();

// All cart routes require authentication and USER role
router.use(authenticate);
router.use(authorizeRoles(ROLES.USER));

/**
 * @route   GET /api/v1/cart
 * @desc    Get user's cart
 * @access  Private (USER)
 */
router.get("/", getCart);

/**
 * @route   GET /api/v1/cart/count
 * @desc    Get cart item count
 * @access  Private (USER)
 */
router.get("/count", getCount);

/**
 * @route   GET /api/v1/cart/by-store
 * @desc    Get cart grouped by store
 * @access  Private (USER)
 */
router.get("/by-store", getCartByStore);

/**
 * @route   POST /api/v1/cart/validate
 * @desc    Validate cart for checkout
 * @access  Private (USER)
 */
router.post("/validate", validateCart);

/**
 * @route   POST /api/v1/cart/items
 * @desc    Add item to cart
 * @access  Private (USER)
 */
router.post("/items", addItem);

/**
 * @route   PATCH /api/v1/cart/items/:productId
 * @desc    Update cart item quantity
 * @access  Private (USER)
 */
router.patch("/items/:productId", updateItem);

/**
 * @route   DELETE /api/v1/cart/items/:productId
 * @desc    Remove item from cart
 * @access  Private (USER)
 */
router.delete("/items/:productId", removeItem);

/**
 * @route   DELETE /api/v1/cart
 * @desc    Clear entire cart
 * @access  Private (USER)
 */
router.delete("/", clearCartHandler);

export default router;
