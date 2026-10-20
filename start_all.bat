@echo off
title He Thong Quan Ly KTX & KPI - THPT Chuyen Hung Vuong
echo ===============================================================
echo   KHOI DONG TOAN BO HE THONG THPT CHUYEN HUNG VUONG
echo   Ten mien Cloudflare: https://webkpi.ttytphuninh.vn
echo   Port Frontend: 5288   ^|   Port Backend API: 8299
echo   Tranh xung dot 100%% voi tat ca 11 du an khac tren may!
echo ===============================================================

cd /d "%~dp0"

echo [1/3] Khoi dong Backend PHP API tren Port 8299...
start "Backend API (Port 8299)" cmd /c "start_backend.bat"
timeout /t 2 /nobreak >nul

echo [2/3] Khoi dong Frontend Web tren Port 5288...
start "Frontend Web (Port 5288)" cmd /c "start_frontend.bat"
timeout /t 3 /nobreak >nul

echo [3/3] Khoi dong Cloudflare Tunnel (webkpi.ttytphuninh.vn)...
start "Cloudflare Tunnel (webkpi)" cmd /c "start_tunnel.bat"

echo ===============================================================
echo   DA KHOI DONG THANH CONG!
echo   Dia chi truy cap noi bo: http://localhost:5288
echo   Dia chi truy cap Internet: https://webkpi.ttytphuninh.vn
echo ===============================================================
pause
