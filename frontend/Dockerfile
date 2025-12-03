# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_API_BASE_URL
ARG VITE_API_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_KEY=$VITE_API_KEY

# Build the application
RUN npm run build

# Verify build output
RUN ls -la /app/dist

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Verify files were copied
RUN ls -la /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Expose port
EXPOSE 8080

# Set default PORT environment variable
ENV PORT=8080

# Start nginx with environment variable substitution
CMD sh -c "envsubst '\$PORT' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"
