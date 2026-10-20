<?php
// backend/app/Controllers/SchoolWorkspaceController.php
// Controller xử lý Đa trường học (Multi-tenant) - Các thế giới song song biệt lập dữ liệu hoàn toàn

namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use PDO;
use Exception;

class SchoolWorkspaceController {
    /**
     * Danh sách tất cả các trường học (không gian làm việc độc lập) trong hệ thống
     */
    public function list(Request $request): void {
        try {
            $serverPdo = Database::getServerConnection();
            $stmt = $serverPdo->query("SHOW DATABASES");
            $databases = $stmt->fetchAll(PDO::FETCH_COLUMN);

            $config = require __DIR__ . '/../../config/database.php';
            $host = $config['host'];
            $port = $config['port'];
            $user = $config['username'];
            $pass = $config['password'];
            $options = $config['options'];

            $schools = [];

            foreach ($databases as $dbName) {
                $isDefault = ($dbName === 'chuyenhungvuong_kpi');
                $isKpiDb = (strpos($dbName, 'kpi_') === 0);

                if (!$isDefault && !$isKpiDb) {
                    continue;
                }

                $code = $isDefault ? 'chuyenhungvuong' : substr($dbName, 4);

                try {
                    $schoolPdo = new PDO("mysql:host=$host;port=$port;dbname=$dbName;charset=utf8mb4", $user, $pass, $options);
                    
                    // Lấy cấu hình trường
                    $settingsStmt = $schoolPdo->query("SELECT setting_key, setting_value FROM school_settings");
                    $settings = $settingsStmt ? $settingsStmt->fetchAll(PDO::FETCH_KEY_PAIR) : [];

                    // Đếm số lớp và học sinh
                    $classCount = 0;
                    $studentCount = 0;
                    try {
                        $classCount = (int)$schoolPdo->query("SELECT COUNT(*) FROM classes")->fetchColumn();
                        $studentCount = (int)$schoolPdo->query("SELECT COUNT(*) FROM students")->fetchColumn();
                    } catch (Exception $e) {}

                    $logo = $settings['school_logo'] ?? null;
                    if (!$logo || (!$isDefault && $logo === '/logo.png')) {
                        $logo = $isDefault ? '/logo.png' : "/logos/{$code}.svg";
                    }

                    $schools[] = [
                        'code' => $code,
                        'name' => $settings['school_name'] ?? ($isDefault ? 'Trường THPT Chuyên Hùng Vương' : ('Trường THPT ' . ucfirst($code))),
                        'province' => $settings['school_province'] ?? 'Phú Thọ',
                        'logo' => $logo,
                        'brand_primary_color' => $settings['brand_primary_color'] ?? '#0e3a7c',
                        'total_classes' => $classCount,
                        'total_students' => $studentCount,
                        'is_default' => $isDefault,
                        'database' => $dbName
                    ];
                } catch (Exception $e) {
                    // Nếu db lỗi hoặc chưa có bảng, vẫn liệt kê ở dạng raw
                    $schools[] = [
                        'code' => $code,
                        'name' => $isDefault ? 'Trường THPT Chuyên Hùng Vương' : ('Trường THPT ' . ucfirst($code)),
                        'province' => 'Phú Thọ',
                        'logo' => '/logo.png',
                        'brand_primary_color' => '#0e3a7c',
                        'total_classes' => 0,
                        'total_students' => 0,
                        'is_default' => $isDefault,
                        'database' => $dbName
                    ];
                }
            }

            // Sắp xếp: Mặc định lên đầu, các trường khác theo tên
            usort($schools, function($a, $b) {
                if ($a['is_default']) return -1;
                if ($b['is_default']) return 1;
                return strcmp($a['name'], $b['name']);
            });

            Response::success($schools);
        } catch (Exception $e) {
            Response::error('Lỗi khi lấy danh sách trường học: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Khởi tạo một không gian trường học mới (Trắng tinh 100%, thế giới song song độc lập)
     */
    public function create(Request $request): void {
        $data = $request->getBody();

        $name = trim($data['school_name'] ?? '');
        $rawCode = trim($data['school_code'] ?? '');
        $code = preg_replace('/[^a-zA-Z0-9_]/', '', strtolower($rawCode));
        $province = trim($data['school_province'] ?? 'Phú Thọ');
        $adminUser = trim($data['admin_username'] ?? 'admin');
        $adminPass = trim($data['admin_password'] ?? '');
        $adminName = trim($data['admin_name'] ?? ('Ban Giám Hiệu — ' . $name));
        $primaryColor = trim($data['brand_primary_color'] ?? '#0e3a7c');

        if (!$name) {
            Response::error('Vui lòng nhập tên trường học', 400);
            return;
        }

        if (!$code) {
            Response::error('Vui lòng nhập mã viết tắt của trường (viết liền, ví dụ: viettri, lamthao, yenlap)', 400);
            return;
        }

        if ($code === 'chuyenhungvuong' || $code === 'hungvuong' || $code === 'default') {
            Response::error('Mã trường này trùng với hệ thống mặc định, vui lòng chọn mã khác', 400);
            return;
        }

        if (strlen($adminPass) < 6) {
            Response::error('Mật khẩu quản trị viên phải từ 6 ký tự trở lên', 400);
            return;
        }

        try {
            $config = require __DIR__ . '/../../config/database.php';
            $host = $config['host'];
            $port = $config['port'];
            $user = $config['username'];
            $pass = $config['password'];
            $options = $config['options'];

            $newDbName = 'kpi_' . $code;

            $serverPdo = new PDO("mysql:host=$host;port=$port;charset=utf8mb4", $user, $pass, $options);

            // Kiểm tra DB đã tồn tại chưa
            $checkStmt = $serverPdo->prepare("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?");
            $checkStmt->execute([$newDbName]);
            if ($checkStmt->fetch()) {
                Response::error("Trường với mã '$code' đã tồn tại trong hệ thống. Hãy chọn mã trường khác hoặc đăng nhập trực tiếp.", 400);
                return;
            }

            // 1. Tạo Database mới
            $serverPdo->exec("CREATE DATABASE `$newDbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");

            // 2. Kết nối tới DB mới và chạy Schema sạch
            $schoolPdo = new PDO("mysql:host=$host;port=$port;dbname=$newDbName;charset=utf8mb4", $user, $pass, $options);
            
            $schemaCandidates = [
                __DIR__ . '/../../../database/clean_schema.sql',
                __DIR__ . '/../../database/clean_schema.sql',
                dirname(dirname(__DIR__)) . '/database/clean_schema.sql',
                'C:/source code/ThayKinhKPI/database/clean_schema.sql'
            ];
            $schemaPath = null;
            foreach ($schemaCandidates as $candidate) {
                if (file_exists($candidate)) {
                    $schemaPath = $candidate;
                    break;
                }
            }
            if (!$schemaPath) {
                throw new Exception("Không tìm thấy file schema chuẩn clean_schema.sql");
            }

            $sqlContent = file_get_contents($schemaPath);
            $schoolPdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
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
                    $schoolPdo->exec($cleanSql);
                }
            }
            $schoolPdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

            // 3. Tạo niên khóa 2026-2027 và kỳ đánh giá
            $schoolPdo->exec("
                INSERT INTO academic_years (id, code, name, is_current, start_date, end_date)
                VALUES (1, '2026-2027', 'Năm học 2026 - 2027', 1, '2026-09-01', '2027-05-31')
                ON DUPLICATE KEY UPDATE is_current = 1;

                INSERT INTO kpi_assessment_periods (id, code, name, academic_year_id, start_date, end_date, is_locked)
                VALUES 
                (1, 'HK1_2026', 'Học kỳ 1 (2026 - 2027)', 1, '2026-09-01', '2027-01-15', 0),
                (2, 'HK2_2026', 'Học kỳ 2 (2026 - 2027)', 1, '2027-01-16', '2027-05-31', 0)
                ON DUPLICATE KEY UPDATE name = VALUES(name);
            ");

            // 4. Nạp 10 quy tắc KPI nền tảng
            $rules = [
                ['L01', 'Vắng mặt điểm danh KTX không phép', 10, 'Trừ 10 điểm khi vắng không có đơn phép', 'chuyen_can'],
                ['L02', 'Đi học muộn / Ra khỏi KTX sau giờ giới nghiêm', 5, 'Trừ 5 điểm', 'ne_nep'],
                ['L03', 'Không thực hiện trực nhật / vệ sinh phòng bẩn', 5, 'Trừ 5 điểm', 've_sinh'],
                ['L04', 'Sử dụng thiết bị điện sai quy định / đun nấu', 15, 'Trừ 15 điểm nguy cơ cháy nổ', 'an_toan'],
                ['L05', 'Gây mất trật tự sau 22h30', 5, 'Trừ 5 điểm ảnh hưởng phòng khác', 'ne_nep'],
                ['L06', 'Dẫn người ngoài vào phòng KTX không đăng ký', 20, 'Trừ 20 điểm vi phạm an ninh KTX', 'an_toan'],
                ['L07', 'Gương mẫu trong học tập và sinh hoạt tuần', -10, 'Cộng 10 điểm khen thưởng tuần', 'khen_thuong'],
                ['L08', 'Tích cực tham gia hoạt động Đoàn / KTX', -5, 'Cộng 5 điểm phong trào', 'khen_thuong'],
                ['L09', 'Phòng ở đạt danh hiệu Phòng kiểu mẫu tuần', -15, 'Cộng 15 điểm phòng sạch đẹp', 'khen_thuong'],
                ['L10', 'Nhặt được của rơi trả lại người mất', -20, 'Cộng 20 điểm việc tốt đột xuất', 'khen_thuong']
            ];
            $stmtRule = $schoolPdo->prepare("
                INSERT INTO kpi_rules (code, name, deduction_points, description, category)
                VALUES (?, ?, ?, ?, ?)
            ");
            foreach ($rules as $r) {
                $stmtRule->execute([$r[0], $r[1], $r[2], $r[3], $r[4]]);
            }

            // 5. Nạp 11 chế độ sinh hoạt nề nếp
            $regimes = [
                [1, '05:30', '05:45', 'Báo thức', 'Toàn bộ học sinh thức dậy, mở cửa thông thoáng', 'Trưởng phòng'],
                [2, '05:45', '06:15', 'Thể dục sáng & Vệ sinh cá nhân', 'Tập thể dục, vệ sinh phòng ở', 'Trưởng phòng, Trưởng tầng'],
                [3, '06:15', '06:45', 'Ăn sáng', 'Học sinh ăn sáng tại nhà ăn', 'Quản sinh'],
                [4, '06:45', '11:30', 'Đi học buổi sáng', 'Lên lớp học chính khóa', 'GVCN, Đoàn trường'],
                [5, '11:30', '12:15', 'Ăn trưa', 'Ăn trưa tại nhà ăn KTX', 'Quản sinh'],
                [6, '12:15', '13:30', 'Nghỉ trưa', 'Tất cả học sinh nghỉ ngơi tại phòng', 'Trưởng phòng, Trưởng tầng'],
                [7, '13:45', '17:00', 'Học buổi chiều / Tự học', 'Học phụ đạo, chuyên đề, ngoại khóa', 'GVCN'],
                [8, '17:00', '18:15', 'Thể thao & Tắm giặt', 'Rèn luyện thể chất, sinh hoạt cá nhân', 'Học sinh tự quản'],
                [9, '18:15', '19:00', 'Ăn tối', 'Ăn tối tại nhà ăn KTX', 'Quản sinh'],
                [10, '19:30', '21:45', 'Tự học buổi tối', 'Tập trung tự học nghiêm túc tại phòng/thư viện', 'Trưởng tầng, Quản sinh'],
                [11, '22:00', '22:30', 'Điểm danh tối & Giới nghiêm ngủ', 'Trưởng phòng điểm danh, Quản sinh kiểm tra, tắt đèn', 'Quản sinh, Trưởng tầng']
            ];
            $stmtRegime = $schoolPdo->prepare("
                INSERT INTO daily_regimes (order_num, time_start, time_end, name, description, responsible_role, is_active)
                VALUES (?, ?, ?, ?, ?, ?, 1)
            ");
            foreach ($regimes as $reg) {
                $stmtRegime->execute($reg);
            }

            // 6. Tạo tài khoản Admin cho trường mới
            $passwordHash = password_hash($adminPass, PASSWORD_BCRYPT);
            $stmtAdmin = $schoolPdo->prepare("
                INSERT INTO users (username, password_hash, full_name, email, role, status)
                VALUES (?, ?, ?, ?, 'admin', 'active')
            ");
            $adminEmail = $code . '.admin@moet.edu.vn';
            $stmtAdmin->execute([$adminUser, $passwordHash, $adminName, $adminEmail]);

            // 7. Lưu cấu hình trường học
            $settings = [
                'school_name' => $name,
                'school_code' => strtoupper($code),
                'school_province' => $province,
                'school_logo' => "/logos/{$code}.svg",
                'brand_primary_color' => $primaryColor,
                'brand_accent_color' => '#d32027',
                'brand_gold_color' => '#f59e0b',
                'academic_year_current' => '2026 - 2027',
                'morning_attendance_time' => '06:00',
                'evening_attendance_time' => '22:00',
                'zalo_report_time' => '22:15'
            ];

            $stmtSet = $schoolPdo->prepare("INSERT INTO school_settings (setting_key, setting_value, description) VALUES (?, ?, 'Cấu hình hệ thống')");
            foreach ($settings as $k => $v) {
                $stmtSet->execute([$k, $v]);
            }

            Response::success([
                'code' => $code,
                'name' => $name,
                'province' => $province,
                'database' => $newDbName,
                'admin_username' => $adminUser,
                'admin_password' => $adminPass,
                'message' => "Đã tạo thành công không gian trường học biệt lập: '$name'!"
            ], 'Khởi tạo không gian trường học thành công!');
        } catch (Exception $e) {
            Response::error('Lỗi khi khởi tạo trường học: ' . $e->getMessage(), 500);
        }
    }
}
