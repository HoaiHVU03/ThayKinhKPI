# HỆ THỐNG QUẢN LÝ HỌC SINH, KÝ TÚC XÁ VÀ KPI RÈN LUYỆN NỀN NẾP
## TRƯỜNG THPT CHUYÊN HÙNG VƯƠNG — PHIÊN BẢN 1.0

![Logo THPT Chuyên Hùng Vương](frontend/public/logo.png)

Hệ thống quản lý nội bộ toàn diện phục vụ hoạt động thực tế của **Trường THPT Chuyên Hùng Vương**, bao gồm quản lý hồ sơ học sinh, 54 lớp chuyên, ký túc xá 120 phòng, điểm danh KTX, 11 chế độ sinh hoạt thời gian thực, trực ban Tòa nhà A, sổ vi phạm và đánh giá KPI rèn luyện nền nếp.

---

### I. CÔNG NGHỆ BẮT BUỘC ĐÃ TRIỂN KHAI

- **Frontend**: React 19, TypeScript, Vite, React Router v7, Tailwind CSS, Recharts, Lucide React, XLSX.
- **Backend**: PHP 8.3 thuần theo kiến trúc MVC phân lớp (Core, Router, Middleware, Controllers, Database PDO).
- **Database**: MySQL 8.4 Community Server (database: `chuyenhungvuong_kpi`).
- **Nhận diện thương hiệu**: Chuẩn nhận diện Trường THPT Chuyên Hùng Vương (Xanh Navy `#0e3a7c`, Đỏ ngọn đuốc `#d32027`, Vàng khiên `#f59e0b`).

---

### II. QUY MÔ NGHIỆP VỤ ĐÃ HOÀN TẤT & XÁC THỰC

- **Tổng số học sinh**: 1.880 học sinh (Khối 10: 595 HS, Khối 11: 595 HS, Khối 12: 690 HS).
- **Lớp chuyên**: 54 lớp chuyên thuộc 3 khối lớp.
- **Học sinh nội trú**: 699 học sinh (335 Nam, 364 Nữ).
- **Học sinh ngoại trú**: 1.181 học sinh.
- **Phòng Ký túc xá**: 120 phòng từ Tầng 2 đến Tầng 6 (56 phòng Nam, 64 phòng Nữ).
- **Giáo viên trực ban Tòa nhà A**: 37 giáo viên (Lịch trực 06h55 - 07h15 với checklist 4 bước).
- **6 Nhóm vai trò người dùng**: Ban Giám hiệu, Quản sinh KTX, Trưởng tầng KTX, Trưởng phòng KTX, Đoàn Thanh niên, 54 Giáo viên chủ nhiệm.
- **10 Mã lỗi KPI (L01 — L10)**: Điểm trừ tương ứng từ -1đ đến -20đ trên thang điểm gốc 100 điểm.
- **11 Chế độ sinh hoạt KTX**: Timeline từ 05h15 đến 22h30 kèm đồng hồ thời gian thực và cảnh báo mốc (07h15, 18h00, 22h00, 22h30).
- **Điểm danh 1 Chạm**: Nút lớn **“1 CHẠM — ĐỦ MẶT”** và tự động sinh **Báo cáo Zalo 22h15** với 1 cú nhấp sao chép.
- **Mẫu in A4 hành chính**: Định dạng chuẩn theo Nghị định 30/2020/NĐ-CP của Chính phủ.

---

### III. HƯỚNG DẪN CHẠY NHANH

#### 1. Khởi tạo Cơ sở dữ liệu

```bash
# Nạp cấu trúc bảng
mysql -u root < database/schema.sql

# Sinh dữ liệu chuẩn quy mô 1.880 học sinh & 54 lớp
php backend/database/seeder.php
```

#### 2. Chạy Backend API (PHP REST API)

```bash
php -S 127.0.0.1:8000 -t backend/public
```

#### 3. Chạy Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Truy cập hệ thống tại: `http://localhost:5177/` (hoặc cổng hiển thị trên console).

---

### IV. TÀI KHOẢN ĐĂNG NHẬP MẪU

Mật khẩu chung cho tất cả các tài khoản thử nghiệm: **`password123`**

| Vai trò | Tên đăng nhập | Chức năng |
|---|---|---|
| **Ban Giám Hiệu / Quản trị** | `admin` | Toàn quyền quản trị hệ thống |
| **Quản sinh KTX** | `quan_sinh` | Quản lý KTX, điểm danh, duyệt đơn |
| **Trưởng tầng 2 (Khu Nam)** | `truong_tang_2` | Theo dõi 24 phòng Tầng 2, gửi báo cáo Zalo 22h15 |
| **Trưởng phòng 201** | `tp_p201` | Điểm danh 1 chạm phòng 201 |
| **Đoàn trường / Chi đoàn** | `chi_doan` | Theo dõi nề nếp thi đua, trực ban |
| **GVCN 10 Toán 1** | `gvcn_10toan1` | Quản lý 35 học sinh lớp 10 Toán 1 |
| **54 Lớp khác** | `gvcn_[malop]` | Quản lý lớp chuyên tương ứng |

---

### V. TÀI LIỆU DỰ ÁN CHI TIẾT

- [Hướng dẫn cài đặt chi tiết (INSTALLATION.md)](docs/INSTALLATION.md)
- [Hướng dẫn sử dụng các phân hệ (USER_GUIDE.md)](docs/USER_GUIDE.md)
- [Báo cáo kết quả kiểm thử (TEST_REPORT.md)](docs/TEST_REPORT.md)
- [File Database Schema (schema.sql)](database/schema.sql)
