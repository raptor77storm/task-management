@echo off
for /f "tokens=5" %%p in ('netstat -ano ^| findstr :5267 ^| findstr LISTENING') do taskkill /PID %%p /F >nul 2>&1
for /f "tokens=*" %%p in ('tasklist /FI "IMAGENAME eq TaskManagement.API.exe" /NH ^| findstr /I "TaskManagement.API.exe"') do taskkill /IM TaskManagement.API.exe /F >nul 2>&1
echo Task Management stopped.
pause
