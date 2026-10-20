# 🚀 HƯỚNG DẪN TRIỂN KHAI EDUKPI BẰNG GITHUB & ./DEPLOY TRÊN CPANEL

Hệ thống đã được tích hợp bộ công cụ tự động hóa toàn diện:
- **`deploy` & `deploy.sh`**: Script bash chạy trên cPanel Terminal để kéo code mới từ GitHub, bảo toàn file cấu hình `env.php`, phân quyền an toàn `chmod` và cập nhật website trong 3 giây.
- **`push.bat`**: Script 1-click chạy trên máy tính Windows để tự động build Frontend React/Vite, đóng gói và đẩy (push) lên GitHub.

---

## 📌 BƯỚC 1: TẠO REPOSITORY TRÊN GITHUB & ĐẨY CODE TỪ MÁY TÍNH

1. Mở trình duyệt, truy cập **[GitHub](https://github.com/)** và đăng nhập tài khoản của bạn.
2. Bấm nút **New** (Tạo Repository mới):
   * **Repository name**: ví dụ đặt là `ThayKinhKPI` hoặc `edukpi`.
   * **Public** hoặc **Private** (Tùy chọn. Nếu chọn Private, xem mục Lưu ý bên dưới).
   * **KHÔNG** tích chọn *Add a README file*, *Add .gitignore* (vì trong máy tính đã có sẵn).
   * Bấm **Create repository**.
3. Sau khi tạo xong, GitHub sẽ hiển thị đường link repository dạng:
   `https://github.com/<tai-khoan-cua-ban>/ThayKinhKPI.git`
4. Trên máy tính của bạn, mở **PowerShell** hoặc **Terminal** tại thư mục `c:\source code\ThayKinhKPI` và chạy 2 lệnh sau:
   ```bash
   git remote add origin https://github.com/<tai-khoan-cua-ban>/ThayKinhKPI.git
   git push -u origin main
   ```
   *(Thay `<tai-khoan-cua-ban>` bằng username GitHub của bạn)*

---

## 📌 BƯỚC 2: CẤU HÌNH VÀ CHẠY LẦN ĐẦU TRÊN CPANEL TERMINAL

1. Đăng nhập vào trang quản trị **cPanel** hosting của bạn (TenTen / nhà cung cấp hosting).
2. Tìm và mở mục **Terminal** (Dòng lệnh).
3. Đứng tại thư mục gốc (mặc định là `/home/d0g97w3mqxbj/`), gõ lệnh sau để tải mã nguồn về:
   ```bash
   git clone https://github.com/<tai-khoan-cua-ban>/ThayKinhKPI.git app
   ```
   *(Lệnh này sẽ tải toàn bộ mã nguồn vào thư mục `app`)*

4. Di chuyển vào thư mục `app` và chạy lệnh deploy:
   ```bash
   cd app
   ./deploy
   ```

### ⚡ Script `./deploy` sẽ tự động làm những gì?
1. Kéo mã nguồn mới nhất từ GitHub (`git pull origin main`).
2. Tự động tìm thư mục `public_html` của hosting.
3. Tự động sao lưu file kết nối CSDL `backend/config/env.php` hiện có trên server (không bao giờ bị mất hoặc ghi đè mật khẩu Database).
4. Đồng bộ toàn bộ Frontend build mới nhất, Backend API, Router `.htaccess` sang `public_html`.
5. Tự động cấu hình `env.php` chuẩn cho cPanel nếu chưa có.
6. Thiết lập chuẩn phân quyền bảo mật: thư mục `755`, tập tin `644`.
7. Thông báo kết quả và thời gian hoàn tất.

---

## 📌 BƯỚC 3: QUY TRÌNH CẬP NHẬT CODE HẰNG NGÀY (CHỈ MẤT 5 GIÂY)

Từ nay về sau, mỗi khi bạn sửa code, giao diện hay tính năng mới:

### 1. Trên máy tính của bạn:
Chỉ cần chạy file `push.bat` (hoặc mở terminal gõ `.\push.bat`):
* Hệ thống sẽ tự động build Vite Frontend.
* Tự động đồng bộ vào bản dựng production.
* Tự động `git commit` và `git push` lên GitHub.

### 2. Trên cPanel Terminal:
Bạn chỉ cần mở Terminal và gõ:
```bash
cd ~/app && ./deploy
```
Hoặc nếu muốn cập nhật cả CSDL (chạy lại file nạp dữ liệu sạch 54 lớp, 1881 học sinh):
```bash
cd ~/app && ./deploy --db
```
Website `https://edukpi.com.vn` sẽ được làm mới ngay lập tức!

---

## 🔒 LƯU Ý KHI DÙNG GITHUB PRIVATE REPOSITORY (NẾU ĐẶT REPO Ở CHẾ ĐỘ RIÊNG TƯ)

Nếu bạn đặt repository ở chế độ **Private**, khi gõ `git clone` hoặc `git pull` trên cPanel Terminal, GitHub sẽ yêu cầu mật khẩu. Bạn không dùng mật khẩu tài khoản mà dùng **Personal Access Token (PAT)**:

1. Trên GitHub: Vào **Settings** (góc trên bên phải ảnh đại diện) -> Kéo xuống chọn **Developer settings** -> **Personal access tokens** -> **Tokens (classic)**.
2. Bấm **Generate new token (classic)**:
   * **Note**: `cPanel Deployment EduKPI`
   * **Expiration**: 90 days hoặc No expiration
   * **Select scopes**: Tích chọn ô **`repo`** (Full control of private repositories).
   * Bấm **Generate token** và sao chép mã token (bắt đầu bằng `ghp_...`).
3. Trên cPanel Terminal, khi clone hoặc lưu thông tin đăng nhập:
   ```bash
   git clone https://<TOKEN_CUA_BAN>@github.com/<tai-khoan-cua-ban>/ThayKinhKPI.git app
   ```
   Như vậy cPanel sẽ tự động lưu token và mỗi lần chạy `./deploy` sẽ không bao giờ hỏi mật khẩu nữa!
