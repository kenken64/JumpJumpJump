# Start Frontend and Backend Services
# Run this script from the JumpJumpJump root directory

Write-Host "Starting JumpJumpJump services..." -ForegroundColor Green

# Start Backend
Write-Host "`nStarting Backend (FastAPI)..." -ForegroundColor Cyan
$backendPath = Join-Path $PSScriptRoot "..\backend"
if (Test-Path $backendPath) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Backend Server' -ForegroundColor Yellow; python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
    Write-Host "Backend started on http://localhost:8000" -ForegroundColor Green
} else {
    Write-Host "Backend directory not found. Skipping..." -ForegroundColor Yellow
}

# Wait a moment before starting frontend
Start-Sleep -Seconds 2

# Start Frontend
Write-Host "`nStarting Frontend (React + Vite)..." -ForegroundColor Cyan
$frontendPath = Join-Path $PSScriptRoot "..\frontend"
if (Test-Path $frontendPath) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host 'Frontend Server' -ForegroundColor Yellow; `$env:Path += ';' + `$env:LOCALAPPDATA + '\pnpm'; pnpm dev"
    Write-Host "Frontend started on http://localhost:3000" -ForegroundColor Green
} else {
    Write-Host "Frontend directory not found!" -ForegroundColor Red
}

Write-Host "`n==================================" -ForegroundColor Green
Write-Host "Services Started!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Green
Write-Host "`nPress any key to exit this window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
