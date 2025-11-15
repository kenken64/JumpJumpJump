# Jump Jump Jump - Stop Script (Windows PowerShell)

Write-Host "🛑 Stopping Jump Jump Jump Game..." -ForegroundColor Cyan
Write-Host ""

# Stop backend
if (Test-Path ".backend.pid") {
    $backendJobId = Get-Content ".backend.pid"
    $backendJob = Get-Job -Id $backendJobId -ErrorAction SilentlyContinue

    if ($backendJob) {
        Write-Host "🛑 Stopping backend server (Job ID: $backendJobId)..." -ForegroundColor Yellow
        Stop-Job -Id $backendJobId
        Remove-Job -Id $backendJobId
        Write-Host "✅ Backend stopped" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Backend server not running" -ForegroundColor Yellow
    }
    Remove-Item ".backend.pid"
} else {
    Write-Host "⚠️  No backend PID file found" -ForegroundColor Yellow
}

Write-Host ""

# Stop frontend
if (Test-Path ".frontend.pid") {
    $frontendJobId = Get-Content ".frontend.pid"
    $frontendJob = Get-Job -Id $frontendJobId -ErrorAction SilentlyContinue

    if ($frontendJob) {
        Write-Host "🛑 Stopping frontend server (Job ID: $frontendJobId)..." -ForegroundColor Yellow
        Stop-Job -Id $frontendJobId
        Remove-Job -Id $frontendJobId
        Write-Host "✅ Frontend stopped" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Frontend server not running" -ForegroundColor Yellow
    }
    Remove-Item ".frontend.pid"
} else {
    Write-Host "⚠️  No frontend PID file found" -ForegroundColor Yellow
}

# Clean up any remaining jobs
$remainingJobs = Get-Job | Where-Object { $_.State -eq "Running" }
if ($remainingJobs) {
    Write-Host ""
    Write-Host "🧹 Cleaning up remaining jobs..." -ForegroundColor Yellow
    Get-Job | Stop-Job
    Get-Job | Remove-Job
}

Write-Host ""
Write-Host "✨ All servers stopped!" -ForegroundColor Green
