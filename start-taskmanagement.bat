@echo off
setlocal
taskkill /IM TaskManagement.API.exe /F >nul 2>nul
cd /d "%~dp0app"
set ASPNETCORE_URLS=http://0.0.0.0:5267
start "Task Management" "%~dp0app\TaskManagement.API.exe"
timeout /t 5 /nobreak >nul
start "" "http://localhost:5267/?v=%RANDOM%"
endlocal
