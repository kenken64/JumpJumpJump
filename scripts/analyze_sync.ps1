Write-Host "Running Sync Analysis..." -ForegroundColor Cyan

# Get the path to the python script relative to this script
$backendPath = Join-Path $PSScriptRoot "..\backend"
$scriptPath = Join-Path $backendPath "analyze_sync.py"
$logPath = Join-Path $backendPath "game_state.log"

if (Test-Path $scriptPath) {
    # Check if log file exists
    if (-not (Test-Path $logPath)) {
        Write-Host "Warning: game_state.log not found in backend directory." -ForegroundColor Yellow
    }
    
    # Run the python script
    # We change directory to backend so the script can find the log file easily if it uses relative paths
    Push-Location $backendPath
    try {
        python analyze_sync.py $args
    } finally {
        Pop-Location
    }
} else {
    Write-Host "Error: analyze_sync.py not found at $scriptPath" -ForegroundColor Red
}

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
