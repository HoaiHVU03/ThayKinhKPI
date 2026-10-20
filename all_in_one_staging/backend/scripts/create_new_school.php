<?php
// backend/scripts/create_new_school.php
// Công cụ tự động tạo Database trắng tinh và khởi tạo tài khoản Admin cho trường học mới
// Cách dùng:
// php backend/scripts/create_new_school.php --code=phuninh --name="Trường THPT Phù Ninh" --province="Phú Thọ" --admin-pass=phuninh123

$options = getopt('', [
    'code:',
    'name:',
    'province:',
    'admin-user:',
    'admin-pass:',
    'db-host:',
    'db-port:',
    'db-user:',
    'db-pass:'
]);

$schoolCode = preg_replace('/[^a-zA-Z0-9_]/', '', strtolower($options['code'] ?? ''));
if (!$schoolCode) {
    echo "========================================================================\n";
    echo "  CÔNG CỤ KHỞI TẠO CƠ SỞ DỮ LIỆU TRƯỜNG HỌC MỚI (MULTI-TENANT ISOLATED)\n";
    echo "========================================================================\n\n";
    echo "LỖI: Thiếu tham số --code (Mã định danh viết liền không dấu, ví dụ: phuninh, viettri, lamthao)\n\n";
    echo "Cú pháp mẫu:\n";
    echo "  php backend/scripts/create_new_school.php \\\n";
    echo "      --code=phuninh \\\n";
    echo "      --name=\"Trường THPT Phù Ninh\" \\\n";
    echo "      --province=\"Phú Thọ\" \\\n";
    echo "      --admin-user=admin \\\n";
    echo "      --admin-pass=phuninh@2026\n\n";
    exit(1);
}

$schoolName = $options['name'] ?? ('Trường THPT ' . ucfirst($schoolCode));
$schoolProvince = $options['province'] ?? 'Phú Thọ';
$adminUser = $options['admin-user'] ?? 'admin';
$adminPass = $options['admin-pass'] ?? 'password123';

$dbHost = $options['db-host'] ?? '127.0.0.1';
$dbPort = $options['db-port'] ?? '3306';
$dbUser = $options['db-user'] ?? 'root';
$dbPass = $options['db-pass'] ?? '';

$dbName = 'kpi_' . $schoolCode;

echo "========================================================================\n";
echo "  KHỞI TẠO HỆ THỐNG TRƯỜNG MỚI (CÔ LẬP DỮ LIỆU TUYỆT ĐỐI)\n";
echo "========================================================================\n";
echo "• Mã trường:        $schoolCode\n";
echo "• Tên trường:       $schoolName\n";
echo "• Tỉnh/Thành:       $schoolProvince\n";
echo "• Tên Database mới: $dbName\n";
echo "• Tài khoản Admin:  $adminUser / $adminPass\n";
echo "------------------------------------------------------------------------\n";

