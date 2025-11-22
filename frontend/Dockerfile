# Multi-stage build for optimized production image

# Stage 1: Build the application
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies (remove --frozen-lockfile to allow Railway builds)
RUN pnpm install

# Copy source code and environment files
COPY . .

# Accept build-time environment variables
ARG VITE_API_BASE_URL
ARG VITE_API_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_KEY=$VITE_API_KEY

# Build the application with environment variables
RUN pnpm build

# List assets before copy to verify they exist
RUN echo "=== Checking assets folder ===" && ls -la /app/assets

# Manually copy assets contents to dist/assets (note the /. to copy contents, not folder)
RUN mkdir -p /app/dist/assets && cp -r /app/assets/. /app/dist/assets/

# Verify assets were copied with folder structure
RUN echo "=== Assets in dist ===" && ls -la /app/dist/assets && ls -la /app/dist/assets/kenney_platformer-art-requests/Tiles/ | head -20

# Stage 2: Production server with nginx
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Verify assets in nginx
RUN echo "=== Assets in nginx ===" && ls -la /usr/share/nginx/html/assets

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port (Railway will override this with PORT env var)
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
