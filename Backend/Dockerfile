# ==========================================
# Stage 1: Build & Dependencies Layer
# ==========================================
FROM node:20-alpine AS builder

# Set working directory for the build stage
WORKDIR /usr/src/app

# Copy dependency graphs first to maximize layer caching
COPY package*.json ./

# Install EXACT production dependencies based on lockfile
# Ignoring dev dependencies (like jest tests, playwright, etc.)
RUN npm ci --omit=dev

# ==========================================
# Stage 2: Production Execution Layer
# ==========================================
FROM node:20-alpine AS runner

# Install dumb-init for proper process management and signal proxying
# Node is not meant to be PID 1 in a container
RUN apk add --no-cache dumb-init

# Set the working directory
WORKDIR /usr/src/app

# Enhance security by running internal application without root privileges
RUN chown -R node:node /usr/src/app
USER node

# Define explicit runtime environment variables
ENV NODE_ENV=production
ENV PORT=8000

# Copy node packages from builder stage
# This inherently avoids carrying ~/.npm and npm caching into the final image
COPY --from=builder --chown=node:node /usr/src/app/node_modules ./node_modules

# Copy the rest of the source, retaining non-root ownership
COPY --chown=node:node . .

# Expose the API port designated in Node variables
EXPOSE 8000

# Health check to ensure the application is responsive.
# Matches the /health endpoint present in src/index.js
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8000/health || exit 1

# Start the server executing node via dumb-init for fault tolerance
# Using 'node' directly works significantly better with Docker's graceful shutdown signals.
CMD ["dumb-init", "node", "src/index.js"]
