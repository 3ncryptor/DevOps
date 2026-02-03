/**
 * Zentra Commerce Platform
 * Entry point for the application
 */

import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB, { disconnectDB } from "./db/connect.js";
import { logger, logSystem } from "./config/logger.config.js";

const PORT = process.env.PORT || 8000;
const NODE_ENV = process.env.NODE_ENV || "development";

let server;

/**
 * Start the server
 */
const startServer = async () => {
  try {
    logSystem.startup(PORT, NODE_ENV);
    
    // Connect to MongoDB
    await connectDB();
    
    // Start Express server
    server = app.listen(PORT, () => {
      logSystem.ready(PORT);
      
      if (NODE_ENV !== "production") {
        console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 ZENTRA COMMERCE API                                  ║
║                                                           ║
║   Server:      http://localhost:${PORT}                     ║
║   API Docs:    http://localhost:${PORT}/api-docs             ║
║   Health:      http://localhost:${PORT}/health               ║
║   Environment: ${NODE_ENV.padEnd(41)}║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
        `);
      }
    });

    // Handle server errors
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        logger.error(`Port ${PORT} is already in use`);
      } else {
        logger.error("Server error", { error: error.message, stack: error.stack });
      }
      process.exit(1);
    });

  } catch (error) {
    logger.error("Server startup failed", { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

/**
 * Graceful shutdown handler
 */
const shutdown = async (signal) => {
  logSystem.shutdown(signal);

  // Create shutdown timeout
  const shutdownTimeout = setTimeout(() => {
    logger.error("Shutdown timeout - forcing exit");
    process.exit(1);
  }, 15000); // 15 second timeout

  try {
    // Close HTTP server (stop accepting new connections)
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
      logger.info("HTTP server closed");
    }

    // Disconnect from database
    await disconnectDB();
    logger.info("Database connection closed");

    clearTimeout(shutdownTimeout);
    logger.info("Graceful shutdown complete");
    process.exit(0);

  } catch (error) {
    logger.error("Error during shutdown", { error: error.message });
    clearTimeout(shutdownTimeout);
    process.exit(1);
  }
};

// Signal handlers for graceful shutdown
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception", { error: error.message, stack: error.stack });
  // Attempt graceful shutdown
  shutdown("uncaughtException").catch(() => process.exit(1));
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection", { reason: String(reason) });
  // Don't exit, just log - let the error middleware handle it
});

// Start the server
startServer();
