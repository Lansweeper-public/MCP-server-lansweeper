# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package.json yarn.lock ./

# Install all dependencies (including dev dependencies for build)
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the TypeScript project
RUN yarn build

# Dependencies stage - Install only production dependencies
FROM node:22-alpine AS deps

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install only production dependencies
RUN yarn install --frozen-lockfile --production && \
    yarn cache clean

# Final production stage - Use Google's distroless Node.js image for maximum security
FROM gcr.io/distroless/nodejs22-debian12:nonroot

WORKDIR /app

# Copy built application from build stage
COPY --from=builder /app/dist ./dist

# Copy production dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy package.json for runtime metadata
COPY --from=builder /app/package.json ./

# Expose the HTTP port
EXPOSE 8080

# Set environment variables for HTTP mode
ENV MCP_TRANSPORT_MODE=http
ENV MCP_HTTP_PORT=8080

# Start the application
CMD ["dist/index.js"]