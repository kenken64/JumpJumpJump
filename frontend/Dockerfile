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
ARG VITE_WS_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_KEY=$VITE_API_KEY
ENV VITE_WS_BASE_URL=$VITE_WS_BASE_URL

# Build the application with environment variables
RUN pnpm build

# Manually copy assets to dist/assets (preserve directory structure)
RUN mkdir -p /app/dist/assets && \
    cp -r /app/assets/* /app/dist/assets/ && \
    echo "=== Assets copied to dist/assets ===" && \
    ls -la /app/dist/assets/ && \
    echo "=== Verify shieldGold.png ===" && \
    ls -la /app/dist/assets/kenney_platformer-art-requests/Tiles/shieldGold.png && \
    echo "=== Verify alienBeige_stand.png ===" && \
    ls -la "/app/dist/assets/kenney_platformer-art-extended-enemies/Alien sprites/alienBeige_stand.png"

# Stage 2: Production server with nginx
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Verify files in nginx (most important check!)
RUN echo "=== Files in nginx root ===" && ls -la /usr/share/nginx/html && \
    echo "=== index.html ===" && ls -la /usr/share/nginx/html/index.html && \
    echo "=== Assets folder ===" && ls -la /usr/share/nginx/html/assets/ && \
    echo "=== Sample asset file ===" && ls -la /usr/share/nginx/html/assets/kenney_platformer-art-requests/Tiles/shieldGold.png || echo "shieldGold.png NOT FOUND"

# Copy nginx configuration template
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Expose port (Railway will override this with PORT env var)
EXPOSE 8080

# Set default PORT to 8080 if not provided by Railway
ENV PORT=8080

# Use envsubst to replace $PORT in nginx config and start nginx
CMD ["/bin/sh", "-c", "envsubst '$PORT' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
