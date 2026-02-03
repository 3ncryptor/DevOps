import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import { ProductPrice } from "../models/productPrice.model.js";
import { Inventory } from "../models/inventory.model.js";
import { Store } from "../models/store.model.js";
import { ApiError } from "../utils/ApiError.js";
import { checkStockAvailability } from "./inventory.service.js";
import { PRODUCT_STATUS, STORE_STATUS } from "../constants/index.js";

/**
 * Get or create cart for user
 */
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ userId });
  
  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }

  return cart;
};

/**
 * Get cart with enriched product data
 */
const getCartWithDetails = async (userId) => {
  const cart = await Cart.findOne({ userId })
    .populate({
      path: "items.productId",
      select: "identity status storeId categoryId",
      populate: [
        { path: "storeId", select: "storeIdentity.name storeIdentity.slug storeStatus" },
        { path: "categoryId", select: "name" }
      ]
    })
    .lean();

  if (!cart || cart.items.length === 0) {
    return {
      userId,
      items: [],
      summary: {
        itemCount: 0,
        subtotal: 0,
        currency: "USD"
      }
    };
  }

  // Get prices for all products
  const productIds = cart.items.map(item => item.productId._id);
  const prices = await ProductPrice.find({
    productId: { $in: productIds },
    effectiveFrom: { $lte: new Date() },
    $or: [{ effectiveTo: null }, { effectiveTo: { $gte: new Date() } }]
  }).lean();

  // Get inventory for all products
  const inventories = await Inventory.find({ productId: { $in: productIds } }).lean();

  // Create lookup maps
  const priceMap = new Map();
  prices.forEach(p => {
    const id = p.productId.toString();
    if (!priceMap.has(id) || p.effectiveFrom > priceMap.get(id).effectiveFrom) {
      priceMap.set(id, p);
    }
  });

  const inventoryMap = new Map();
  inventories.forEach(i => inventoryMap.set(i.productId.toString(), i));

  // Enrich items with price and availability
  let subtotal = 0;
  const enrichedItems = cart.items.map(item => {
    const productId = item.productId._id.toString();
    const price = priceMap.get(productId);
    const inventory = inventoryMap.get(productId);

    const isAvailable = 
      item.productId.status === PRODUCT_STATUS.PUBLISHED &&
      item.productId.storeId?.storeStatus === STORE_STATUS.ACTIVE &&
      inventory &&
      inventory.availableStock >= item.quantity;

    const lineTotal = price ? price.price * item.quantity : 0;
    subtotal += lineTotal;

    return {
      ...item,
      price: price ? {
        unitPrice: price.price,
        currency: price.currency,
        lineTotal
      } : null,
      availability: {
        inStock: inventory ? inventory.availableStock > 0 : false,
        availableQuantity: inventory ? inventory.availableStock : 0,
        isAvailable
      }
    };
  });

  return {
    _id: cart._id,
    userId: cart.userId,
    items: enrichedItems,
    summary: {
      itemCount: enrichedItems.length,
      totalQuantity: enrichedItems.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      currency: "USD"
    },
    updatedAt: cart.updatedAt
  };
};

/**
 * Add item to cart
 */
const addToCart = async (userId, productId, quantity = 1) => {
  if (quantity < 1) {
    throw new ApiError(400, "Quantity must be at least 1");
  }

  // Validate product
  const product = await Product.findById(productId).populate("storeId");
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  if (product.status !== PRODUCT_STATUS.PUBLISHED) {
    throw new ApiError(400, "This product is not available for purchase");
  }

  if (product.storeId.storeStatus !== STORE_STATUS.ACTIVE) {
    throw new ApiError(400, "This store is not currently accepting orders");
  }

  // Check inventory
  const inventory = await Inventory.findOne({ productId });
  if (!inventory || inventory.availableStock < quantity) {
    throw new ApiError(400, "Insufficient stock available");
  }

  // Get or create cart
  let cart = await getOrCreateCart(userId);

  // Check if product already in cart
  const existingItemIndex = cart.items.findIndex(
    item => item.productId.toString() === productId
  );

  if (existingItemIndex >= 0) {
    // Update quantity
    const newQuantity = cart.items[existingItemIndex].quantity + quantity;
    
    if (inventory.availableStock < newQuantity) {
      throw new ApiError(400, `Only ${inventory.availableStock} items available`);
    }

    cart.items[existingItemIndex].quantity = newQuantity;
  } else {
    // Add new item
    cart.items.push({
      productId,
      storeId: product.storeId._id,
      quantity,
      addedAt: new Date()
    });
  }

  await cart.save();

  return getCartWithDetails(userId);
};

