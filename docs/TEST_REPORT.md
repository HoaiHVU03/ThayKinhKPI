# BÁO CÁO KẾT QUẢ KIỂM THỬ HỆ THỐNG
## TRƯỜNG THPT CHUYÊN HÙNG VƯƠNG (PHIÊN BẢN 1.0)

---

### I. MÔI TRƯỜNG VÀ THÔNG SỐ KIỂM THỬ

- **Hệ điều hành**: Windows 11
- **Runtimes**: Node.js v24.18.1, PHP 8.3.30 (Laragon), MySQL 8.4.3 Community Server
- **Frontend Server**: Vite v8.3.4 (Cổng 5177)
- **Backend API Server**: PHP built-in server (Cổng 8000) trỏ vào `backend/public`
- **Cơ sở dữ liệu**: `chuyenhungvuong_kpi` (Port 3306)

---

### II. BẢNG TỔNG HỢP KIỂM THỬ CÁC HẠNG MỤC MỤC TIÊU (SECTION III)

| Hạng mục kiểm tra | Chỉ tiêu trong Master Prompt | Kết quả thực tế trong Database | Đánh giá |
|---|---:|---:|:---:|
| **Tổng số học sinh** | 1.880 | 1.880 | **ĐẠT (100%)** |
| **Số lớp chuyên** | 54 | 54 | **ĐẠT (100%)** |
| **Khối 10** | 17 lớp, 595 học sinh | 17 lớp, 595 học sinh | **ĐẠT (100%)** |
| **Khối 11** | 17 lớp, 595 học sinh | 17 lớp, 595 học sinh | **ĐẠT (100%)** |
| **Khối 12** | 20 lớp, 690 học sinh | 20 lớp, 690 học sinh | **ĐẠT (100%)** |
| **Học sinh nội trú** | 699 | 699 | **ĐẠT (100%)** |
| **Nam nội trú** | 335 | 335 | **ĐẠT (100%)** |
| **Nữ nội trú** | 364 | 364 | **ĐẠT (100%)** |
| **Học sinh ngoại trú** | 1.181 | 1.181 | **ĐẠT (100%)** |
| **Số phòng KTX** | 120 | 120 | **ĐẠT (100%)** |
| **Phòng Nam** | 56 (Tầng 2, 3, 4) | 56 | **ĐẠT (100%)** |
| **Phòng Nữ** | 64 (Tầng 4, 5, 6) | 64 | **ĐẠT (100%)** |
| **Giáo viên trực Tòa A** | 37 | 37 | **ĐẠT (100%)** |
| **Vai trò người dùng** | 6 vai trò | 6 vai trò (67 tài khoản) | **ĐẠT (100%)** |
| **Mã lỗi KPI** | L01 — L10 | L01 — L10 | **ĐẠT (100%)** |
| **Chế độ sinh hoạt KTX** | 11 chế độ | 11 chế độ | **ĐẠT (100%)** |

---

### III. KẾT QUẢ KIỂM THỬ CÁC PHÂN HỆ NGHIỆP VỤ (SECTION XXII)

1. **Xác thực và Phân quyền (RBAC)**:
   - Đăng nhập hợp lệ bằng mật khẩu mã hóa BCrypt (`password_verify`): **ĐẠT**.
   - Phát hành và xác minh Bearer Token: **ĐẠT**.
   - Phân quyền theo vai trò (BGH, Quản sinh, Trưởng tầng, Trưởng phòng, Đoàn trường, GVCN): **ĐẠT**.
   - Giới hạn phạm vi dữ liệu (Scope): GVCN chỉ xem lớp của mình, Trưởng phòng chỉ xem phòng của mình: **ĐẠT**.

2. **Điểm danh KTX**:
   - Thao tác "1 CHẠM — ĐỦ MẶT" cho phòng P201: **ĐẠT**.
   - Ghi nhận trạng thái có mặt, vắng có phép, vắng không phép: **ĐẠT**.
   - Tự động tạo nội dung Báo cáo Zalo 22h15 với 1-click copy: **ĐẠT**.

3. **Tính điểm KPI & Kỷ luật**:
   - Trừ điểm theo đúng quy tắc L01 (-1đ) đến L10 (-20đ): **ĐẠT**.
   - Công thức `Điểm còn lại = 100 - Tổng điểm trừ`: **ĐẠT**.
   - Xếp loại chuẩn xác theo ngưỡng: Xuất sắc (90-100), Tốt (75-89), Đạt (50-74), Chưa đạt (<50): **ĐẠT**.

4. **Sơ đồ KTX 120 Phòng**:
   - Hiển thị trực quan theo tầng (Tầng 2 đến Tầng 6): **ĐẠT**.
   - Hiển thị sĩ số, giới tính, trưởng phòng, điểm nội vụ: **ĐẠT**.
   - Kiểm tra sức chứa và ngăn phân phòng sai giới tính: **ĐẠT**.

5. **Mẫu In Văn Bản Hành Chính**:
   - Thể thức chuẩn Nghị định 30/2020/NĐ-CP của Chính phủ: **ĐẠT**.
   - Trình duyệt hiển thị và in chuẩn khổ giấy A4 dọc: **ĐẠT**.
