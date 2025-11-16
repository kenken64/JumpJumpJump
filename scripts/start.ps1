# Jump Jump Jump - Start Script (Windows PowerShell)

Write-Host "Starting Jump Jump Jump Game..." -ForegroundColor Cyan
Write-Host ""

# Get the project root directory (parent of scripts folder)
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

# Check if backend virtual environment exists
if (-not (Test-Path "backend\venv")) {
    Write-Host "Setting up backend virtual environment..." -ForegroundColor Yellow
    Set-Location backend
    python -m venv venv
    .\venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    Set-Location ..
    Write-Host "Backend setup complete!" -ForegroundColor Green
    Write-Host ""
}

# Start backend server
Write-Host "Starting backend server..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location backend
    .\venv\Scripts\Activate.ps1
    python main.py
}
Start-Sleep -Seconds 2
Write-Host "Backend running on http://localhost:8000 (Job ID: $($backendJob.Id))" -ForegroundColor Green
Write-Host ""

# Start frontend
Write-Host "Starting frontend..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location frontend
    npm run dev
}
Start-Sleep -Seconds 2
Write-Host "Frontend running on http://localhost:5173 (Job ID: $($frontendJob.Id))" -ForegroundColor Green
Write-Host ""

# Save job IDs to file for stop script
$backendJob.Id | Out-File -FilePath ".backend.pid" -Encoding utf8
$frontendJob.Id | Out-File -FilePath ".frontend.pid" -Encoding utf8

Write-Host "Game is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend API: http://localhost:8000" -ForegroundColor White
Write-Host "Game URL: http://localhost:5173" -ForegroundColor White
Write-Host "Leaderboard: http://localhost:8000/api/scores/leaderboard" -ForegroundColor White
Write-Host ""
Write-Host "To stop the servers, run: .\scripts\stop.ps1" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Yellow

# Keep script running and show job output
try {
    while ($true) {
        Start-Sleep -Seconds 1

        # Check if jobs are still running
        $backendRunning = Get-Job -Id $backendJob.Id -ErrorAction SilentlyContinue
        $frontendRunning = Get-Job -Id $frontendJob.Id -ErrorAction SilentlyContinue

        if (-not $backendRunning -or -not $frontendRunning) {
            Write-Host "One or more servers stopped unexpectedly" -ForegroundColor Red
            break
        }
    }
}
finally {
    Write-Host ""
    Write-Host "Cleaning up..." -ForegroundColor Yellow
    Get-Job | Stop-Job
    Get-Job | Remove-Job
    if (Test-Path ".backend.pid") { Remove-Item ".backend.pid" }
    if (Test-Path ".frontend.pid") { Remove-Item ".frontend.pid" }
}
