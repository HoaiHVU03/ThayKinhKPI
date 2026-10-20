@echo off
title Backend API - Port 8299
echo ===============================================================
echo   DANG CHAY PHP BACKEND API TAI: http://127.0.0.1:8299
echo ===============================================================
cd /d "%~dp0"
"C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe" -S 127.0.0.1:8299 -t "backend\public"
pause
