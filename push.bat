@echo off
chcp 65001 >nul
echo ======================================================================
echo    🚀 BUILD FRONTEND & PUSH GITHUB TỰ ĐỘNG — EDUKPI
echo ======================================================================

echo [1/4] Đang build Frontend React/Vite...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo [LỖI] Build frontend thất bại! Vui lòng kiểm tra mã nguồn.
    cd ..
    pause
    exit /b %errorlevel%
)
cd ..

echo [2/4] Đang đồng bộ file build vào all_in_one_staging...
xcopy /E /I /Y frontend\dist\* all_in_one_staging\ >nul
del /Q all_in_one_staging\assets\index-Csuok3Gw.css 2>nul
del /Q all_in_one_staging\assets\index-R_20jVOr.js 2>nul
copy /Y backend\app\Controllers\ClassController.php all_in_one_staging\backend\app\Controllers\ClassController.php >nul
copy /Y backend\public\index.php all_in_one_staging\backend\public\index.php >nul

echo [3/4] Chuẩn bị Git Commit...
git add .
set /p commit_msg="Nhập nội dung commit (Nhấn Enter để dùng mặc định: 'Update website'): "
if "%commit_msg%"=="" set commit_msg=Update website
git commit -m "%commit_msg%"

echo [4/4] Đang đẩy mã nguồn lên GitHub (git push)...
git push origin main
if %errorlevel% neq 0 (
    echo [LƯU Ý] Chưa push được lên GitHub! Vui lòng kiểm tra lại cấu hình Remote hoặc mạng.
) else (
    echo ======================================================================
    echo   ✅ ĐÃ PUSH LÊN GITHUB THÀNH CÔNG!
    echo   👉 Bây giờ bạn có thể mở cPanel Terminal và gõ: ./deploy
    echo ======================================================================
)

pause
