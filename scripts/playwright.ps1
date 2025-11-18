#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Playwright Test Management Script
    
.DESCRIPTION
    Comprehensive script for installing, running, and managing Playwright E2E tests.
    
.PARAMETER Install
    Install Playwright and browser dependencies
    
.PARAMETER UI
    Run tests with interactive UI mode
    
.PARAMETER Headed
    Run tests with visible browser
    
.PARAMETER Debug
    Run tests in debug mode with breakpoints
    
.PARAMETER Report
    Show HTML test report
    
.PARAMETER Test
    Run specific test file (e.g., "menu", "campaign", "settings")
    
.PARAMETER Project
    Run tests on specific browser (chromium, firefox, webkit)
    
.PARAMETER AllBrowsers
    Run tests on all configured browsers
    
.PARAMETER CI
    Run tests in CI/CD mode with retries
    
.PARAMETER AllTests
    Run complete test suite (Vitest + Playwright + Backend)
    
.EXAMPLE
    .\playwright.ps1 -Install
.EXAMPLE
    .\playwright.ps1 -UI
.EXAMPLE
    .\playwright.ps1 -Test menu -Debug
#>

param(
    [switch]$Install,
    [switch]$UI,
    [switch]$Headed,
    [switch]$Debug,
    [switch]$Report,
    [string]$Test = "",
    [string]$Project = "",
    [switch]$AllBrowsers,
    [switch]$CI,
    [switch]$AllTests,
    [switch]$Help
)

function Write-Header { param([string]$Text); Write-Host "`n========================================" -ForegroundColor Cyan; Write-Host "  $Text" -ForegroundColor Cyan; Write-Host "========================================`n" -ForegroundColor Cyan }
function Write-Success { param([string]$Text); Write-Host "[OK] $Text" -ForegroundColor Green }
function Write-Fail { param([string]$Text); Write-Host "[FAIL] $Text" -ForegroundColor Red }
function Write-Info { param([string]$Text); Write-Host "$Text" -ForegroundColor Yellow }

if ($Help) { Get-Help $MyInvocation.MyCommand.Path -Detailed; exit 0 }

# INSTALLATION MODE
if ($Install) {
    Write-Header "Playwright Installation"
    
    Write-Info "Checking Node.js..."
    try {
        $nodeVer = node --version
        Write-Success "Node.js $nodeVer"
    } catch {
        Write-Fail "Node.js not found! Install from https://nodejs.org/"
        exit 1
    }
    
    Write-Info "Installing @playwright/test..."
    npm install -D @playwright/test
    if ($LASTEXITCODE -eq 0) { Write-Success "Package installed" } else { Write-Fail "Package install failed"; exit 1 }
    
    Write-Info "Installing browsers..."
    npx playwright install
    if ($LASTEXITCODE -eq 0) { Write-Success "Browsers installed" } else { Write-Fail "Browser install failed"; exit 1 }
    
    Write-Info "Installing browser dependencies..."
    npx playwright install-deps
    if ($LASTEXITCODE -eq 0) { Write-Success "Dependencies installed" } else { Write-Info "Dependencies install failed (normal on Windows)" }
    
    Write-Header "Installation Complete!"
    Write-Host "Run: .\playwright.ps1" -ForegroundColor White
    Write-Host "UI:  .\playwright.ps1 -UI" -ForegroundColor White
    exit 0
}

# REPORT MODE
if ($Report) {
    Write-Info "Opening test report..."
    npx playwright show-report
    exit 0
}

# ALL TESTS MODE
if ($AllTests) {
    Write-Header "Complete Test Suite"
    $start = Get-Date
    $pass = $true
    
    # Vitest
    Write-Info "Running Vitest..."
    if (Test-Path "../frontend") {
        Push-Location ../frontend
        npm test -- --run 2>&1 | Out-Null
        $vitestOk = ($LASTEXITCODE -eq 0)
        Pop-Location
        if ($vitestOk) { Write-Success "Vitest passed" } else { Write-Fail "Vitest failed"; $pass = $false }
    }
    
    # Playwright
    Write-Info "Running Playwright..."
    npx playwright test 2>&1 | Out-Null
    $pwOk = ($LASTEXITCODE -eq 0)
    if ($pwOk) { Write-Success "Playwright passed" } else { Write-Fail "Playwright failed"; $pass = $false }
    
    # Pytest
    Write-Info "Running pytest..."
    if (Test-Path "../backend/test_api.py") {
        Push-Location ../backend
        if (Test-Path "venv/Scripts/Activate.ps1") { & venv/Scripts/Activate.ps1 }
        python -m pytest 2>&1 | Out-Null
        $pytestOk = ($LASTEXITCODE -eq 0)
        Pop-Location
        if ($pytestOk) { Write-Success "Pytest passed" } else { Write-Fail "Pytest failed"; $pass = $false }
    }
    
    $dur = ((Get-Date) - $start).TotalSeconds
    Write-Host "`nDuration: $([math]::Round($dur, 2))s" -ForegroundColor White
    
    if ($pass) { Write-Header "ALL TESTS PASSED"; exit 0 } else { Write-Header "SOME TESTS FAILED"; exit 1 }
}

# Check Playwright installed
Write-Info "Checking Playwright..."
try {
    $pwVer = npx playwright --version
    Write-Success "Playwright installed: $pwVer"
} catch {
    Write-Fail "Playwright not installed! Run: .\playwright.ps1 -Install"
    exit 1
}

# CI MODE
if ($CI) {
    Write-Header "CI Test Runner"
    $env:CI = "true"
    
    $cmd = "npx playwright test"
    if ($AllBrowsers) { Write-Info "Testing all browsers" }
    elseif ($Project) { $cmd += " --project=$Project"; Write-Info "Testing $Project" }
    else { $cmd += " --project=chromium"; Write-Info "Testing chromium" }
    
    $cmd += " --reporter=list,html --retries=2 --workers=1"
    Invoke-Expression $cmd
    exit $LASTEXITCODE
}

# STANDARD TEST MODE
Write-Header "Playwright Test Runner"

$cmd = "npx playwright test"

if ($Test) {
    $testFile = "tests/e2e/$Test.spec.ts"
    if (Test-Path $testFile) {
        $cmd += " $testFile"
        Write-Info "Running: $testFile"
    } else {
        Write-Fail "Test not found: $testFile"
        Write-Info "Available tests:"
        Get-ChildItem "tests/e2e" -Filter "*.spec.ts" | ForEach-Object { Write-Host "  - $($_.BaseName)" }
        exit 1
    }
}

if ($AllBrowsers) { Write-Info "Mode: All browsers" }
elseif ($Project) { $cmd += " --project=$Project"; Write-Info "Browser: $Project" }

if ($UI) { $cmd += " --ui"; Write-Info "Mode: Interactive UI" }
elseif ($Debug) { $cmd += " --debug"; Write-Info "Mode: Debug" }
elseif ($Headed) { $cmd += " --headed"; Write-Info "Mode: Headed" }
else { Write-Info "Mode: Headless" }

Write-Host ""
Invoke-Expression $cmd

if ($LASTEXITCODE -eq 0) { Write-Header "TESTS PASSED" } else { Write-Header "TESTS FAILED"; Write-Info "View report: .\playwright.ps1 -Report" }
exit $LASTEXITCODE
