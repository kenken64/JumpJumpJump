# Stop Frontend and Backend Services
# This script will kill all Node.js and Python processes (use with caution)

Write-Host "Stopping JumpJumpJump services..." -ForegroundColor Red

# Stop Frontend (Node processes on port 3000)
Write-Host "`nStopping Frontend (Vite dev server)..." -ForegroundColor Yellow
$viteProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.MainWindowTitle -like "*Frontend*" -or 
    (Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Where-Object { $_.OwningProcess -eq $_.Id })
}

if ($viteProcesses) {
    $viteProcesses | Stop-Process -Force
    Write-Host "Frontend processes stopped." -ForegroundColor Green
} else {
    Write-Host "No Frontend processes found running on port 3000." -ForegroundColor Gray
}

# Alternative: Stop all Node processes (more aggressive)
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Found $($nodeProcesses.Count) Node.js process(es). Stopping..." -ForegroundColor Yellow
    $nodeProcesses | Stop-Process -Force
    Write-Host "All Node.js processes stopped." -ForegroundColor Green
}

# Stop Backend (Python/Uvicorn processes on port 8000)
Write-Host "`nStopping Backend (FastAPI server)..." -ForegroundColor Yellow
$pythonProcesses = Get-Process -Name "python", "pythonw" -ErrorAction SilentlyContinue | Where-Object {
    $_.MainWindowTitle -like "*Backend*" -or
    (Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Where-Object { $_.OwningProcess -eq $_.Id })
}

if ($pythonProcesses) {
    $pythonProcesses | Stop-Process -Force
    Write-Host "Backend processes stopped." -ForegroundColor Green
} else {
    Write-Host "No Backend processes found running on port 8000." -ForegroundColor Gray
}

Write-Host "`n==================================" -ForegroundColor Red
Write-Host "All Services Stopped!" -ForegroundColor Red
Write-Host "==================================" -ForegroundColor Red
Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
