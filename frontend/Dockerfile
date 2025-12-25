# Multi-stage build for optimized production image
# Base images updated: 2025-12-25

# Stage 1: Build the application
# Using Node 20 LTS with Alpine 3.21 (latest stable)
FROM node:20-alpine3.21 AS builder

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
# Using nginx 1.28.1 (latest stable) with Alpine 3.21
# Note: nginx 1.28 is the latest stable branch (released April 2025)
# nginx 1.29.x is mainline/development branch
#
# Known security considerations:
# - Using minimal Alpine base to reduce attack surface
# - Running as non-root user (appuser)
# - Regular security updates via apk upgrade
FROM nginx:1.28.0-alpine3.21

# Upgrade system packages to fix vulnerabilities
RUN apk update && apk add --no-cache libxml2 && apk upgrade --no-cache

# Remove default nginx user and create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup && \
    chown -R appuser:appgroup /var/cache/nginx && \
    chown -R appuser:appgroup /var/log/nginx && \
    chown -R appuser:appgroup /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R appuser:appgroup /var/run/nginx.pid

# Copy built files from builder stage
COPY --from=builder --chown=appuser:appgroup /app/dist /usr/share/nginx/html

# Verify files in nginx (most important check!)
RUN echo "=== Files in nginx root ===" && ls -la /usr/share/nginx/html && \
    echo "=== index.html ===" && ls -la /usr/share/nginx/html/index.html && \
    echo "=== Assets folder ===" && ls -la /usr/share/nginx/html/assets/ && \
    echo "=== Sample asset file ===" && ls -la /usr/share/nginx/html/assets/kenney_platformer-art-requests/Tiles/shieldGold.png || echo "shieldGold.png NOT FOUND"

# Copy nginx configuration template
COPY --chown=appuser:appgroup nginx.conf /etc/nginx/templates/default.conf.template

# Expose port (Railway will override this with PORT env var)
EXPOSE 8080

# Set default PORT to 8080 if not provided by Railway
ENV PORT=8080

# Health check for nginx
# Note: Using wget instead of curl as it's available in Alpine by default
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:${PORT}/ || exit 1

# Switch to non-root user
USER appuser

# Use envsubst to replace $PORT in nginx config and start nginx
CMD ["/bin/sh", "-c", "envsubst '$PORT' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
