@echo off
title Frontend Web - Port 5288
echo ===============================================================
echo   DANG CHAY FRONTEND TAI: http://localhost:5288
echo ===============================================================
cd /d "%~dp0frontend"
npm run dev
pause
