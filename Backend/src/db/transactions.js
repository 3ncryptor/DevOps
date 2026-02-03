import mongoose from "mongoose";

/**
 * Execute a function within a MongoDB transaction
 * Handles session creation, commit, and rollback automatically
 * 
 * @param {Function} fn - Async function to execute within transaction
 *                        Receives session as argument
 * @returns {Promise<any>} Result of the function
 * @throws {Error} Rolls back transaction and rethrows error
 * 
 * @example
 * const result = await withTransaction(async (session) => {
 *   await Order.create([orderData], { session });
 *   await Inventory.updateOne({ productId }, { $inc: { available: -1 } }, { session });
 *   return order;
 * });
 */
export const withTransaction = async (fn) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Execute multiple operations in a transaction with retry logic
 * Retries on transient transaction errors
 * 
 * @param {Function} fn - Async function to execute
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 * @returns {Promise<any>} Result of the function
 */
export const withTransactionRetry = async (fn, maxRetries = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await withTransaction(fn);
    } catch (error) {
      lastError = error;

      // Check if it's a transient transaction error
      const isTransientError =
        error.errorLabels?.includes("TransientTransactionError") ||
        error.code === 112; // WriteConflict

      if (!isTransientError || attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff before retry
      const delay = Math.min(100 * Math.pow(2, attempt), 1000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

export default { withTransaction, withTransactionRetry };
