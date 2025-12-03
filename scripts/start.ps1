# Start Frontend and Backend Services
# Run this script from the JumpJumpJump root directory

Write-Host "Starting JumpJumpJump services..." -ForegroundColor Green

# Start Frontend and Backend Services
# Run this script from the JumpJumpJump root directory

Write-Host "Starting JumpJumpJump services..." -ForegroundColor Green

# Create .pids directory if it doesn't exist
$pidsDir = Join-Path $PSScriptRoot "..\.pids"
if (-not (Test-Path $pidsDir)) {
    New-Item -ItemType Directory -Path $pidsDir | Out-Null
}

# Start Backend
Write-Host "`nStarting Backend (FastAPI)..." -ForegroundColor Cyan
$backendPath = Join-Path $PSScriptRoot "..\backend"
if (Test-Path $backendPath) {
    $backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; `$Host.UI.RawUI.WindowTitle = 'JumpJumpJump Backend'; Write-Host 'Backend Server' -ForegroundColor Yellow; python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000" -PassThru
    $backendProcess.Id | Out-File (Join-Path $pidsDir "backend.pid")
    Write-Host "Backend started on http://localhost:8000 (PID: $($backendProcess.Id))" -ForegroundColor Green
} else {
    Write-Host "Backend directory not found. Skipping..." -ForegroundColor Yellow
}

# Wait a moment before starting frontend
Start-Sleep -Seconds 2

# Start Frontend
Write-Host "`nStarting Frontend (React + Vite)..." -ForegroundColor Cyan
$frontendPath = Join-Path $PSScriptRoot "..\frontend"
if (Test-Path $frontendPath) {
    $frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; `$Host.UI.RawUI.WindowTitle = 'JumpJumpJump Frontend'; Write-Host 'Frontend Server' -ForegroundColor Yellow; `$env:Path += ';' + `$env:LOCALAPPDATA + '\pnpm'; Write-Host 'Installing dependencies...' -ForegroundColor Cyan; pnpm install; Write-Host 'Starting dev server...' -ForegroundColor Cyan; pnpm dev" -PassThru
    $frontendProcess.Id | Out-File (Join-Path $pidsDir "frontend.pid")
    Write-Host "Frontend started on http://localhost:3000 (PID: $($frontendProcess.Id))" -ForegroundColor Green
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
