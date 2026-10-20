# HƯỚNG DẪN CÀI ĐẶT VÀ VẬN HÀNH HỆ THỐNG
## TRƯỜNG THPT CHUYÊN HÙNG VƯƠNG (PHIÊN BẢN 1.0)

---

### I. YÊU CẦU MÔI TRƯỜNG HỆ THỐNG

1. **Hệ điều hành**: Windows 10/11 hoặc máy chủ Linux (Ubuntu 22.04+).
2. **PHP**: Phiên bản PHP 8.2 trở lên (Đã tích hợp và kiểm thử trên PHP 8.3 trong Laragon).
   - Yêu cầu extension: `pdo`, `pdo_mysql`, `mbstring`, `json`, `openssl`.
3. **Cơ sở dữ liệu**: MySQL 8.0+ hoặc MariaDB 10.4+ (Đã kiểm thử trên MySQL 8.4 Community Server).
4. **Node.js**: Phiên bản 18+ hoặc 20+ LTS (kèm `npm`).

---

### II. CÁC BƯỚC KHỞI ĐỘNG VÀ VẬN HÀNH

#### Bước 1: Khởi tạo Cơ sở dữ liệu MySQL

Khởi động MySQL trên cổng `3306`. Chạy file cấu trúc và dữ liệu:

```bash
# Nhập Schema cấu trúc bảng
mysql -u root < database/schema.sql

# Khởi tạo dữ liệu mẫu chuẩn quy mô 1.880 học sinh & 54 lớp
php backend/database/seeder.php
```

#### Bước 2: Khởi động Backend API (PHP REST Server)

Từ thư mục gốc dự án:

```bash
# Chạy PHP built-in server trỏ vào thư mục backend/public
php -S 127.0.0.1:8000 -t backend/public
```

Backend API sẽ sẵn sàng phục vụ tại: `http://127.0.0.1:8000/api`

#### Bước 3: Khởi động Frontend (React + Vite)

Từ thư mục `frontend`:

```bash
cd frontend
npm install
npm run dev
```

Giao diện người dùng sẽ chạy tại: `http://localhost:5177/` (hoặc cổng hiển thị trên terminal).

---

### III. TÀI KHOẢN ĐĂNG NHẬP MẶT ĐỊNH (6 VAI TRÒ)

Mật khẩu mặc định cho toàn bộ tài khoản thử nghiệm: **`password123`**

| Vai trò | Tên đăng nhập | Chức năng chính |
|---|---|---|
| **Ban Giám Hiệu / Quản trị** | `admin` | Toàn quyền quản trị, phê duyệt KPI, chuyển niên khóa, sao lưu dữ liệu |
| **Quản sinh KTX** | `quan_sinh` | Quản lý 120 phòng, theo dõi điểm danh, duyệt đơn xin phép ra ngoài |
| **Trưởng tầng 2 (Khu Nam)** | `truong_tang_2` | Quản lý báo cáo 24 phòng tầng 2, sinh báo cáo Zalo 22h15 |
| **Trưởng phòng P201** | `tp_p201` | Điểm danh "1 Chạm — Đủ Mặt", báo cáo sĩ số phòng 201 |
| **Đoàn Trường / Chi đoàn** | `chi_doan` | Theo dõi thi đua, tổng hợp vi phạm, trực ban Tòa A |
| **GVCN Lớp 10 Toán 1** | `gvcn_10toan1` | Theo dõi nề nếp, KPI của 35 học sinh lớp 10 Toán 1 |
