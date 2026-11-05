@echo off
title Launch TNGA Wrench Admin Portal
echo ========================================================
echo   TOYOTA INDUSTRIES ENGINE INDIA (TIEI)
echo   Launching TNGA Wrench Admin Portal (Port 3020)
echo ========================================================
echo.

echo Freeing port 3020 if occupied by previous sessions...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3020') do taskkill /f /pid %%a >nul 2>&1

start "TNGA Admin Portal (Port 3020)" cmd /k "npm run dev"

timeout /t 2 /nobreak >nul

echo.
echo ========================================================
echo   Admin Portal is running at: http://localhost:3020
echo   Default Login: admin / admin123
echo ========================================================
start http://localhost:3020
pause
