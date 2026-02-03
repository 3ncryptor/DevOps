import mongoose from "mongoose";
import { logger, logSystem } from "../config/logger.config.js";

const DB_NAME = "zentra";

// Connection configuration
const CONNECTION_OPTIONS = {
  dbName: DB_NAME,
  maxPoolSize: 10,           // Maximum number of connections in the pool
  minPoolSize: 2,            // Minimum number of connections in the pool
  socketTimeoutMS: 45000,    // Close sockets after 45 seconds of inactivity
  serverSelectionTimeoutMS: 5000, // Timeout for server selection
  heartbeatFrequencyMS: 10000,    // Frequency of server monitoring
  retryWrites: true,         // Retry failed writes
  retryReads: true           // Retry failed reads
};

// Retry configuration
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

/**
 * Connect to MongoDB with retry logic
 */
const connectDB = async (retryCount = 0) => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error("MONGODB_URI environment variable is not defined");
    }

    // Validate URI format
    if (!mongoUri.startsWith("mongodb://") && !mongoUri.startsWith("mongodb+srv://")) {
      throw new Error("Invalid MONGODB_URI format. Must start with mongodb:// or mongodb+srv://");
    }

    logger.info(`Connecting to MongoDB (attempt ${retryCount + 1}/${MAX_RETRIES})`);

    const connectionInstance = await mongoose.connect(mongoUri, CONNECTION_OPTIONS);

    const { host, port, name } = connectionInstance.connection;
    logSystem.dbConnected(host, name);
    logger.debug(`MongoDB connected: ${host}${port ? `:${port}` : ""}/${name}`);

    // Setup connection event handlers
    setupConnectionHandlers();

    return connectionInstance;

  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);

    // Retry logic for transient failures
    if (retryCount < MAX_RETRIES - 1 && isRetryableError(error)) {
      logger.warn(`Retrying in ${RETRY_DELAY_MS / 1000} seconds...`);
      await delay(RETRY_DELAY_MS);
      return connectDB(retryCount + 1);
    }

    // Fatal error - throw to stop server startup
    throw new Error(`Failed to connect to MongoDB after ${retryCount + 1} attempts: ${error.message}`);
  }
};

/**
 * Setup MongoDB connection event handlers
 */
const setupConnectionHandlers = () => {
  const connection = mongoose.connection;

  connection.on("error", (err) => {
    logger.error("MongoDB connection error", { error: err.message });
  });

  connection.on("disconnected", () => {
    logSystem.dbDisconnected();
  });

  connection.on("reconnected", () => {
    logger.info("MongoDB reconnected");
  });

  connection.on("close", () => {
    logger.info("MongoDB connection closed");
  });

  // Log when connection is ready
  connection.once("open", () => {
    logger.debug("MongoDB connection pool established");
  });
};

/**
 * Check if error is retryable (network issues, server selection timeout)
 */
const isRetryableError = (error) => {
  const retryableCodes = [
    "ECONNREFUSED",
    "ENOTFOUND",
    "ETIMEDOUT",
    "ECONNRESET",
    "MongoNetworkError",
    "MongoServerSelectionError"
  ];

  return retryableCodes.some(code => 
    error.message?.includes(code) || 
    error.name?.includes(code) ||
    error.code === code
  );
};

/**
 * Delay helper for retry logic
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Disconnect from MongoDB gracefully
 */
export const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      logger.debug("MongoDB already disconnected");
      return;
    }

    await mongoose.connection.close();
    logger.info("MongoDB connection closed gracefully");
  } catch (error) {
    logger.error("Error closing MongoDB connection", { error: error.message });
    throw error;
  }
};

/**
 * Get current connection status
 */
export const getConnectionStatus = () => {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
  };
  
  return {
    state: states[mongoose.connection.readyState] || "unknown",
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    name: mongoose.connection.name
  };
};

/**
 * Check if database is connected
 */
export const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

export default connectDB;
