# Test Runner Script for Jump Jump Jump
# This script runs both frontend and backend tests

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Jump Jump Jump - Test Runner" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Get the project root directory
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

# Track overall success
$frontendSuccess = $true
$backendSuccess = $true

# Function to print colored output
function Print-Success {
    param($message)
    Write-Host "✓ $message" -ForegroundColor Green
}

function Print-Error {
    param($message)
    Write-Host "✗ $message" -ForegroundColor Red
}

function Print-Info {
    param($message)
    Write-Host "ℹ $message" -ForegroundColor Yellow
}

# Run Frontend Tests
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Running Frontend Tests..." -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

Set-Location frontend

if (-not (Test-Path "node_modules")) {
    Print-Info "Installing frontend dependencies..."
    npm install
}

try {
    npm test -- --run
    if ($LASTEXITCODE -eq 0) {
        Print-Success "Frontend tests passed!"
    } else {
        Print-Error "Frontend tests failed!"
        $frontendSuccess = $false
    }
} catch {
    Print-Error "Error running frontend tests: $_"
    $frontendSuccess = $false
}

Write-Host ""
Set-Location ..

# Run Backend Tests
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Running Backend Tests..." -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

Set-Location backend

if (-not (Test-Path "venv")) {
    Print-Info "Creating Python virtual environment..."
    python -m venv venv
}

# Activate virtual environment
Print-Info "Activating virtual environment..."
& "venv\Scripts\Activate.ps1"

# Install dependencies
Print-Info "Installing backend dependencies..."
python -m pip install -q -r requirements.txt
python -m pip install -q -r requirements-dev.txt

try {
    pytest -v
    if ($LASTEXITCODE -eq 0) {
        Print-Success "Backend tests passed!"
    } else {
        Print-Error "Backend tests failed!"
        $backendSuccess = $false
    }
} catch {
    Print-Error "Error running backend tests: $_"
    $backendSuccess = $false
}

deactivate
Set-Location ..

# Summary
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

if ($frontendSuccess -and $backendSuccess) {
    Print-Success "All tests passed! 🎉"
    exit 0
} else {
    if (-not $frontendSuccess) {
        Print-Error "Frontend tests failed"
    }
    if (-not $backendSuccess) {
        Print-Error "Backend tests failed"
    }
    exit 1
}
