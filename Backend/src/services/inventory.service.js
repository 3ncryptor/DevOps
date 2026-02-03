import { Inventory } from "../models/inventory.model.js";
import { Product } from "../models/product.model.js";
import { Store } from "../models/store.model.js";
import { ApiError } from "../utils/ApiError.js";
import { createAuditLog } from "./audit.service.js";
import { AUDIT_ACTION, PAGINATION } from "../constants/index.js";

/**
 * Get inventory for a product
 */
const getInventory = async (productId) => {
  const inventory = await Inventory.findOne({ productId });
  if (!inventory) {
    throw new ApiError(404, "Inventory record not found");
  }
  return inventory;
};

/**
 * Update inventory stock
 */
const updateStock = async (productId, sellerId, { availableStock, reorderThreshold }, ipAddress = null, userAgent = null) => {
  const inventory = await Inventory.findOne({ productId }).populate({
    path: "productId",
    populate: { path: "storeId" }
  });

  if (!inventory) {
    throw new ApiError(404, "Inventory record not found");
  }

  // Verify ownership
  const product = await Product.findById(productId).populate("storeId");
  if (product.storeId.sellerId.toString() !== sellerId.toString()) {
    throw new ApiError(403, "You don't have permission to update this inventory");
  }

  const previousState = inventory.toObject();
  const updates = {};

  if (availableStock !== undefined) {
    if (availableStock < 0) {
      throw new ApiError(400, "Stock cannot be negative");
    }
    updates.availableStock = availableStock;
  }

  if (reorderThreshold !== undefined) {
    if (reorderThreshold < 0) {
      throw new ApiError(400, "Reorder threshold cannot be negative");
    }
    updates.reorderThreshold = reorderThreshold;
  }

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, "No valid fields to update");
  }

  const updatedInventory = await Inventory.findByIdAndUpdate(
    inventory._id,
    { $set: updates },
    { new: true }
  );

  // Log update
  await createAuditLog({
    action: AUDIT_ACTION.INVENTORY_UPDATE,
    userId: product.storeId.sellerId,
    targetType: "Inventory",
    targetId: inventory._id,
    previousState,
    newState: updatedInventory.toObject(),
    ipAddress,
    userAgent,
    sellerId,
    storeId: product.storeId._id
  });

  // Check for low stock
  if (updatedInventory.availableStock <= updatedInventory.reorderThreshold) {
    await createAuditLog({
      action: AUDIT_ACTION.INVENTORY_LOW_STOCK,
      userId: product.storeId.sellerId,
      targetType: "Product",
      targetId: productId,
      details: {
        currentStock: updatedInventory.availableStock,
        threshold: updatedInventory.reorderThreshold
      },
      sellerId,
      storeId: product.storeId._id
    });
  }

  return updatedInventory;
};

/**
 * Increment stock
 */
const incrementStock = async (productId, quantity, session = null) => {
  if (quantity <= 0) {
    throw new ApiError(400, "Quantity must be positive");
  }

  const options = session ? { session, new: true } : { new: true };

  const inventory = await Inventory.findOneAndUpdate(
    { productId },
    { $inc: { availableStock: quantity } },
    options
  );

  if (!inventory) {
    throw new ApiError(404, "Inventory record not found");
  }

  return inventory;
};

/**
 * Decrement stock (with reservation check)
 */
const decrementStock = async (productId, quantity, session = null) => {
  if (quantity <= 0) {
    throw new ApiError(400, "Quantity must be positive");
  }

  const inventory = await Inventory.findOne({ productId });
  if (!inventory) {
    throw new ApiError(404, "Inventory record not found");
  }

  if (inventory.availableStock < quantity) {
    throw new ApiError(400, "Insufficient stock");
  }

  const options = session ? { session, new: true } : { new: true };

  const updated = await Inventory.findOneAndUpdate(
    { productId, availableStock: { $gte: quantity } },
    { $inc: { availableStock: -quantity } },
    options
  );

  if (!updated) {
    throw new ApiError(400, "Insufficient stock");
  }

  return updated;
};

/**
 * Reserve stock (for cart/checkout)
 */
