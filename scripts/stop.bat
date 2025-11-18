@echo off
REM Windows Batch Script to Stop Services
echo Stopping JumpJumpJump services...

REM Stop Node.js processes (Frontend)
echo.
echo Stopping Frontend (Node.js processes)...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel%==0 (
    echo Frontend processes stopped.
) else (
    echo No Frontend processes found.
)

REM Stop Python processes (Backend)
echo.
echo Stopping Backend (Python processes)...
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM pythonw.exe >nul 2>&1
if %errorlevel%==0 (
    echo Backend processes stopped.
) else (
    echo No Backend processes found.
)

echo.
echo ==================================
echo All Services Stopped!
echo ==================================
echo.
pause
