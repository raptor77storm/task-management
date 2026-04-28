@echo off
REM Task Management UI - Offline Desktop App Launcher
REM This script launches the app locally with zero backend dependencies

title Task Management UI - Offline
cls
echo.
echo ================================
echo   Task Management UI
echo   Offline Mode
echo ================================
echo.
echo Starting application...
echo.

REM Navigate to the app directory
cd /d "%~dp0"

REM Start the app on port 3000
echo.
echo Starting server on http://localhost:3000
echo.
echo The app should open automatically in your default browser.
echo If it doesn't, visit: http://localhost:3000
echo.
echo Press Ctrl+C to stop the app.
echo.
timeout /t 2 /nobreak

REM Use npx serve which doesn't require global installation
call npx serve -s build -l 3000

pause
npx serve -s build -l 3000

pause