try {
    // 1. Kết nối MySQL Server để tạo database riêng biệt
    $pdo = new PDO("mysql:host=$dbHost;port=$dbPort;charset=utf8mb4", $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    echo "1. Đang tạo cơ sở dữ liệu riêng: `$dbName`...\n";
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
    $pdo->exec("USE `$dbName`;");

    // 2. Nạp cấu trúc bảng sạch (Schema)
    echo "2. Đang tạo cấu trúc bảng sạch (Schema)...\n";
    $schemaPath = __DIR__ . '/../../database/clean_schema.sql';
    if (!file_exists($schemaPath)) {
        throw new Exception("Không tìm thấy file schema tại: $schemaPath");
    }

    $sqlContent = file_get_contents($schemaPath);
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
    $queries = explode(';', $sqlContent);
    foreach ($queries as $q) {
        $lines = explode("\n", $q);
        $cleanLines = [];
        foreach ($lines as $line) {
            $trimmed = trim($line);
            if ($trimmed && strpos($trimmed, '--') !== 0) {
                $cleanLines[] = $line;
            }
        }
        $cleanSql = trim(implode("\n", $cleanLines));
        if ($cleanSql) {
            $pdo->exec($cleanSql);
        }
    }
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

    // 3. Khởi tạo năm học và kỳ đánh giá mặc định
    echo "3. Đang khởi tạo niên khóa và học kỳ...\n";
    $pdo->exec("
        INSERT INTO academic_years (id, code, name, is_current, start_date, end_date)
        VALUES (1, '2026-2027', 'Năm học 2026 - 2027', 1, '2026-09-01', '2027-05-31')
        ON DUPLICATE KEY UPDATE is_current = 1;
    ");
    $pdo->exec("
        INSERT INTO semesters (id, academic_year_id, name, is_current)
        VALUES (1, 1, 'Học kỳ 1 (2026-2027)', 1), (2, 1, 'Học kỳ 2 (2026-2027)', 0)
        ON DUPLICATE KEY UPDATE is_current = VALUES(is_current);
    ");
    $pdo->exec("
        INSERT INTO kpi_assessment_periods (id, code, name, academic_year_id, start_date, end_date, is_locked)
        VALUES (1, 'HK1-2026', 'Học kỳ 1 Năm học 2026-2027', 1, '2026-09-01', '2027-01-15', 0)
        ON DUPLICATE KEY UPDATE code = VALUES(code);
    ");

    // 4. Khởi tạo 10 mã lỗi quy chế nề nếp chuẩn (L01 -> L10)
    echo "4. Đang cài đặt khung quy chế 10 mã lỗi nề nếp chuẩn (L01 - L10)...\n";
    $defaultRules = [
        ['L01', 'Đi học muộn sau 07h00', 1, 'Đến lớp sau hiệu lệnh trống/chuông 07h00 sáng', 'nề_nếp_học_đường'],
        ['L02', 'Sai đồng phục hoặc không đeo thẻ', 3, 'Không mặc đúng đồng phục quy định hoặc quên thẻ học sinh', 'nề_nếp_học_đường'],
        ['L03', 'Để xe sai vị trí quy định', 3, 'Xếp xe lộn xộn, không đúng khu vực phân công nhà xe', 'nề_nếp_học_đường'],
        ['L04', 'Ăn quà vặt trong lớp học', 3, 'Mang đồ ăn, thức uống ngoài nước lọc vào lớp, xả rác', 'nề_nếp_học_đường'],
        ['L05', 'Sử dụng điện thoại trái phép', 5, 'Dùng điện thoại ngoài mục đích học tập trong giờ học hoặc truy bài', 'nề_nếp_học_đường'],
        ['L06', 'Không tắt thiết bị khi được yêu cầu', 5, 'Không tắt quạt, điện, máy chiếu khi ra khỏi phòng học', 'nề_nếp_học_đường'],
        ['L07', 'Vi phạm nền nếp nội vụ KTX', 3, 'Gấp chăn màn cẩu thả, phòng bừa bộn, không vệ sinh KTX', 'kỷ_luật_ktx'],
        ['L08', 'Mất trật tự, vi phạm văn hóa ứng xử', 3, 'Gây ồn ào giờ tự học tối, nói tục, cư xử thiếu văn hóa', 'nề_nếp_học_đường'],
        ['L09', 'Gian lận thi cử hoặc lạm dụng AI', 10, 'Quay cóp bài kiểm tra, copy văn mẫu AI nộp bài trái phép', 'học_tập'],
        ['L10', 'Hành vi đặc biệt nghiêm trọng', 20, 'Đánh nhau, phá hoại tài sản công, vi phạm pháp luật quy chế', 'đặc_biệt']
    ];
    $stmtRule = $pdo->prepare("INSERT INTO kpi_rules (code, name, deduction_points, description, category) VALUES (?, ?, ?, ?, ?)");
    foreach ($defaultRules as $r) {
        $stmtRule->execute($r);
    }

    // 5. Khởi tạo 11 chế độ sinh hoạt KTX chuẩn
    echo "5. Đang cài đặt 11 chế độ sinh hoạt KTX chuẩn...\n";
    $defaultRegimes = [
        [1, '05:30', '06:00', 'Báo thức & Thể dục sáng', 'Hiệu lệnh chuông báo thức toàn KTX, mở nhạc thể dục sáng', 'Quản sinh ca sáng'],
        [2, '06:00', '06:30', 'Vệ sinh cá nhân & Nội vụ phòng', 'Gấp chăn màn vuông vức, vệ sinh phòng sạch sẽ', 'Trưởng phòng & Quản sinh'],
        [3, '06:30', '07:00', 'Ăn sáng & Chuẩn bị lên lớp', 'Ăn sáng tại nhà ăn trường, mặc đồng phục, đeo thẻ học sinh', 'Tự giác'],
        [4, '07:00', '11:30', 'Học chính khóa buổi sáng', 'Toàn bộ học sinh có mặt tại phòng học, đóng cửa phòng KTX', 'GVCN & Trực ban'],
        [5, '11:30', '12:30', 'Ăn trưa KTX', 'Nhận suất ăn theo khay, trật tự, xếp hàng', 'Nhà ăn & Quản sinh'],
        [6, '12:30', '13:30', 'Nghỉ trưa KTX (Bắt buộc)', 'Tắt điện, không nói chuyện, nghỉ ngơi tại giường', 'Trưởng tầng & Quản sinh'],
        [7, '13:30', '17:00', 'Học chính khóa / Chuyên đề chiều', 'Học tập tại khu giảng đường hoặc thư viện', 'GVCN'],
        [8, '17:00', '18:30', 'Thể thao & Vệ sinh cá nhân chiều', 'Hoạt động thể dục thể thao sân trường, tắm giặt', 'Đoàn Thanh niên'],
        [9, '18:30', '19:30', 'Ăn tối KTX', 'Ăn tối đúng giờ quy định', 'Nhà ăn'],
        [10, '19:30', '21:30', 'Tự học tối (Bắt buộc)', 'Học tại phòng học hoặc phòng tự học KTX, giữ im lặng tuyệt đối', 'Quản sinh & Trưởng tầng'],
        [11, '21:30', '22:00', 'Điểm danh tối & Tắt đèn đi ngủ', 'Điểm danh quân số 22h00, báo cáo Zalo, ngắt điện phòng ngủ', 'Quản sinh & Trực ban']
    ];
    $stmtReg = $pdo->prepare("INSERT INTO daily_regimes (order_num, time_start, time_end, name, description, responsible_role) VALUES (?, ?, ?, ?, ?, ?)");
    foreach ($defaultRegimes as $reg) {
        $stmtReg->execute($reg);
    }

    // 6. Cài đặt thông tin nhận diện trường học (School Settings)
    echo "6. Đang cấu hình nhận diện trường học mới...\n";
    $settings = [
        'school_name' => $schoolName,
        'school_province' => $schoolProvince,
        'school_code' => strtoupper($schoolCode),
        'school_address' => "Địa chỉ $schoolName",
        'school_phone' => 'Đang cập nhật',
        'school_email' => "banbientap@$schoolCode.edu.vn",
        'school_website' => "https://$schoolCode.edu.vn",
        'school_logo' => '/logo.png',
        'principal_name' => 'Hiệu trưởng',
        'dorm_manager_name' => 'Trưởng ban Quản sinh',
        'brand_primary_color' => '#0e3a7c',
        'brand_accent_color' => '#d32027',
        'brand_gold_color' => '#f59e0b',
        'academic_year_current' => '2026-2027',
        'morning_attendance_time' => '06:00',
        'evening_attendance_time' => '22:00',
        'zalo_report_time' => '22:15'
    ];
    $stmtSet = $pdo->prepare("INSERT INTO school_settings (setting_key, setting_value, description) VALUES (?, ?, 'Cấu hình hệ thống')");
    foreach ($settings as $k => $v) {
        $stmtSet->execute([$k, $v]);
    }

    // 7. Tạo DUY NHẤT tài khoản Quản trị viên (Super Admin)
    echo "7. Đang tạo tài khoản Quản trị tối cao (Admin)...\n";
    $passHash = password_hash($adminPass, PASSWORD_BCRYPT);
    $stmtAdmin = $pdo->prepare("
        INSERT INTO users (username, password_hash, full_name, email, role, status)
        VALUES (?, ?, ?, ?, 'admin', 'active')
    ");
    $stmtAdmin->execute([
        $adminUser,
        $passHash,
        "Ban Giám Hiệu — $schoolName",
        "admin@$schoolCode.edu.vn"
    ]);

    // Audit log
    $pdo->prepare("INSERT INTO audit_logs (user_id, action, entity_type, details) VALUES (1, 'PROVISION_SCHOOL', 'system', 'Khởi tạo thành công trường học mới hoàn toàn trắng tinh')")
        ->execute();

    echo "\n========================================================================\n";
    echo "  KHỞI TẠO THÀNH CÔNG 100% CƠ SỞ DỮ LIỆU CHO: $schoolName\n";
    echo "========================================================================\n";
    echo "• Database name:      $dbName (Cách ly 100%, không dính dữ liệu trường khác)\n";
    echo "• Trạng thái dữ liệu: TRẮNG TINH (0 học sinh, 0 lớp học, 0 phòng KTX, 0 vi phạm)\n";
    echo "• Khung chuẩn sẵn:    10 mã lỗi L01-L10, 11 chế độ KTX, Niên khóa 2026-2027\n";
    echo "• Tài khoản đăng nhập:\n";
    echo "    - Tên đăng nhập:  $adminUser\n";
    echo "    - Mật khẩu:       $adminPass\n";
    echo "    - Quyền hạn:      Toàn quyền Quản trị (Admin)\n";
    echo "------------------------------------------------------------------------\n";
    echo "Bước tiếp theo cho trường mới:\n";
    echo "1. Đăng nhập vào trang Quản trị (/admin)\n";
    echo "2. Vào tab \"Khởi tạo trường mới & Dữ liệu mẫu\"\n";
    echo "3. Bấm tải \"File mẫu trắng (Sẵn sàng điền trường mới)\"\n";
    echo "4. Nhập danh sách lớp, học sinh, KTX vào file rồi kéo thả vào mục \"Nạp dữ liệu trường mới (Master Import Wizard)\"\n";
    echo "=> Hệ thống sẽ tự động cập nhật toàn bộ trường học trong 5 giây!\n";
    echo "========================================================================\n";

} catch (Exception $e) {
    echo "\n[THẤT BẠI] Lỗi: " . $e->getMessage() . "\n";
    exit(1);
}
