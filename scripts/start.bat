@echo off
REM Windows Batch Script to Start Services
echo Starting JumpJumpJump services...

REM Start Backend
echo.
echo Starting Backend (FastAPI)...
start "Backend Server" cmd /k "cd /d %~dp0..\backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

REM Wait 2 seconds
timeout /t 2 /nobreak >nul

REM Start Frontend
echo.
echo Starting Frontend (React + Vite)...
set PATH=%PATH%;%LOCALAPPDATA%\pnpm
start "Frontend Server" cmd /k "cd /d %~dp0..\frontend && echo Installing dependencies... && pnpm install && echo Starting dev server... && pnpm dev"

echo.
echo ==================================
echo Services Started!
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo ==================================
echo.
pause
