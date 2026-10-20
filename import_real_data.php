<?php
/**
 * import_real_data.php
 * Công cụ 1-Click tự động Import toàn bộ Dữ liệu thật 100% vào Database cPanel
 * Trường THPT Chuyên Hùng Vương - Phú Thọ (Năm học 2026 - 2027)
 */

header('Content-Type: text/html; charset=UTF-8');
ini_set('display_errors', 1);
ini_set('max_execution_time', 300);
ini_set('memory_limit', '512M');
error_reporting(E_ALL);

$accessKey = $_GET['key'] ?? '';
$sqlFile = __DIR__ . '/database_chuyenhungvuong.sql';

?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Import Dữ Liệu Thật 100% — Chuyên Hùng Vương</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 900px; margin: 30px auto; padding: 20px; background: #0f172a; color: #e2e8f0; line-height: 1.6; }
        .card { background: #1e293b; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); border-left: 6px solid #3b82f6; }
        .card.ok { border-left-color: #22c55e; }
        .card.err { border-left-color: #ef4444; }
        .btn { display: inline-block; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700; border: none; cursor: pointer; font-size: 15px; }
        .btn:hover { background: #1d4ed8; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; }
        .badge-ok { background: #15803d; color: #fff; }
        .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin: 20px 0; }
        .stat-box { background: #090d16; border: 1px solid #334155; border-radius: 8px; padding: 14px; text-align: center; }
        .stat-num { font-size: 26px; font-weight: 800; color: #38bdf8; }
        .stat-label { font-size: 13px; color: #94a3b8; margin-top: 4px; }
        pre { background: #090d16; padding: 14px; border-radius: 8px; overflow-x: auto; color: #38bdf8; font-size: 13px; font-family: Consolas, monospace; }
    </style>
</head>
<body>
    <h1 style="color:#60a5fa;border-bottom:2px solid #334155;padding-bottom:14px;margin-bottom:20px;">
        🏛️ CẬP NHẬT DỮ LIỆU THẬT 100% — THPT CHUYÊN HÙNG VƯƠNG
    </h1>

<?php
if ($accessKey !== 'ThayKinhKPI2026') {
    echo '<div class="card err">';
    echo '<h2>Xác thực bảo mật</h2>';
    echo '<p>Vui lòng cung cấp khóa bảo mật để tiến hành nạp dữ liệu vào database hệ thống.</p>';
    echo '<form method="GET" action="">';
    echo '<input type="password" name="key" placeholder="Nhập mã bảo mật (ThayKinhKPI2026)" style="padding:10px 14px;border-radius:6px;border:1px solid #475569;background:#0f172a;color:#fff;width:300px;font-size:14px;margin-right:10px;">';
    echo '<button type="submit" class="btn">Mở Khóa Nạp Dữ Liệu</button>';
    echo '</form>';
    echo '</div></body></html>';
    exit;
}

if (!file_exists($sqlFile)) {
    echo '<div class="card err">';
    echo '<h2>❌ Không tìm thấy file SQL</h2>';
    echo '<p>File <code>database_chuyenhungvuong.sql</code> chưa có trong thư mục hiện tại!</p>';
    echo '</div></body></html>';
    exit;
}

// Kết nối CSDL từ cấu hình
$dbConfig = [];
if (file_exists(__DIR__ . '/backend/config/database.php')) {
    $dbConfig = require __DIR__ . '/backend/config/database.php';
}

$host = $dbConfig['host'] ?? 'localhost';
$dbName = $dbConfig['database'] ?? 'd0g97w3mqxbj_kpi';
$user = $dbConfig['username'] ?? 'd0g97w3mqxbj_kpiuser';
$pass = $dbConfig['password'] ?? 'ThayKinhKPI@2026';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbName;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::MYSQL_ATTR_LOCAL_INFILE => true
    ]);
} catch (PDOException $e) {
    try {
        $pdo = new PDO("mysql:host=127.0.0.1;dbname=$dbName;charset=utf8mb4", $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
    } catch (PDOException $e2) {
        echo '<div class="card err"><h2>❌ Kết nối MySQL thất bại:</h2><pre>' . htmlspecialchars($e2->getMessage()) . '</pre></div></body></html>';
        exit;
    }
}

// BƯỚC 1: Xóa sạch dữ liệu cũ trong database
echo '<div class="card" style="border-left-color:#38bdf8;">';
echo '<h2>🧹 BƯỚC 1: XÓA SẠCH DỮ LIỆU CŨ TRƯỚC KHI NẠP MỚI...</h2>';
$pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");

$existingTables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
$tablesToClean = [
    'student_kpi_summaries', 'violation_records', 'room_assignments',
    'dormitory_attendance_records', 'dormitory_attendance_sessions',
    'dormitory_room_reports', 'dormitory_floor_reports', 'leave_requests',
    'students', 'classes', 'teachers', 'dormitory_rooms', 'dormitory_floors',
    'kpi_rules', 'kpi_assessment_periods', 'semesters', 'academic_years',
    'user_scope_assignments', 'audit_logs', 'duty_checklist_items',
    'duty_schedules', 'regime_execution_records', 'regime_checklist_items',
    'daily_regimes', 'school_settings', 'users'
];

$cleaned = 0;
foreach ($tablesToClean as $t) {
    if (in_array($t, $existingTables)) {
        try {
            $pdo->exec("TRUNCATE TABLE `$t`");
            $cleaned++;
        } catch (PDOException $e) {
            try {
                $pdo->exec("DELETE FROM `$t`");
                $cleaned++;
            } catch (PDOException $e2) {}
        }
    }
}
echo "<p><span class='badge badge-ok'>ĐÃ DỌN SẠCH</span> Đã làm trống thành công <b>$cleaned</b> bảng dữ liệu cũ.</p>";
echo '</div>';

// BƯỚC 2: Đọc và tách các câu lệnh SQL
echo '<div class="card ok">';
echo '<h2>📥 BƯỚC 2: NẠP DỮ LIỆU THẬT 100% TỪ database_chuyenhungvuong.sql...</h2>';
echo '<p>Kích thước file SQL: <b>' . number_format(filesize($sqlFile)) . ' bytes</b></p>';

$sql = file_get_contents($sqlFile);
$pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");

// Đảm bảo cột role trong bảng users hỗ trợ đủ 5 nhóm vai trò mới
try {
    $pdo->exec("ALTER TABLE `users` MODIFY COLUMN `role` ENUM('admin', 'dorm_manager', 'homeroom_teacher', 'class_cadre', 'student', 'room_leader', 'floor_leader', 'youth_union') NOT NULL DEFAULT 'student'");
} catch (PDOException $e) {}

$statements = preg_split('/;\s*[\r\n]+/', $sql);
$executed = 0;
$errors = 0;
$errorList = [];

foreach ($statements as $stmt) {
    $stmt = trim($stmt);
    if (empty($stmt)) continue;
    $clean = trim(preg_replace('/^--.*$/m', '', $stmt));
    if (empty($clean)) continue;
    
    try {
        $pdo->exec($stmt);
        $executed++;
    } catch (PDOException $ex) {
        $errors++;
        $errorList[] = [
            'sql' => substr($clean, 0, 150),
            'err' => $ex->getMessage()
        ];
    }
}

$pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

if ($errors === 0) {
    echo "<p><span class='badge badge-ok'>HOÀN TẤT 100%</span> Đã thực thi thành công toàn bộ <b>$executed</b> khối lệnh SQL không có lỗi nào!</p>";
} else {
    echo "<p><span class='badge' style='background:#f59e0b;color:#fff;'>ĐÃ XỬ LÝ</span> Thực thi thành công <b>$executed</b> khối lệnh. Có $errors câu lệnh phát sinh lỗi:</p>";
    echo '<div style="margin-top:10px;background:#090d16;padding:12px;border-radius:8px;border:1px solid #ef4444;">';
    foreach (array_slice($errorList, 0, 10) as $err) {
        echo '<div style="margin-bottom:8px;font-size:12px;"><b style="color:#ef4444;">Lỗi:</b> <code style="color:#fca5a5;">' . htmlspecialchars($err['err']) . '</code><br><span style="color:#94a3b8;">Câu lệnh: ' . htmlspecialchars($err['sql']) . '</span></div>';
    }
    echo '</div>';
}
echo '</div>';

// Thống kê kết quả thực tế từ Database
echo '<div class="card ok">';
echo '<h2>📊 THỐNG KÊ DỮ LIỆU ĐÃ NẠP THÀNH CÔNG</h2>';

$cntClasses = $pdo->query("SELECT COUNT(*) FROM classes")->fetchColumn();
$cntTeachers = $pdo->query("SELECT COUNT(*) FROM teachers")->fetchColumn();
$cntStudents = $pdo->query("SELECT COUNT(*) FROM students")->fetchColumn();
$cntBoarding = $pdo->query("SELECT COUNT(*) FROM students WHERE is_boarding = 1")->fetchColumn();
$cntRooms = $pdo->query("SELECT COUNT(*) FROM dormitory_rooms")->fetchColumn();
$cntKpiRules = $pdo->query("SELECT COUNT(*) FROM kpi_rules")->fetchColumn();
$cntKpiSummaries = $pdo->query("SELECT COUNT(*) FROM student_kpi_summaries")->fetchColumn();
$cntViolations = $pdo->query("SELECT COUNT(*) FROM violation_records")->fetchColumn();
$cntUsers = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();

echo '<div class="stat-grid">';
echo '<div class="stat-box"><div class="stat-num">' . $cntClasses . '</div><div class="stat-label">Lớp học chính thức</div></div>';
echo '<div class="stat-box"><div class="stat-num">' . $cntTeachers . '</div><div class="stat-label">Giáo viên chủ nhiệm</div></div>';
echo '<div class="stat-box"><div class="stat-num">' . number_format($cntStudents) . '</div><div class="stat-label">Học sinh toàn trường</div></div>';
echo '<div class="stat-box"><div class="stat-num">' . $cntBoarding . '</div><div class="stat-label">Học sinh nội trú KTX</div></div>';
echo '<div class="stat-box"><div class="stat-num">' . $cntRooms . '</div><div class="stat-label">Phòng KTX Tòa A</div></div>';
echo '<div class="stat-box"><div class="stat-num">' . $cntKpiRules . '</div><div class="stat-label">Tiêu chí KPI (L01-L10, C01-C03)</div></div>';
echo '<div class="stat-box"><div class="stat-num">' . number_format($cntKpiSummaries) . '</div><div class="stat-label">Điểm rèn luyện KPI HS</div></div>';
echo '<div class="stat-box"><div class="stat-num">' . $cntViolations . '</div><div class="stat-label">Nhật ký vi phạm thật</div></div>';
echo '<div class="stat-box"><div class="stat-num">' . $cntUsers . '</div><div class="stat-label">Tài khoản người dùng</div></div>';
echo '</div>';

echo '<p style="text-align:center;margin-top:24px;">';
echo '<a href="/" class="btn" style="background:#059669;margin-right:12px;">👉 Mở Trang Chủ EduKPI</a>';
echo '<a href="/api/public/schools" class="btn" target="_blank">🔍 Kiểm tra API Schools</a>';
echo '</p>';
echo '</div>';
?>

</body>
</html>