/**
 * Update cart item quantity
 */
const updateCartItem = async (userId, productId, quantity) => {
  if (quantity < 1) {
    throw new ApiError(400, "Quantity must be at least 1");
  }

  const cart = await Cart.findOne({ userId });
  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  const itemIndex = cart.items.findIndex(
    item => item.productId.toString() === productId
  );

  if (itemIndex < 0) {
    throw new ApiError(404, "Item not found in cart");
  }

  // Check inventory
  const inventory = await Inventory.findOne({ productId });
  if (!inventory || inventory.availableStock < quantity) {
    throw new ApiError(400, `Only ${inventory?.availableStock || 0} items available`);
  }

  cart.items[itemIndex].quantity = quantity;
  await cart.save();

  return getCartWithDetails(userId);
};

/**
 * Remove item from cart
 */
const removeFromCart = async (userId, productId) => {
  const cart = await Cart.findOne({ userId });
  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  const itemIndex = cart.items.findIndex(
    item => item.productId.toString() === productId
  );

  if (itemIndex < 0) {
    throw new ApiError(404, "Item not found in cart");
  }

  cart.items.splice(itemIndex, 1);
  await cart.save();

  return getCartWithDetails(userId);
};

/**
 * Clear cart
 */
const clearCart = async (userId) => {
  await Cart.findOneAndUpdate(
    { userId },
    { items: [] }
  );

  return {
    userId,
    items: [],
    summary: {
      itemCount: 0,
      subtotal: 0,
      currency: "USD"
    }
  };
};

/**
 * Validate cart for checkout
 * Returns validation result with any issues
 */
const validateCartForCheckout = async (userId) => {
  const cart = await getCartWithDetails(userId);

  if (cart.items.length === 0) {
    throw new ApiError(400, "Cart is empty");
  }

  const issues = [];
  const validItems = [];

  for (const item of cart.items) {
    const itemIssues = [];

    // Check product availability
    if (!item.productId || item.productId.status !== PRODUCT_STATUS.PUBLISHED) {
      itemIssues.push("Product is no longer available");
    }

    // Check store status
    if (!item.productId?.storeId || item.productId.storeId.storeStatus !== STORE_STATUS.ACTIVE) {
      itemIssues.push("Store is not currently accepting orders");
    }

    // Check stock
    if (!item.availability?.isAvailable) {
      if (item.availability?.availableQuantity === 0) {
        itemIssues.push("Out of stock");
      } else if (item.availability?.availableQuantity < item.quantity) {
        itemIssues.push(`Only ${item.availability.availableQuantity} available`);
      }
    }

    // Check price
    if (!item.price) {
      itemIssues.push("Price not available");
    }

    if (itemIssues.length > 0) {
      issues.push({
        productId: item.productId?._id,
        productTitle: item.productId?.identity?.title,
        issues: itemIssues
      });
    } else {
      validItems.push(item);
    }
  }

  return {
    isValid: issues.length === 0,
    cart,
    validItems,
    issues
  };
};

/**
 * Group cart items by store (for order creation)
 */
const groupCartByStore = async (userId) => {
  const cart = await getCartWithDetails(userId);

  if (cart.items.length === 0) {
    return { stores: [], summary: cart.summary };
  }

  const storeMap = new Map();

  for (const item of cart.items) {
    const storeId = item.productId?.storeId?._id?.toString();
    if (!storeId) continue;

    if (!storeMap.has(storeId)) {
      storeMap.set(storeId, {
        storeId,
        storeName: item.productId.storeId.storeIdentity?.name,
        storeSlug: item.productId.storeId.storeIdentity?.slug,
        items: [],
        subtotal: 0
      });
    }

    const store = storeMap.get(storeId);
    store.items.push(item);
    store.subtotal += item.price?.lineTotal || 0;
  }

  return {
    stores: Array.from(storeMap.values()),
    summary: cart.summary
  };
};

/**
 * Get cart item count
 */
const getCartItemCount = async (userId) => {
  const cart = await Cart.findOne({ userId });
  
  if (!cart) {
    return 0;
  }

  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
};

export {
  getOrCreateCart,
  getCartWithDetails,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  validateCartForCheckout,
  groupCartByStore,
  getCartItemCount
};
