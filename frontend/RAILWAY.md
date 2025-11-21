# Railway Deployment Guide

## Frontend Deployment

### Prerequisites
- Railway account (https://railway.app)
- GitHub repository connected

### Deployment Steps

1. **Create New Project in Railway**
   - Go to Railway dashboard
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your `JumpJumpJump` repository

2. **Configure Service**
   - Railway will auto-detect the Dockerfile
   - Set root directory to `frontend`
   - Or Railway will auto-detect from `railway.json`

3. **Set Environment Variables**
   ```
   VITE_API_BASE_URL=https://your-backend-service.railway.app
   ```
   - Go to your service → Variables
   - Add the `VITE_API_BASE_URL` variable
   - Set it to your backend Railway URL
   - Railway will automatically pass this as a build arg to Docker

4. **Deploy**
   - Railway will automatically build and deploy
   - Uses multi-stage Docker build (Node.js → Nginx)
   - Serves static files via Nginx on port 80

### Files Created
- `Dockerfile` - Multi-stage build (Node.js 20+ builder + Nginx server)
- `.dockerignore` - Excludes unnecessary files from Docker image
- `nginx.conf` - Production-ready Nginx configuration
- `railway.json` - Railway deployment configuration

### Features
✅ Node.js 20+ for building (alpine image)
✅ Multi-stage Docker build for minimal image size
✅ Environment variables baked into build (VITE_API_BASE_URL)
✅ Nginx for fast static file serving
✅ Gzip compression enabled
✅ Security headers configured
✅ Static asset caching (1 year)
✅ SPA routing support (fallback to index.html)
✅ Health check endpoint at `/health`
✅ Environment variable support for API URL

### Local Docker Testing
```bash
# Build the image
docker build -t jumpjumpjump-frontend .

# Run locally
docker run -p 8080:80 jumpjumpjump-frontend

# Visit http://localhost:8080
```

### Production URL
After deployment, Railway will provide a URL like:
`https://your-frontend-service.up.railway.app`

### Updating API URL
1. Deploy backend first and get its Railway URL
2. Update frontend environment variable: `VITE_API_BASE_URL`
3. Redeploy frontend (or Railway will auto-redeploy)

### Troubleshooting
- Check Railway logs for build errors
- Ensure `pnpm-lock.yaml` is committed
- Verify environment variables are set correctly
- Check that backend URL is accessible (CORS configured)