const reserveStock = async (productId, quantity, session = null) => {
  if (quantity <= 0) {
    throw new ApiError(400, "Quantity must be positive");
  }

  const inventory = await Inventory.findOne({ productId });
  if (!inventory) {
    throw new ApiError(404, "Inventory record not found");
  }

  const availableForReservation = inventory.availableStock - inventory.reservedStock;
  if (availableForReservation < quantity) {
    throw new ApiError(400, "Insufficient stock for reservation");
  }

  const options = session ? { session, new: true } : { new: true };

  const updated = await Inventory.findOneAndUpdate(
    { 
      productId,
      $expr: { $gte: [{ $subtract: ["$availableStock", "$reservedStock"] }, quantity] }
    },
    { $inc: { reservedStock: quantity } },
    options
  );

  if (!updated) {
    throw new ApiError(400, "Unable to reserve stock");
  }

  return updated;
};

/**
 * Release reserved stock
 */
const releaseReservedStock = async (productId, quantity, session = null) => {
  if (quantity <= 0) {
    throw new ApiError(400, "Quantity must be positive");
  }

  const options = session ? { session, new: true } : { new: true };

  const updated = await Inventory.findOneAndUpdate(
    { productId, reservedStock: { $gte: quantity } },
    { $inc: { reservedStock: -quantity } },
    options
  );

  if (!updated) {
    throw new ApiError(400, "Unable to release reserved stock");
  }

  return updated;
};

/**
 * Confirm reservation (convert reserved to sold)
 */
const confirmReservation = async (productId, quantity, session = null) => {
  if (quantity <= 0) {
    throw new ApiError(400, "Quantity must be positive");
  }

  const options = session ? { session, new: true } : { new: true };

  const updated = await Inventory.findOneAndUpdate(
    { 
      productId,
      reservedStock: { $gte: quantity },
      availableStock: { $gte: quantity }
    },
    { 
      $inc: { 
        availableStock: -quantity,
        reservedStock: -quantity 
      }
    },
    options
  );

  if (!updated) {
    throw new ApiError(400, "Unable to confirm reservation");
  }

  return updated;
};

/**
 * Get low stock products for a store
 */
const getLowStockProducts = async (storeId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const safeLimit = Math.min(limit, PAGINATION.MAX_LIMIT);

  const [items, total] = await Promise.all([
    Inventory.find({
      storeId,
      $expr: { $lte: ["$availableStock", "$reorderThreshold"] }
    })
      .populate("productId", "identity.title status")
      .sort({ availableStock: 1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Inventory.countDocuments({
      storeId,
      $expr: { $lte: ["$availableStock", "$reorderThreshold"] }
    })
  ]);

  return {
    items,
    pagination: {
      page,
      limit: safeLimit,
      total,
      pages: Math.ceil(total / safeLimit)
    }
  };
};

/**
 * Get inventory by store
 */
const getStoreInventory = async (storeId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const safeLimit = Math.min(limit, PAGINATION.MAX_LIMIT);

  const [items, total] = await Promise.all([
    Inventory.find({ storeId })
      .populate("productId", "identity.title identity.subtitle status")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Inventory.countDocuments({ storeId })
  ]);

  return {
    items,
    pagination: {
      page,
      limit: safeLimit,
      total,
      pages: Math.ceil(total / safeLimit)
    }
  };
};

/**
 * Check stock availability for multiple products
 */
const checkStockAvailability = async (items) => {
  const productIds = items.map(item => item.productId);
  const inventories = await Inventory.find({ productId: { $in: productIds } });

  const inventoryMap = new Map();
  inventories.forEach(inv => inventoryMap.set(inv.productId.toString(), inv));

  const results = items.map(item => {
    const inventory = inventoryMap.get(item.productId.toString());
    if (!inventory) {
      return {
        productId: item.productId,
        requested: item.quantity,
        available: 0,
        sufficient: false
      };
    }

    const available = inventory.availableStock - inventory.reservedStock;
    return {
      productId: item.productId,
      requested: item.quantity,
      available,
      sufficient: available >= item.quantity
    };
  });

  return {
    items: results,
    allAvailable: results.every(r => r.sufficient)
  };
};

export {
  getInventory,
  updateStock,
  incrementStock,
  decrementStock,
  reserveStock,
  releaseReservedStock,
  confirmReservation,
  getLowStockProducts,
  getStoreInventory,
  checkStockAvailability
};
