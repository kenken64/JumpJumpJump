# JumpJumpJump - Start/Stop Scripts

This folder contains scripts to easily start and stop the frontend and backend services.

## Windows PowerShell Scripts (Recommended)

### Start Services
```powershell
.\scripts\start.ps1
```

This will:
- Start the FastAPI backend server on port 8000
- Start the React + Vite frontend server on port 3000
- Open both in separate terminal windows

### Stop Services
```powershell
.\scripts\stop.ps1
```

This will:
- Stop all Node.js processes (frontend)
- Stop all Python processes (backend)

**Note**: If you get execution policy errors, run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Windows Batch Scripts (Alternative)

### Start Services
```cmd
.\scripts\start.bat
```

### Stop Services
```cmd
.\scripts\stop.bat
```

## Service URLs

Once started, access the services at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs (Swagger UI)
- **Alternative API Docs**: http://localhost:8000/redoc (ReDoc)

## Prerequisites

### Frontend
- Node.js (v20 or higher)
- pnpm installed (`iwr https://get.pnpm.io/install.ps1 -useb | iex`)
- Dependencies installed (`cd frontend && pnpm install`)

### Backend
- Python 3.8+
- FastAPI and dependencies installed (`cd backend && pip install -r requirements.txt`)

## Troubleshooting

### Port Already in Use
If ports 3000 or 8000 are already in use:
1. Run the stop script to kill existing processes
2. Or manually change ports in:
   - Frontend: `frontend/vite.config.ts` (server.port)
   - Backend: Start script port parameter

### PowerShell Scripts Not Running
Enable script execution:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Backend Not Found
Make sure to set up the backend first:
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install fastapi uvicorn sqlalchemy
```
