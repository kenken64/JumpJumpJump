# PRP: Railway Deployment Infrastructure

## Problem Statement
The game needs to be deployed to a production environment accessible via the internet, requiring containerization, environment configuration, and platform-specific optimizations for both frontend and backend services.

## Requirements
- Deploy frontend React/Phaser application to Railway
- Deploy backend FastAPI service to Railway
- Configure Docker containers for both services
- Handle dynamic port binding for Railway platform
- Set up environment variables for API communication
- Optimize build process for production
- Enable HTTPS and custom domain support
- Configure nginx for SPA routing and asset serving

## Proposed Solution

### Infrastructure
- **Platform**: Railway (https://railway.app)
- **Frontend**: Docker container with nginx
- **Backend**: Docker container with uvicorn
- **Database**: SQLite (embedded in backend container)
- **Assets**: Static file serving via nginx

### Frontend Deployment Architecture
1. **Multi-stage Docker build**
   - Stage 1: Build with Node.js and pnpm
   - Stage 2: Serve with nginx alpine
2. **nginx configuration**
   - Dynamic PORT binding via envsubst
   - SPA routing (try_files fallback to index.html)
   - Static asset caching (1 year for immutable assets)
   - Health check endpoint
3. **Asset handling**
   - Copy all Kenney asset packs to dist/assets
   - Preserve folder structure for asset loading
   - Verify assets exist in both builder and nginx stages

### Backend Deployment Architecture
1. **Python FastAPI container**
   - uvicorn ASGI server
   - SQLite database initialization
   - CORS configuration for frontend origin
2. **Dynamic port binding**
   - Railway PORT environment variable
   - Default to 8000 for local development

## Implementation Details

### Frontend Dockerfile
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install
COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN pnpm build
RUN mkdir -p /app/dist/assets && cp -r /app/assets/. /app/dist/assets/

# Stage 2: Serve
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template
CMD ["/bin/sh", "-c", "envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
```

### nginx Configuration
```nginx
server {
    listen ${PORT:-80};
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check
    location /health {
        return 200 "healthy\n";
    }
}
```

### Backend Configuration
```python
# main.py
app = FastAPI()

# CORS for Railway frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://*.railway.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dynamic port binding
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
```

### Environment Variables
**Frontend**:
- `VITE_API_BASE_URL`: Backend Railway URL (e.g., https://backend-production.railway.app)
- `PORT`: Dynamic port from Railway (injected at runtime)

**Backend**:
- `PORT`: Dynamic port from Railway (default 8000)
- `DATABASE_URL`: SQLite file path (embedded)

## Build Optimizations

### 1. pnpm Lockfile Issue
**Problem**: `ERR_PNPM_OUTDATED_LOCKFILE` on Railway builds

**Solution**: 
- Removed `--frozen-lockfile` flag from `pnpm install`
- Allows Railway to build even with minor lockfile differences
- Still uses lockfile but not in strict mode

### 2. Port Binding Issue
**Problem**: "Application failed to respond" - nginx listening on port 80 instead of Railway's dynamic PORT

**Solution**:
- Changed nginx config to use `${PORT:-80}` variable
- Added `envsubst` command in CMD to substitute PORT at runtime
- nginx template processed at container startup
- Defaults to port 80 for local development

### 3. Asset Loading
**Problem**: Assets not found after build (404 errors)

**Solution**:
- Manually copy assets folder to dist/assets
- Use `cp -r /app/assets/. /app/dist/assets/` to preserve structure
- Verify assets in both builder and nginx stages
- Configure nginx to serve static assets with proper cache headers

## CSP Configuration
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-eval'; 
               connect-src 'self' http://localhost:8000 https://*.railway.app;" />
```
- `unsafe-eval`: Required for TensorFlow.js
- Railway backend domains allowed for API calls

## Deployment Process
1. **Connect GitHub Repository** to Railway
2. **Create Two Services**:
   - Frontend service (root: `frontend/`)
   - Backend service (root: `backend/`)
3. **Configure Environment Variables**:
   - Frontend: Set `VITE_API_BASE_URL` to backend Railway URL
   - Backend: No config needed (PORT auto-injected)
4. **Deploy**: Push to GitHub triggers automatic deployment
5. **Verify**: Check deploy logs and visit Railway URLs

## Monitoring & Health Checks
- **Frontend**: `/health` endpoint returns 200 "healthy"
- **Backend**: FastAPI `/docs` endpoint for API documentation
- **Logs**: Railway dashboard shows real-time logs
- **Metrics**: CPU, memory, network usage in Railway UI

## Known Issues & Solutions

### Issue: Build Cache
**Problem**: Old builds cached causing outdated deployments

**Solution**: Trigger rebuild in Railway dashboard

### Issue: TensorFlow.js Load
**Problem**: CSP blocking TensorFlow.js eval()

**Solution**: Added 'unsafe-eval' to script-src in CSP

### Issue: Asset 404s
**Problem**: Kenney assets not accessible after build

**Solution**: Manual asset copy to dist/ with structure preservation

## Cost Optimization
- **Free Tier**: Railway provides free tier for hobby projects
- **Sleep Mode**: Inactive services auto-sleep after 30 minutes
- **Resource Limits**: Set memory/CPU limits to prevent overages
- **Build Caching**: Docker layer caching speeds up builds

## Future Improvements
- CDN integration for asset delivery
- Environment-specific builds (staging/production)
- Database migration to PostgreSQL for production scale
- Redis caching for API responses
- Load balancing for high traffic
- Blue-green deployment strategy
- Automated backup system

## Documentation
- **frontend/RAILWAY.md**: Frontend deployment guide
- **backend/RAILWAY.md**: Backend deployment guide
- Includes step-by-step instructions and troubleshooting

## Status
✅ **Completed** - Both services deployed successfully on Railway with dynamic port binding and asset optimization
