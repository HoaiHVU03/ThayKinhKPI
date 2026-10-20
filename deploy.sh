#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DEPLOY TỰ ĐỘNG CHO EDUKPI (THẦY KÍNH KPI) TRÊN CPANEL TERMINAL
# Cách dùng: 
#   ./deploy             (Cập nhật web từ GitHub sang public_html)
#   ./deploy --db        (Cập nhật web + chạy nạp lại CSDL thật)
# ==============================================================================

set -e

# Màu sắc hiển thị terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${PURPLE}======================================================================${NC}"
echo -e "${PURPLE}   🚀 EDUKPI.COM.VN — CPANEL DEPLOYMENT AUTOMATION                   ${NC}"
echo -e "${PURPLE}======================================================================${NC}"

# 1. Định vị thư mục script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${BLUE}[1/5] Thư mục mã nguồn:${NC} $SCRIPT_DIR"

# 2. Pull code mới nhất từ GitHub
if [ -d ".git" ]; then
    echo -e "${BLUE}[2/5] Đang kéo mã nguồn mới nhất từ GitHub (git pull)...${NC}"
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
    git fetch origin "$CURRENT_BRANCH" 2>/dev/null || true
    git pull origin "$CURRENT_BRANCH" || {
        echo -e "${YELLOW}[Cảnh báo] git pull gặp sự cố (có thể do xung đột hoặc chưa cấu hình remote). Tiếp tục triển khai từ mã nguồn hiện có...${NC}"
    }
else
    echo -e "${YELLOW}[2/5] Không phát hiện thư mục .git tại đây, bỏ qua git pull.${NC}"
fi

# 3. Xác định thư mục đích public_html trên cPanel
TARGET_DIR=""

if [ -d "$HOME/public_html" ]; then
    TARGET_DIR="$HOME/public_html"
elif [ -d "../public_html" ]; then
    TARGET_DIR="$(cd ../public_html && pwd)"
elif [ -f "$SCRIPT_DIR/api.php" ] && [ -f "$SCRIPT_DIR/index.html" ]; then
    # Đang chạy trực tiếp ngay trong public_html
    TARGET_DIR="$SCRIPT_DIR"
elif [ -d "/home/$(whoami)/public_html" ]; then
    TARGET_DIR="/home/$(whoami)/public_html"
fi

if [ -z "$TARGET_DIR" ]; then
    echo -e "${RED}[Lỗi] Không tìm thấy thư mục public_html trên cPanel!${NC}"
    echo -e "Vui lòng kiểm tra lại cấu trúc hosting của bạn."
    exit 1
fi

echo -e "${BLUE}[3/5] Thư mục triển khai web (Web Root):${NC} $TARGET_DIR"

# 4. Xác định thư mục nguồn chứa các file production (all_in_one_staging hoặc chính thư mục này)
SOURCE_DIR=""
if [ -d "$SCRIPT_DIR/all_in_one_staging" ]; then
    SOURCE_DIR="$SCRIPT_DIR/all_in_one_staging"
elif [ -d "$SCRIPT_DIR/backend" ] && [ -f "$SCRIPT_DIR/index.html" ]; then
    SOURCE_DIR="$SCRIPT_DIR"
fi

# 5. Đồng bộ các file sang public_html
if [ "$SOURCE_DIR" != "$TARGET_DIR" ] && [ -n "$SOURCE_DIR" ]; then
    echo -e "${BLUE}[4/5] Đang đồng bộ các file sang $TARGET_DIR...${NC}"

    # Bảo tồn file cấu hình env.php hiện có trên cPanel (tránh bị ghi đè mất pass database)
    if [ -f "$TARGET_DIR/backend/config/env.php" ]; then
        echo -e "${CYAN}   -> Đang sao lưu cấu hình database hiện tại (env.php)...${NC}"
        cp "$TARGET_DIR/backend/config/env.php" /tmp/edukpi_env_backup.php 2>/dev/null || true
    fi

    # Tạo thư mục đích nếu chưa có
    mkdir -p "$TARGET_DIR"

    # Sao chép toàn bộ file và thư mục
    cp -r "$SOURCE_DIR"/* "$TARGET_DIR"/
    # Sao chép các file ẩn như .htaccess
    cp -r "$SOURCE_DIR"/.[!.]* "$TARGET_DIR"/ 2>/dev/null || true

    # Khôi phục file env.php đã bảo tồn
    if [ -f /tmp/edukpi_env_backup.php ]; then
        mkdir -p "$TARGET_DIR/backend/config"
        cp /tmp/edukpi_env_backup.php "$TARGET_DIR/backend/config/env.php"
        rm -f /tmp/edukpi_env_backup.php
        echo -e "${GREEN}   -> Đã khôi phục file cấu hình database an toàn!${NC}"
    fi
else
    echo -e "${BLUE}[4/5] Đang triển khai tại chỗ trong $TARGET_DIR...${NC}"
fi

# 6. Đảm bảo file cấu hình env.php tồn tại (nếu là lần đầu deploy)
CONFIG_FILE="$TARGET_DIR/backend/config/env.php"
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${YELLOW}   -> Tạo file cấu hình CSDL chuẩn cPanel (lần đầu cài đặt)...${NC}"
    mkdir -p "$TARGET_DIR/backend/config"
    cat << 'EOF' > "$CONFIG_FILE"
<?php
// Cấu hình Database cPanel - EduKPI Chuyên Hùng Vương
return [
    'DB_HOST' => 'localhost',
    'DB_PORT' => '3306',
    'DB_NAME' => 'd0g97w3mqxbj_kpi',
    'DB_USER' => 'd0g97w3mqxbj_kpiuser',
    'DB_PASS' => 'ThayKinhKPI@2026',
    'JWT_SECRET' => 'ThayKinhKPI_JWT_Secret_Key_Production_2026_ChuyenHungVuong',
    'ENVIRONMENT' => 'production'
];
EOF
fi

# 7. Phân quyền tập tin an toàn (chmod)
echo -e "${BLUE}[5/5] Đang thiết lập phân quyền an toàn (chmod 755 cho thư mục, 644 cho file)...${NC}"
find "$TARGET_DIR" -type d -exec chmod 755 {} + 2>/dev/null || true
find "$TARGET_DIR" -type f -exec chmod 644 {} + 2>/dev/null || true

# Cấp quyền thực thi cho các file script deploy
chmod +x "$SCRIPT_DIR/deploy" 2>/dev/null || true
chmod +x "$SCRIPT_DIR/deploy.sh" 2>/dev/null || true

# 8. Tùy chọn nạp CSDL (nếu chạy ./deploy --db)
if [ "$1" == "--db" ] || [ "$1" == "import-db" ]; then
    echo -e "${YELLOW}⚡ Phát hiện tham số --db: Đang nạp CSDL thật qua PHP CLI...${NC}"
    if [ -f "$TARGET_DIR/import_real_data.php" ]; then
        php "$TARGET_DIR/import_real_data.php"
    else
        echo -e "${RED}[Lỗi] Không tìm thấy file import_real_data.php!${NC}"
    fi
fi

echo -e ""
echo -e "${GREEN}======================================================================${NC}"
echo -e "${GREEN}   ✅ DEPLOY HOÀN TẤT THÀNH CÔNG!                                    ${NC}"
echo -e "${GREEN}   🌐 Trang chủ: https://edukpi.com.vn                                ${NC}"
echo -e "${GREEN}   🕒 Thời gian: $(date '+%d/%m/%Y %H:%M:%S')                         ${NC}"
echo -e "${GREEN}======================================================================${NC}"
