@echo off
title Cloudflare Tunnel - webkpi.ttytphuninh.vn
echo ===============================================================
echo   DANG CHAY CLOUDFLARE TUNNEL CHO: webkpi.ttytphuninh.vn
echo   Forwarding den Frontend Port: 5288
echo ===============================================================
.\cloudflared.exe tunnel --config cloudflared_config.yml run 38cb8465-da92-4d59-ad62-d8aff6cc9210
pause
