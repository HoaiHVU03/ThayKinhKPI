<?php
// check.php - File chẩn đoán toàn diện lỗi hệ thống (Tạo trực tiếp trong public_html)
header('Content-Type: text/html; charset=UTF-8');
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo '<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>Chẩn đoán hệ thống ThayKinhKPI</title>';
echo '<style>
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 960px; margin: 30px auto; padding: 20px; background: #0f172a; color: #e2e8f0; line-height: 1.6; }
.card { background: #1e293b; border-radius: 12px; padding: 22px; margin-bottom: 22px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); border-left: 6px solid #3b82f6; }
.card.ok { border-left-color: #22c55e; }
.card.err { border-left-color: #ef4444; }
.card.warn { border-left-color: #f59e0b; }
h2 { margin-top: 0; font-size: 1.25rem; display: flex; align-items: center; gap: 8px; }
.badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; margin-right: 6px; }
.badge-ok { background: #15803d; color: #fff; }
.badge-err { background: #b91c1c; color: #fff; }
.badge-info { background: #1d4ed8; color: #fff; }
pre { background: #090d16; padding: 14px; border-radius: 8px; overflow-x: auto; color: #38bdf8; font-size: 13px; font-family: Consolas, monospace; }
code { background: #334155; padding: 2px 6px; border-radius: 4px; font-size: 13px; color: #f1f5f9; }
.item { margin: 8px 0; }
</style></head><body>';
echo '<h1 style="color:#60a5fa;border-bottom:2px solid #334155;padding-bottom:14px;margin-bottom:24px;">🛠️ BẢNG CHẨN ĐOÁN LỖI HỆ THỐNG — EDUKPI.COM.VN</h1>';

// 1. PHP Server Info
echo '<div class="card ok">';
echo '<h2>1. Môi trường PHP & Web Server</h2>';
echo '<div class="item">PHP Version: <b>' . phpversion() . '</b></div>';
echo '<div class="item">Web Server: <b>' . ($_SERVER['SERVER_SOFTWARE'] ?? 'Không rõ') . '</b></div>';
echo '<div class="item">Tên miền hiện tại (HTTP_HOST): <b>' . ($_SERVER['HTTP_HOST'] ?? 'Chưa xác định') . '</b></div>';
$pdoMysql = extension_loaded('pdo_mysql');
echo '<div class="item">Extension <code>pdo_mysql</code>: ' . ($pdoMysql ? '<span class="badge badge-ok">ĐÃ BẬT</span>' : '<span class="badge badge-err">CHƯA BẬT — Cần bật trong Select PHP Version trên cPanel!</span>') . '</div>';
echo '</div>';

// 2. Kiểm tra file hệ thống
echo '<div class="card">';
echo '<h2>2. Kiểm tra sự tồn tại của các file Backend</h2>';
$filesToCheck = [
    'backend/config/database.php' => 'Cấu hình kết nối MySQL',
    'backend/public/index.php' => 'File tiếp nhận mọi request API',
    'backend/app/Core/Router.php' => 'Bộ định tuyến Router',
    'backend/app/Core/Database.php' => 'Kết nối Database singleton',
    'backend/app/Core/Response.php' => 'Trả dữ liệu JSON',
    'backend/app/Controllers/SchoolWorkspaceController.php' => 'API Đa trường học',
    'backend/app/Controllers/AdminController.php' => 'API Quản trị & Cấu hình',
    'backend/app/Controllers/AuthController.php' => 'API Đăng nhập',
];
$missingFiles = 0;
foreach ($filesToCheck as $f => $desc) {
    $full = __DIR__ . '/' . $f;
    if (file_exists($full)) {
        echo '<div class="item">✅ <code>' . $f . '</code> <small style="color:#94a3b8">(' . $desc . ')</small></div>';
    } else {
        echo '<div class="item">❌ <b style="color:#ef4444">THIẾU FILE:</b> <code>' . $f . '</code></div>';
        $missingFiles++;
    }
}
if ($missingFiles === 0) {
    echo '<p style="color:#86efac;margin-top:10px;"><b>Tất cả file backend đều đã có đầy đủ đúng vị trí!</b></p>';
} else {
    echo '<p style="color:#fca5a5;margin-top:10px;"><b>CẢNH BÁO: Đang thiếu ' . $missingFiles . ' file! Cần giải nén lại zip vào public_html!</b></p>';
}
echo '</div>';

// 3. Đọc cấu hình database.php
echo '<div class="card">';
echo '<h2>3. Phân tích cấu hình Database từ file backend/config/database.php</h2>';
$dbConfig = null;
try {
    if (file_exists(__DIR__ . '/backend/config/database.php')) {
        $dbConfig = require __DIR__ . '/backend/config/database.php';
        echo '<div class="item">Host được chọn: <b><code>' . htmlspecialchars($dbConfig['host'] ?? 'null') . '</code></b></div>';
        echo '<div class="item">Port: <b><code>' . htmlspecialchars($dbConfig['port'] ?? 'null') . '</code></b></div>';
        echo '<div class="item">Database Name được chọn: <b><code>' . htmlspecialchars($dbConfig['database'] ?? 'null') . '</code></b> ' . 
            (($dbConfig['database'] ?? '') === 'd0g97w3mqxbj_kpi' ? '<span class="badge badge-ok">CHUẨN</span>' : '<span class="badge badge-err">SAI TÊN (Cần là d0g97w3mqxbj_kpi)</span>') . '</div>';
        echo '<div class="item">Username: <b><code>' . htmlspecialchars($dbConfig['username'] ?? 'null') . '</code></b></div>';
        echo '<div class="item">Mật khẩu: <b>' . (isset($dbConfig['password']) ? '*** (Độ dài: ' . strlen($dbConfig['password']) . ' ký tự)' : 'TRỐNG') . '</b></div>';
    } else {
        echo '<p style="color:#ef4444">Không tìm thấy file <code>backend/config/database.php</code>!</p>';
    }
} catch (Throwable $e) {
    echo '<p style="color:#ef4444">Lỗi khi đọc file <code>database.php</code>: ' . htmlspecialchars($e->getMessage()) . '</p>';
}
echo '</div>';

// 4. Test kết nối MySQL trực tiếp (PDO)
echo '<div class="card">';
echo '<h2>4. Test kết nối MySQL thực tế</h2>';

$cfgHost = $dbConfig['host'] ?? 'localhost';
$cfgDb   = $dbConfig['database'] ?? 'd0g97w3mqxbj_kpi';
$cfgUser = $dbConfig['username'] ?? 'd0g97w3mqxbj_kpiuser';
$cfgPass = $dbConfig['password'] ?? 'ThayKinhKPI@2026';

$connectedPdo = null;

// Thử kết nối lần 1
echo '<div class="item"><b>4.1. Thử kết nối với Host = <code>' . htmlspecialchars($cfgHost) . '</code>, Database = <code>' . htmlspecialchars($cfgDb) . '</code>, User = <code>' . htmlspecialchars($cfgUser) . '</code>:</b></div>';
try {
    $connectedPdo = new PDO("mysql:host=$cfgHost;dbname=$cfgDb;charset=utf8mb4", $cfgUser, $cfgPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 4
    ]);
    echo '<div style="margin:10px 0;"><span class="badge badge-ok">KẾT NỐI THÀNH CÔNG!</span> MySQL phản hồi tốt.</div>';
} catch (PDOException $e) {
    echo '<div style="margin:10px 0;"><span class="badge badge-err">KẾT NỐI THẤT BẠI</span> <b style="color:#ef4444">' . htmlspecialchars($e->getMessage()) . '</b></div>';

    // Thử chuyển đổi localhost <-> 127.0.0.1
    $altHost = ($cfgHost === 'localhost') ? '127.0.0.1' : 'localhost';
    echo '<div class="item" style="margin-top:14px;"><b>4.2. Thử chuyển Host sang <code>' . $altHost . '</code>:</b></div>';
    try {
        $connectedPdo = new PDO("mysql:host=$altHost;dbname=$cfgDb;charset=utf8mb4", $cfgUser, $cfgPass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 4
        ]);
        echo '<div style="margin:10px 0;"><span class="badge badge-ok">KẾT NỐI THÀNH CÔNG VỚI ' . $altHost . '!</span></div>';
        echo '<p style="color:#fde68a">👉 <b>GIẢI PHÁP:</b> Đổi dòng <code>host</code> trong <code>database.php</code> thành <code>' . $altHost . '</code>.</p>';
    } catch (PDOException $e2) {
        echo '<div style="margin:10px 0;"><span class="badge badge-err">THẤT BẠI CẢ 2 HOST</span> <b style="color:#ef4444">' . htmlspecialchars($e2->getMessage()) . '</b></div>';
        echo '<p style="color:#fde68a">👉 <b>LÝ DO:</b> Sai Mật khẩu MySQL hoặc MySQL User <code>' . htmlspecialchars($cfgUser) . '</code> chưa được gán quyền (Add User to Database) vào <code>' . htmlspecialchars($cfgDb) . '</code> trong mục "MySQL Databases" trên cPanel.</p>';
    }
}

// 5. Kiểm tra dữ liệu các bảng nếu đã kết nối thành công
if ($connectedPdo) {
    echo '<hr style="border:0;border-top:1px solid #334155;margin:18px 0;">';
    echo '<h3>Kiểm tra bảng và dữ liệu trong Database:</h3>';
    try {
        $tables = $connectedPdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
        echo '<div class="item">Tổng số bảng đã import: <b>' . count($tables) . ' bảng</b></div>';

        // Kiểm tra bảng school_settings
        if (in_array('school_settings', $tables)) {
            $settingsStmt = $connectedPdo->query("SELECT setting_key, setting_value FROM school_settings");
            $settings = $settingsStmt ? $settingsStmt->fetchAll(PDO::FETCH_KEY_PAIR) : [];
            echo '<div class="item">✅ Bảng <code>school_settings</code>: có <b>' . count($settings) . '</b> cấu hình.</div>';
            echo '<div class="item" style="padding-left:20px;color:#93c5fd;">Tên trường: <b>' . htmlspecialchars($settings['school_name'] ?? 'Chưa đặt') . '</b></div>';
            echo '<div class="item" style="padding-left:20px;color:#93c5fd;">Tỉnh thành: <b>' . htmlspecialchars($settings['school_province'] ?? 'Chưa đặt') . '</b></div>';
        } else {
            echo '<div class="item">❌ <b style="color:#ef4444">Chưa có bảng <code>school_settings</code>! Cần import lại file database_chuyenhungvuong.sql!</b></div>';
        }

        // Kiểm tra bảng users
        if (in_array('users', $tables)) {
            $userCount = (int)$connectedPdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
            echo '<div class="item">✅ Bảng <code>users</code>: có <b>' . $userCount . '</b> tài khoản.</div>';
            $admin = $connectedPdo->query("SELECT id, username, full_name, role, status FROM users WHERE username = 'admin'")->fetch(PDO::FETCH_ASSOC);
            if ($admin) {
                echo '<div class="item" style="padding-left:20px;color:#86efac;">Tài khoản Admin: <code>' . htmlspecialchars($admin['username']) . '</code> | Họ tên: ' . htmlspecialchars($admin['full_name']) . ' | Quyền: ' . htmlspecialchars($admin['role']) . '</div>';
            }
        } else {
            echo '<div class="item">❌ <b style="color:#ef4444">Chưa có bảng <code>users</code>!</b></div>';
        }

        // Kiểm tra bảng classes, students
        if (in_array('classes', $tables)) {
            $classCount = (int)$connectedPdo->query("SELECT COUNT(*) FROM classes")->fetchColumn();
            echo '<div class="item">✅ Bảng <code>classes</code>: có <b>' . $classCount . '</b> lớp học.</div>';
        }
        if (in_array('students', $tables)) {
            $studentCount = (int)$connectedPdo->query("SELECT COUNT(*) FROM students")->fetchColumn();
            echo '<div class="item">✅ Bảng <code>students</code>: có <b>' . $studentCount . '</b> học sinh.</div>';
        }
    } catch (Throwable $e) {
        echo '<p style="color:#ef4444">Lỗi khi đọc bảng: ' . htmlspecialchars($e->getMessage()) . '</p>';
    }
}
echo '</div>';

echo '<p style="text-align:center;color:#64748b;margin-top:30px;">Hệ thống kiểm tra & chẩn đoán tự động ThayKinhKPI — Hoàn thành lúc ' . date('H:i:s d/m/Y') . '</p>';
echo '</body></html>';
