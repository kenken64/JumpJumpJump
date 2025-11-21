# Railway Deployment Guide - Backend

## Backend Deployment

### Prerequisites
- Railway account (https://railway.app)
- GitHub repository connected

### Deployment Steps

1. **Create New Service in Railway**
   - Go to Railway dashboard
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your `JumpJumpJump` repository
   - Create a new service for the backend

2. **Configure Service**
   - Railway will auto-detect the Dockerfile
   - Set root directory to `backend`
   - Or Railway will auto-detect from `railway.json`

3. **Set Environment Variables**
   ```
   ALLOWED_ORIGINS=https://your-frontend.railway.app,https://your-frontend.up.railway.app
   DATA_DIR=/app/data
   ```
   - Go to your service → Variables
   - Add `ALLOWED_ORIGINS` with your frontend URL(s) (comma-separated)
   - `DATA_DIR` is optional (defaults to `/app/data`)

4. **Add Persistent Volume (Optional but Recommended)**
   - Go to service → Settings → Volumes
   - Click "Add Volume"
   - Mount path: `/app/data`
   - This persists the SQLite database across deployments

5. **Deploy**
   - Railway will automatically build and deploy
   - Uses Python 3.11 slim image with uvicorn
   - Serves API on port 8000

### Files Created
- `Dockerfile` - Python 3.11 with uvicorn server
- `.dockerignore` - Excludes unnecessary files from Docker image
- `railway.json` - Railway deployment configuration
- `RAILWAY.md` - This deployment guide

### Features
✅ Python 3.11 slim image for smaller size
✅ Automatic dependency installation
✅ Health check endpoint configured
✅ Environment variable support for CORS
✅ Persistent volume support for database
✅ Uvicorn ASGI server for production

### Local Docker Testing
```bash
# Build the image
docker build -t jumpjumpjump-backend .

# Run locally
docker run -p 8000:8000 jumpjumpjump-backend

# Visit http://localhost:8000/docs for API documentation
```

### Production URL
After deployment, Railway will provide a URL like:
`https://your-backend-service.up.railway.app`

Copy this URL and use it in your frontend's `VITE_API_BASE_URL` environment variable.

### API Endpoints
- `GET /` - Health check
- `POST /api/scores` - Submit new score
- `GET /api/scores/leaderboard` - Get top scores
- `GET /api/scores/player/{name}` - Get player high score
- `GET /api/scores/rank/{score}` - Get score rank
- `GET /docs` - Interactive API documentation (Swagger UI)

### Database Persistence

**Without Volume:**
- Database stored in `/app/game.db`
- Resets on each deployment (ephemeral storage)

**With Volume (Recommended):**
- Database stored in `/app/data/game.db`
- Persists across deployments
- Add volume in Railway settings, mount to `/app/data`
- Set `DATA_DIR=/app/data` environment variable

### Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:5173` | Comma-separated list of allowed CORS origins |
| `DATA_DIR` | `/app` | Directory for database storage (use `/app/data` with volume) |

### Troubleshooting
- **CORS errors**: Add your frontend URL to `ALLOWED_ORIGINS`
- **Database resets**: Add a persistent volume mounted to `/app/data`
- **Build errors**: Check Railway logs for Python/pip errors
- **Connection refused**: Ensure service is running on port 8000

### Connecting Frontend to Backend
1. Deploy backend first and get its Railway URL
2. Update frontend environment variable:
   ```
   VITE_API_BASE_URL=https://your-backend.railway.app
   ```
3. Update backend `ALLOWED_ORIGINS` to include frontend URL
4. Redeploy both services if needed

### Monitoring
- Check Railway logs for requests and errors
- Visit `/docs` endpoint for API testing
- Use health check endpoint `/` to verify service status
