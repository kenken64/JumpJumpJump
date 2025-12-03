# Stop Frontend and Backend Services
# This script will kill all Node.js and Python processes (use with caution)

Write-Host "Stopping JumpJumpJump services..." -ForegroundColor Red

$pidsDir = Join-Path $PSScriptRoot "..\.pids"

function Kill-ProcessByPidFile {
    param([string]$Name)
    $pidFile = Join-Path $pidsDir "$Name.pid"
    if (Test-Path $pidFile) {
        $procId = Get-Content $pidFile
        if ($procId) {
            $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "Killing $Name process from PID file (PID: $procId)..." -ForegroundColor Yellow
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                Remove-Item $pidFile -Force
                return $true
            } else {
                Write-Host "Process from $Name.pid (PID: $procId) not found. Cleaning up file." -ForegroundColor Gray
                Remove-Item $pidFile -Force
            }
        }
    }
    return $false
}

function Kill-ProcessByPort {
    param([int]$Port, [string]$Name)
    
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            $procId = $conn.OwningProcess
            # Skip if PID is 0 (System Idle Process) or 4 (System) - though unlikely for these ports
            if ($procId -le 4) { continue }
            
            $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "Killing $Name process on port $Port (PID: $procId, Name: $($proc.ProcessName))..." -ForegroundColor Yellow
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            }
        }
    } else {
        Write-Host "No process found listening on port $Port." -ForegroundColor Gray
    }
}

# 1. Kill by PID File (Most precise)
Kill-ProcessByPidFile -Name "frontend"
Kill-ProcessByPidFile -Name "backend"

# 2. Kill by Port (Reliable fallback)
Kill-ProcessByPort -Port 3000 -Name "Frontend"
Kill-ProcessByPort -Port 8000 -Name "Backend"

# 2. Kill by Window Title (Cleanup for the PowerShell wrappers)
Write-Host "`nCleaning up by Window Title..." -ForegroundColor Cyan

$cleanupProcs = Get-Process | Where-Object { 
    $_.MainWindowTitle -eq "JumpJumpJump Frontend" -or 
    $_.MainWindowTitle -eq "JumpJumpJump Backend" 
}

if ($cleanupProcs) {
    foreach ($proc in $cleanupProcs) {
        Write-Host "Killing window: $($proc.MainWindowTitle) (PID: $($proc.Id))..." -ForegroundColor Yellow
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
}

# 3. Verification and Aggressive Fallback
Start-Sleep -Seconds 1

# Check if port 8000 is still taken
if (Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue) {
    Write-Host "Port 8000 still in use! Attempting aggressive python kill..." -ForegroundColor Red
    Get-Process -Name "python", "pythonw" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
}

# Check if port 3000 is still taken
if (Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue) {
    Write-Host "Port 3000 still in use! Attempting aggressive node kill..." -ForegroundColor Red
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
}

# Clear game state log
$logFile = Join-Path $PSScriptRoot "..\backend\game_state.log"
if (Test-Path $logFile) {
    Clear-Content $logFile
    Write-Host "Cleared game_state.log" -ForegroundColor Green
}

Write-Host "`n==================================" -ForegroundColor Red
Write-Host "All Services Stopped!" -ForegroundColor Red
Write-Host "==================================" -ForegroundColor Red
Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
