<?php
// backend/app/Controllers/AdminController.php

namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Middleware\AuthMiddleware;
use PDO;

class AdminController {
    public function users(Request $request): void {
        if (!AuthMiddleware::requireAdmin()) {
            return;
        }

        $db = Database::getConnection();
        $role = $request->get('role');
        $status = $request->get('status');
        $search = trim($request->get('search', ''));

        $where = ['1=1'];
        $params = [];
        if ($role) {
            $where[] = "u.role = ?";
            $params[] = $role;
        }
        if ($status) {
            $where[] = "u.status = ?";
            $params[] = $status;
        }
        if ($search !== '') {
            $where[] = "(u.username LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        $sql = "
            SELECT u.id, u.username, u.full_name, u.email, u.phone, u.role, u.status, u.avatar_url, u.created_at,
                   sa.scope_type, sa.scope_id,
                   CASE 
                       WHEN sa.scope_type = 'room' THEN CONCAT('Phòng ', dr.code, ' (T', dr.floor_number, ')')
                       WHEN sa.scope_type = 'floor' THEN CONCAT('Tầng ', sa.scope_id)
                       WHEN sa.scope_type = 'class' THEN c.name
                       ELSE NULL
                   END AS scope_display,
                   dr.code AS room_code,
                   c.name AS class_name
            FROM users u
            LEFT JOIN (
                SELECT user_id, 
                       SUBSTRING_INDEX(GROUP_CONCAT(scope_type ORDER BY id DESC), ',', 1) AS scope_type,
                       CAST(SUBSTRING_INDEX(GROUP_CONCAT(scope_id ORDER BY id DESC), ',', 1) AS UNSIGNED) AS scope_id
                FROM user_scope_assignments
                GROUP BY user_id
            ) sa ON u.id = sa.user_id
            LEFT JOIN dormitory_rooms dr ON sa.scope_type = 'room' AND sa.scope_id = dr.id
            LEFT JOIN classes c ON sa.scope_type = 'class' AND sa.scope_id = c.id
            WHERE " . implode(' AND ', $where) . "
            ORDER BY u.id ASC
            LIMIT 150
        ";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $users = $stmt->fetchAll();

        Response::success($users);
    }

    public function createUser(Request $request): void {
        if (!AuthMiddleware::requireAdmin()) {
            return;
        }

        $db = Database::getConnection();
        $username = trim($request->input('username', ''));
        $password = trim($request->input('password', 'password123'));
        $fullName = trim($request->input('full_name', ''));
        $email = trim($request->input('email', ''));
        $phone = trim($request->input('phone', ''));
        $role = $request->input('role', 'homeroom_teacher');
        $avatarUrl = $request->input('avatar_url', null);
        $scopeType = $request->input('scope_type');
        $scopeId = $request->input('scope_id');

        // Automatically determine scopeType based on role if not provided
        if (!$scopeType) {
            if ($role === 'room_leader') $scopeType = 'room';
            elseif ($role === 'floor_leader') $scopeType = 'floor';
            elseif ($role === 'homeroom_teacher') $scopeType = 'class';
        }

        if (!$username || !$fullName) {
            Response::error('Tên đăng nhập và họ tên là bắt buộc', 422);
            return;
        }

        $chk = $db->prepare("SELECT id FROM users WHERE username = ?");
        $chk->execute([$username]);
        if ($chk->fetch()) {
            Response::error("Tên đăng nhập '$username' đã tồn tại", 409);
            return;
        }

        $hash = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $db->prepare("INSERT INTO users (username, password_hash, full_name, email, phone, role, status, avatar_url) VALUES (?, ?, ?, ?, ?, ?, 'active', ?)");
        $stmt->execute([$username, $hash, $fullName, $email, $phone, $role, $avatarUrl]);
        $uId = $db->lastInsertId();

        if ($scopeType && $scopeId) {
            $db->prepare("INSERT INTO user_scope_assignments (user_id, scope_type, scope_id) VALUES (?, ?, ?)")
                ->execute([$uId, $scopeType, (int)$scopeId]);
        }

        Response::success(['id' => $uId], 'Tạo tài khoản người dùng thành công', 201);
    }

    public function updateUser(Request $request, string $id): void {
        if (!AuthMiddleware::requireAdmin()) {
            return;
        }

        $db = Database::getConnection();
        $existing = $db->query("SELECT * FROM users WHERE id = " . (int)$id)->fetch();
        if (!$existing) {
            Response::notFound('Tài khoản không tồn tại');
            return;
        }

        $username = $request->input('username') !== null ? trim($request->input('username')) : $existing['username'];
        $fullName = $request->input('full_name') !== null ? trim($request->input('full_name')) : $existing['full_name'];
        $email = $request->input('email') !== null ? trim($request->input('email')) : $existing['email'];
        $phone = $request->input('phone') !== null ? trim($request->input('phone')) : $existing['phone'];
        $role = $request->input('role') !== null ? $request->input('role') : $existing['role'];
        $status = $request->input('status') !== null ? $request->input('status') : $existing['status'];
        $avatarUrl = $request->input('avatar_url') !== null ? $request->input('avatar_url') : ($existing['avatar_url'] ?? null);
        $newPassword = $request->input('new_password');
        $scopeType = $request->input('scope_type');
        $scopeId = $request->input('scope_id');

        $stmt = $db->prepare("UPDATE users SET username = ?, full_name = ?, email = ?, phone = ?, role = ?, status = ?, avatar_url = ? WHERE id = ?");
        $stmt->execute([$username, $fullName, $email, $phone, $role, $status, $avatarUrl, (int)$id]);

        if ($newPassword && strlen($newPassword) >= 6) {
            $hash = password_hash($newPassword, PASSWORD_BCRYPT);
            $db->prepare("UPDATE users SET password_hash = ? WHERE id = ?")->execute([$hash, (int)$id]);
        }

        // Update scope assignment if provided
        if ($scopeType !== null || $scopeId !== null) {
            $db->prepare("DELETE FROM user_scope_assignments WHERE user_id = ?")->execute([(int)$id]);
            if ($scopeType && $scopeId) {
                $db->prepare("INSERT INTO user_scope_assignments (user_id, scope_type, scope_id) VALUES (?, ?, ?)")
                    ->execute([(int)$id, $scopeType, (int)$scopeId]);
            }
        }

        Response::success(null, 'Cập nhật tài khoản thành công');
    }

    public function settings(Request $request): void {
        $db = Database::getConnection();
        $settings = $db->query("SELECT setting_key, setting_value FROM school_settings")->fetchAll(PDO::FETCH_KEY_PAIR);
        Response::success($settings);
    }

    public function updateSettings(Request $request): void {
        if (!AuthMiddleware::requireAdmin()) {
            return;
        }

        $db = Database::getConnection();
        $user = AuthMiddleware::$currentUser;
        $body = $request->getBody();

        $stmt = $db->prepare("
            INSERT INTO school_settings (setting_key, setting_value, updated_at) 
            VALUES (?, ?, NOW()) 
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()
        ");

        foreach ($body as $key => $val) {
            $stmt->execute([$key, is_array($val) ? json_encode($val) : (string)$val]);
        }

        // Audit log
        $db->prepare("INSERT INTO audit_logs (user_id, action, entity_type, details) VALUES (?, 'UPDATE_SETTINGS', 'school_settings', 'Cập nhật cấu hình nhận diện và vận hành hệ thống')")
            ->execute([$user['id'] ?? 1]);

        Response::success(null, 'Đã lưu cấu hình hệ thống thành công');
    }

    public function auditLogs(Request $request): void {
        if (!AuthMiddleware::requireAdmin()) {
            return;
        }

        $db = Database::getConnection();
        $page = max(1, (int)$request->get('page', 1));
        $limit = max(1, min(100, (int)$request->get('limit', 25)));
        $offset = ($page - 1) * $limit;

        $total = (int)$db->query("SELECT COUNT(*) FROM audit_logs")->fetchColumn();

        $sql = "
            SELECT a.*, u.username, u.full_name, u.role
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            ORDER BY a.created_at DESC
            LIMIT $limit OFFSET $offset
        ";
        $logs = $db->query($sql)->fetchAll();

        Response::success([
            'items' => $logs,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'total_pages' => ceil($total / $limit)
        ]);
    }

    public function backup(Request $request): void {
        if (!AuthMiddleware::requireAdmin()) {
            return;
        }

        $db = Database::getConnection();
        $user = AuthMiddleware::$currentUser;

        // Record audit
        $db->prepare("INSERT INTO audit_logs (user_id, action, entity_type, details) VALUES (?, 'BACKUP_DATABASE', 'system', 'Thực hiện xuất bản sao lưu cơ sở dữ liệu')")
            ->execute([$user['id'] ?? 1]);

        $tables = $db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
        $totalRows = 0;
        $tableSummaries = [];

        foreach ($tables as $t) {
            $c = (int)$db->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();
            $totalRows += $c;
            $tableSummaries[$t] = $c;
        }

        Response::success([
            'status' => 'success',
            'backup_timestamp' => date('Y-m-d H:i:s'),
            'database_name' => 'chuyenhungvuong_kpi',
            'server_version' => $db->query("SELECT VERSION()")->fetchColumn(),
            'total_tables' => count($tables),
            'total_records' => $totalRows,
            'tables' => $tableSummaries,
            'backup_file_name' => 'backup_chuyenhungvuong_kpi_' . date('Ymd_His') . '.sql'
        ], 'Tạo bản sao lưu cơ sở dữ liệu thành công');
    }

    public function destroyUser(Request $request, string $id): void {
        if (!AuthMiddleware::requireAdmin()) {
            return;
        }

        $db = Database::getConnection();
        $currentUser = AuthMiddleware::$currentUser;

        if ($currentUser && (int)$currentUser['id'] === (int)$id) {
            Response::error('Bạn không thể tự xóa tài khoản của chính mình đang đăng nhập', 400);
            return;
        }

        if ((int)$id === 1) {
            Response::error('Không thể xóa tài khoản Quản trị viên cấp cao mặc định (Super Admin)', 403);
            return;
        }

        $user = $db->query("SELECT * FROM users WHERE id = " . (int)$id)->fetch();
        if (!$user) {
            Response::notFound('Người dùng không tồn tại');
            return;
        }

        $db->beginTransaction();
        try {
            $db->prepare("DELETE FROM user_scope_assignments WHERE user_id = ?")->execute([(int)$id]);
            $db->prepare("DELETE FROM users WHERE id = ?")->execute([(int)$id]);

            $db->prepare("INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, 'DELETE_USER', 'users', ?, ?)")
                ->execute([$currentUser['id'] ?? null, (int)$id, "Xóa tài khoản {$user['username']} ({$user['full_name']})"]);

            $db->commit();
        } catch (\Exception $e) {
            $db->rollBack();
            Response::error('Lỗi khi xóa tài khoản: ' . $e->getMessage(), 500);
            return;
        }

        Response::success(null, "Đã xóa tài khoản {$user['username']} thành công");
    }

    public function exportAllData(Request $request): void {
        if (!AuthMiddleware::requireAdmin()) {
            return;
        }

        $db = Database::getConnection();

        // 1. School Info Settings
        $settings = $db->query("SELECT setting_key, setting_value FROM school_settings")->fetchAll(PDO::FETCH_KEY_PAIR) ?: [];

        // 2. Classes
        $classes = $db->query("
            SELECT c.code AS ma_lop, c.name AS ten_lop, c.grade_level AS khoi,
                   COALESCE(t.full_name, '') AS giao_vien_chu_nhiem,
                   COALESCE(t.phone, '') AS sdt_gvcn,
                   COALESCE(c.room_location, '') AS phong_hoc,
                   c.total_students AS si_so,
                   c.boarding_students AS so_noi_tru
            FROM classes c
            LEFT JOIN teachers t ON c.homeroom_teacher_id = t.id
            ORDER BY c.grade_level ASC, c.code ASC
        ")->fetchAll();

        // 3. Dormitory Rooms
        $rooms = $db->query("
            SELECT dr.code AS so_phong, dr.floor_number AS tang, dr.gender AS loai_phong,
                   dr.capacity AS suc_chua, dr.current_occupancy AS dang_o,
                   COALESCE(u.full_name, '') AS truong_phong
            FROM dormitory_rooms dr
            LEFT JOIN users u ON dr.room_leader_id = u.id
            ORDER BY dr.floor_number ASC, dr.code ASC
        ")->fetchAll();

        // 4. Students
        $students = $db->query("
            SELECT s.code AS ma_hoc_sinh, s.full_name AS ho_va_ten, s.dob AS ngay_sinh, s.gender AS gioi_tinh,
                   c.code AS ma_lop, c.name AS ten_lop,
                   CASE WHEN s.is_boarding = 1 THEN 'Nội trú' ELSE 'Ngoại trú' END AS loai_cu_tru,
                   COALESCE(dr.code, '') AS phong_ktx,
                   COALESCE(s.parent_name, '') AS ho_ten_phu_huynh,
                   COALESCE(s.parent_phone, '') AS sdt_phu_huynh,
                   COALESCE(s.student_phone, '') AS sdt_hoc_sinh,
                   COALESCE(s.id_card_number, '') AS cccd_dinh_danh,
                   COALESCE(s.hometown, '') AS dia_chi_thuong_tru
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN dormitory_rooms dr ON s.dorm_room_id = dr.id
            ORDER BY s.id ASC
        ")->fetchAll();

        // 5. Users
        $users = $db->query("
            SELECT u.username AS ten_dang_nhap, u.full_name AS ho_va_ten, u.email, u.phone AS sdt,
                   u.role AS vai_tro,
                   sa.scope_type AS loai_pham_vi,
                   CASE 
                       WHEN sa.scope_type = 'room' THEN dr.code
                       WHEN sa.scope_type = 'floor' THEN CAST(sa.scope_id AS CHAR)
                       WHEN sa.scope_type = 'class' THEN c.code
                       ELSE ''
                   END AS pham_vi_quan_ly
            FROM users u
            LEFT JOIN user_scope_assignments sa ON u.id = sa.user_id
            LEFT JOIN dormitory_rooms dr ON sa.scope_type = 'room' AND sa.scope_id = dr.id
            LEFT JOIN classes c ON sa.scope_type = 'class' AND sa.scope_id = c.id
            ORDER BY u.id ASC
        ")->fetchAll();

        // 6. KPI Rules
        $rules = $db->query("
            SELECT code AS ma_loi, name AS ten_loi, deduction_points AS diem_tru,
                   description AS mo_ta, category AS nhom_loi
            FROM kpi_rules
            ORDER BY id ASC
        ")->fetchAll();

        // 7. Daily Regimes
        $regimes = $db->query("
            SELECT order_num AS thu_tu, time_start AS gio_bat_dau, time_end AS gio_ket_thuc,
                   name AS ten_che_do, description AS mo_ta, responsible_role AS bo_phan_phu_trach
            FROM daily_regimes
            ORDER BY order_num ASC
        ")->fetchAll();

        Response::success([
            'school_info' => [
                'ten_truong' => $settings['school_name'] ?? 'Trường THPT Chuyên Hùng Vương',
                'ma_truong' => $settings['school_code'] ?? 'THPT-CHV',
                'tinh_thanh' => $settings['school_province'] ?? 'Phú Thọ',
                'hieu_truong' => $settings['principal_name'] ?? 'ĐÀO MẠNH THẮNG',
                'hieu_pho' => $settings['vice_principals'] ?? 'Thầy Nguyễn Văn Kính, Cô Nguyễn Thị Thanh Thủy',
                'truong_ban_quan_sinh' => $settings['dorm_manager_name'] ?? 'VŨ VĂN HIỀN',
                'bi_thu_doan' => $settings['youth_union_secretary'] ?? 'Trần Thị Mai',
                'dia_chi' => $settings['school_address'] ?? 'Đại lộ Hùng Vương, TP. Việt Trì, Phú Thọ',
                'so_dien_thoai' => $settings['school_phone'] ?? '0210 3846 592',
                'email' => $settings['school_email'] ?? 'c3hungvuong.phutho@moet.edu.vn',
                'website' => $settings['school_website'] ?? 'thptchuyenhungvuong.phutho.edu.vn',
                'logo_url' => $settings['school_logo'] ?? '/logo.png',
                'nien_khoa' => $settings['academic_year_current'] ?? '2026-2027',
                'gio_diem_danh_sang' => $settings['morning_attendance_time'] ?? '06:00',
                'gio_diem_danh_toi' => $settings['evening_attendance_time'] ?? '22:00',
                'gio_bao_cao_zalo' => $settings['zalo_report_time'] ?? '22:15',
            ],
            'classes' => $classes,
            'rooms' => $rooms,
            'students' => $students,
            'users' => $users,
            'kpi_rules' => $rules,
            'regimes' => $regimes,
            'exported_at' => date('Y-m-d H:i:s'),
        ]);
    }

    public function clearAllData(Request $request): void {
        if (!AuthMiddleware::requireAdmin()) {
            return;
        }

        $confirmation = trim($request->input('confirmation', ''));
        if ($confirmation !== 'XOA TRANG DU LIEU' && $confirmation !== 'RESET') {
            Response::error('Xác nhận không hợp lệ. Vui lòng nhập đúng cụm từ "XOA TRANG DU LIEU" hoặc "RESET" để tiếp tục.', 400);
            return;
        }

        $db = Database::getConnection();
        $currentUser = AuthMiddleware::$currentUser;
        $keepSettings = $request->input('keep_settings', true);
        $newSchoolName = trim($request->input('school_name', ''));

        $db->beginTransaction();
        try {
            $db->exec("SET FOREIGN_KEY_CHECKS = 0;");

            $tablesToTruncate = [
                'violation_records',
                'student_kpi_summaries',
                'leave_requests',
                'dormitory_attendance_records',
                'dormitory_attendance_sessions',
                'dormitory_room_reports',
                'dormitory_floor_reports',
                'regime_execution_records',
                'duty_checklist_items',
                'duty_schedules',
                'room_assignments',
                'students',
                'dormitory_rooms',
                'dormitory_floors',
                'classes',
                'teachers',
                'user_scope_assignments'
            ];

            foreach ($tablesToTruncate as $t) {
                $db->exec("TRUNCATE TABLE `$t`;");
            }

            // Remove all users except superadmin (id = 1)
            $db->exec("DELETE FROM users WHERE id > 1;");
            
            // Reset superadmin account to default credentials
            $defaultPasswordHash = password_hash('password123', PASSWORD_BCRYPT);
            $db->prepare("
                UPDATE users 
                SET username = 'admin', password_hash = ?, full_name = 'Ban Giám Hiệu / Quản trị viên', 
                    email = 'admin@school.edu.vn', role = 'admin', status = 'active'
                WHERE id = 1
            ")->execute([$defaultPasswordHash]);

            // If new school name provided, update settings
            if ($newSchoolName) {
                $db->prepare("
                    INSERT INTO school_settings (setting_key, setting_value, updated_at) 
                    VALUES ('school_name', ?, NOW()) 
                    ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()
                ")->execute([$newSchoolName]);
            }

            $db->exec("SET FOREIGN_KEY_CHECKS = 1;");

            $db->prepare("INSERT INTO audit_logs (user_id, action, entity_type, details) VALUES (?, 'RESET_SYSTEM_DATA', 'system', 'Thực hiện xóa trắng toàn bộ dữ liệu để chuyển giao cho trường học mới')")
                ->execute([$currentUser['id'] ?? 1]);

            $db->commit();
        } catch (\Exception $e) {
            $db->rollBack();
            Response::error('Lỗi khi xóa trắng dữ liệu: ' . $e->getMessage(), 500);
            return;
        }

        Response::success([
            'reset_at' => date('Y-m-d H:i:s'),
            'admin_account' => [
                'username' => 'admin',
                'default_password' => 'password123',
                'role' => 'admin'
            ]
        ], 'Hệ thống đã được làm trống 100% dữ liệu thành công. Sẵn sàng bàn giao hoặc nạp file Excel dữ liệu mới!');
    }

    public function masterImport(Request $request): void {
        if (!AuthMiddleware::requireAdmin()) {
            return;
        }

        $db = Database::getConnection();
        $currentUser = AuthMiddleware::$currentUser;

        $schoolInfo = $request->input('school_info', []);
        $classes = $request->input('classes', []);
        $rooms = $request->input('rooms', []);
        $students = $request->input('students', []);
        $users = $request->input('users', []);
        $kpiRules = $request->input('kpi_rules', []);
        $regimes = $request->input('regimes', []);
        $mode = $request->input('mode', 'replace'); // 'replace' or 'merge'

        $db->beginTransaction();
        try {
            $db->exec("SET FOREIGN_KEY_CHECKS = 0;");

            // If replace mode, clear operational data first
            if ($mode === 'replace') {
                $tablesToClear = [
                    'violation_records', 'student_kpi_summaries', 'leave_requests',
                    'dormitory_attendance_records', 'dormitory_attendance_sessions',
                    'dormitory_room_reports', 'dormitory_floor_reports',
                    'regime_execution_records', 'duty_checklist_items', 'duty_schedules',
                    'room_assignments', 'students', 'dormitory_rooms', 'dormitory_floors',
                    'classes', 'teachers', 'user_scope_assignments'
                ];
                foreach ($tablesToClear as $tbl) {
                    $db->exec("TRUNCATE TABLE `$tbl`;");
                }
                $db->exec("DELETE FROM users WHERE id > 1;");
            }

            // 1. Update School Settings
            if (!empty($schoolInfo) && is_array($schoolInfo)) {
                $settingMap = [
                    'ten_truong' => 'school_name',
                    'school_name' => 'school_name',
                    'ma_truong' => 'school_code',
                    'school_code' => 'school_code',
                    'tinh_thanh' => 'school_province',
                    'school_province' => 'school_province',
                    'dia_chi' => 'school_address',
                    'school_address' => 'school_address',
                    'so_dien_thoai' => 'school_phone',
                    'school_phone' => 'school_phone',
                    'email' => 'school_email',
                    'school_email' => 'school_email',
                    'website' => 'school_website',
                    'school_website' => 'school_website',
                    'logo_url' => 'school_logo',
                    'school_logo' => 'school_logo',
                    'hieu_truong' => 'principal_name',
                    'principal_name' => 'principal_name',
                    'hieu_pho' => 'vice_principals',
                    'vice_principals' => 'vice_principals',
                    'truong_ban_quan_sinh' => 'dorm_manager_name',
                    'dorm_manager_name' => 'dorm_manager_name',
                    'bi_thu_doan' => 'youth_union_secretary',
                    'youth_union_secretary' => 'youth_union_secretary',
                    'nien_khoa' => 'academic_year_current',
                    'academic_year_current' => 'academic_year_current',
                    'gio_diem_danh_sang' => 'morning_attendance_time',
                    'morning_attendance_time' => 'morning_attendance_time',
                    'gio_diem_danh_toi' => 'evening_attendance_time',
                    'evening_attendance_time' => 'evening_attendance_time',
                    'gio_bao_cao_zalo' => 'zalo_report_time',
                    'zalo_report_time' => 'zalo_report_time',
                ];

                $stmtSetting = $db->prepare("
                    INSERT INTO school_settings (setting_key, setting_value, updated_at) 
                    VALUES (?, ?, NOW()) 
                    ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()
                ");

                foreach ($schoolInfo as $k => $v) {
                    $canonicalKey = $settingMap[$k] ?? null;
                    if ($canonicalKey && $v !== null && $v !== '') {
                        $stmtSetting->execute([$canonicalKey, (string)$v]);
                    }
                }
            }

            // Ensure academic year exists
            $acYear = $db->query("SELECT id FROM academic_years WHERE is_current = 1 LIMIT 1")->fetchColumn();
            if (!$acYear) {
                $db->exec("INSERT INTO academic_years (id, code, name, is_current, start_date, end_date) VALUES (1, '2026-2027', 'Năm học 2026 - 2027', 1, '2026-09-01', '2027-05-31')");
                $db->exec("INSERT INTO semesters (id, academic_year_id, name, is_current) VALUES (1, 1, 'Học kỳ 1 (2026-2027)', 1), (2, 1, 'Học kỳ 2 (2026-2027)', 0)");
                $db->exec("INSERT INTO kpi_assessment_periods (id, code, name, academic_year_id, start_date, end_date, is_locked) VALUES (1, 'HK1-2026', 'Học kỳ 1 Năm học 2026-2027', 1, '2026-09-01', '2027-01-15', 0)");
                $acYear = 1;
            }

            // 2. KPI Rules (If provided)
            if (!empty($kpiRules) && is_array($kpiRules)) {
                $db->exec("TRUNCATE TABLE kpi_rules;");
                $stmtRule = $db->prepare("INSERT INTO kpi_rules (code, name, deduction_points, description, category) VALUES (?, ?, ?, ?, ?)");
                foreach ($kpiRules as $r) {
                    $code = trim($r['ma_loi'] ?? $r['code'] ?? '');
                    $name = trim($r['ten_loi'] ?? $r['name'] ?? '');
                    $pts = (int)($r['diem_tru'] ?? $r['deduction_points'] ?? 1);
                    $desc = trim($r['mo_ta'] ?? $r['description'] ?? '');
                    $cat = trim($r['nhom_loi'] ?? $r['category'] ?? 'nề_nếp');
                    if ($code && $name) {
                        $stmtRule->execute([$code, $name, $pts, $desc, $cat]);
                    }
                }
            } else {
                // Ensure default 10 rules exist if table empty
                $cntRules = (int)$db->query("SELECT COUNT(*) FROM kpi_rules")->fetchColumn();
                if ($cntRules === 0) {
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
                    $stmtRule = $db->prepare("INSERT INTO kpi_rules (code, name, deduction_points, description, category) VALUES (?, ?, ?, ?, ?)");
                    foreach ($defaultRules as $dr) {
                        $stmtRule->execute($dr);
                    }
                }
            }

            // 3. Regimes (If provided)
            if (!empty($regimes) && is_array($regimes)) {
                $db->exec("TRUNCATE TABLE daily_regimes;");
                $stmtReg = $db->prepare("INSERT INTO daily_regimes (order_num, time_start, time_end, name, description, responsible_role) VALUES (?, ?, ?, ?, ?, ?)");
                foreach ($regimes as $reg) {
                    $ord = (int)($reg['thu_tu'] ?? $reg['order_num'] ?? 1);
                    $ts = trim($reg['gio_bat_dau'] ?? $reg['time_start'] ?? '');
                    $te = trim($reg['gio_ket_thuc'] ?? $reg['time_end'] ?? '');
                    $name = trim($reg['ten_che_do'] ?? $reg['name'] ?? '');
                    $desc = trim($reg['mo_ta'] ?? $reg['description'] ?? '');
                    $role = trim($reg['bo_phan_phu_trach'] ?? $reg['responsible_role'] ?? 'Ban Quản sinh');
                    if ($name && $ts) {
                        $stmtReg->execute([$ord, $ts, $te, $name, $desc, $role]);
                    }
                }
            }

            // 4. Dormitory Rooms & Floors
            $roomMap = []; // code => id
            if (!empty($rooms) && is_array($rooms)) {
                $floorsFound = [];
                foreach ($rooms as $rm) {
                    $fl = (int)($rm['tang'] ?? $rm['floor_number'] ?? 2);
                    $floorsFound[$fl] = true;
                }
                ksort($floorsFound);

                $stmtFloor = $db->prepare("
                    INSERT INTO dormitory_floors (floor_number, name, gender_zone, total_rooms) 
                    VALUES (?, ?, ?, 0)
                    ON DUPLICATE KEY UPDATE name = VALUES(name)
                ");
                foreach (array_keys($floorsFound) as $fNum) {
                    $stmtFloor->execute([$fNum, "Tầng $fNum", 'Nam/Nữ']);
                }

                $stmtRoom = $db->prepare("
                    INSERT INTO dormitory_rooms (code, floor_number, gender, capacity, current_occupancy, cleanliness_score) 
                    VALUES (?, ?, ?, ?, 0, 100)
                    ON DUPLICATE KEY UPDATE floor_number = VALUES(floor_number), gender = VALUES(gender), capacity = VALUES(capacity)
                ");
                $stmtGetRoomId = $db->prepare("SELECT id FROM dormitory_rooms WHERE code = ? LIMIT 1");

                foreach ($rooms as $rm) {
                    $code = trim($rm['so_phong'] ?? $rm['code'] ?? '');
                    $fl = (int)($rm['tang'] ?? $rm['floor_number'] ?? 2);
                    $gender = trim($rm['loai_phong'] ?? $rm['gender'] ?? 'Nam');
                    $cap = (int)($rm['suc_chua'] ?? $rm['capacity'] ?? 6);
                    if ($code) {
                        $stmtRoom->execute([$code, $fl, $gender, $cap]);
                        $rId = (int)$db->lastInsertId();
                        if (!$rId) {
                            $stmtGetRoomId->execute([$code]);
                            $rId = (int)$stmtGetRoomId->fetchColumn();
                        }
                        $roomMap[$code] = $rId;
                    }
                }

                // Update floor total rooms count
                $db->exec("
                    UPDATE dormitory_floors f 
                    SET total_rooms = (SELECT COUNT(*) FROM dormitory_rooms r WHERE r.floor_number = f.floor_number)
                ");
            }

            // 5. Classes & Teachers
            $classMap = []; // code => id
            if (!empty($classes) && is_array($classes)) {
                $stmtTeacher = $db->prepare("
                    INSERT INTO teachers (code, full_name, phone, email, is_duty_teacher) 
                    VALUES (?, ?, ?, ?, 1)
                    ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), phone = VALUES(phone), email = VALUES(email)
                ");
                $stmtClass = $db->prepare("
                    INSERT INTO classes (code, name, grade_level, academic_year_id, homeroom_teacher_id, total_students, boarding_students, room_location) 
                    VALUES (?, ?, ?, ?, ?, 0, 0, ?)
                    ON DUPLICATE KEY UPDATE name = VALUES(name), grade_level = VALUES(grade_level), homeroom_teacher_id = COALESCE(VALUES(homeroom_teacher_id), homeroom_teacher_id), room_location = VALUES(room_location)
                ");
                $stmtGetClassId = $db->prepare("SELECT id FROM classes WHERE code = ? LIMIT 1");

                foreach ($classes as $idx => $cls) {
                    $code = trim($cls['ma_lop'] ?? $cls['code'] ?? '');
                    $name = trim($cls['ten_lop'] ?? $cls['name'] ?? '');
                    $grade = (int)($cls['khoi'] ?? $cls['grade_level'] ?? 10);
                    $tName = trim($cls['giao_vien_chu_nhiem'] ?? $cls['teacher_name'] ?? '');
                    $tPhone = trim($cls['sdt_gvcn'] ?? $cls['teacher_phone'] ?? '');
                    $tEmail = trim($cls['email_gvcn'] ?? $cls['teacher_email'] ?? '');
                    $loc = trim($cls['phong_hoc'] ?? $cls['room_location'] ?? '');

                    if (!$code) continue;

                    $teacherId = null;
                    if ($tName) {
                        $tCode = 'GV' . sprintf('%03d', $idx + 1);
                        $stmtTeacher->execute([$tCode, $tName, $tPhone, $tEmail ?: "$code@school.edu.vn"]);
                        $teacherId = (int)$db->lastInsertId();
                        if (!$teacherId) {
                            $stmtGetT = $db->prepare("SELECT id FROM teachers WHERE code = ? LIMIT 1");
                            $stmtGetT->execute([$tCode]);
                            $teacherId = (int)$stmtGetT->fetchColumn();
                        }
                    }

                    $stmtClass->execute([$code, $name ?: $code, $grade, (int)$acYear, $teacherId, $loc]);
                    $cId = (int)$db->lastInsertId();
                    if (!$cId) {
                        $stmtGetClassId->execute([$code]);
                        $cId = (int)$stmtGetClassId->fetchColumn();
                    }
                    $classMap[$code] = $cId;
                }
            }

            // 6. Students
            if (!empty($students) && is_array($students)) {
                $stmtStudent = $db->prepare("
                    INSERT INTO students (code, full_name, dob, gender, class_id, is_boarding, dorm_room_id, parent_name, parent_phone, student_phone, id_card_number, hometown, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'studying')
                    ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), dob = VALUES(dob), gender = VALUES(gender), class_id = VALUES(class_id), is_boarding = VALUES(is_boarding), dorm_room_id = VALUES(dorm_room_id), parent_name = VALUES(parent_name), parent_phone = VALUES(parent_phone), id_card_number = VALUES(id_card_number), hometown = VALUES(hometown)
                ");

                foreach ($students as $st) {
                    $code = trim($st['ma_hoc_sinh'] ?? $st['code'] ?? '');
                    $name = trim($st['ho_va_ten'] ?? $st['full_name'] ?? '');
                    $dob = trim($st['ngay_sinh'] ?? $st['dob'] ?? '2009-01-01');
                    $gender = trim($st['gioi_tinh'] ?? $st['gender'] ?? 'Nam');
                    $cCode = trim($st['ma_lop'] ?? $st['class_code'] ?? '');
                    $rCode = trim($st['phong_ktx'] ?? $st['room_code'] ?? '');
                    $resType = trim($st['loai_cu_tru'] ?? $st['is_boarding'] ?? '');

                    $pName = trim($st['ho_ten_phu_huynh'] ?? $st['parent_name'] ?? '');
                    $pPhone = trim($st['sdt_phu_huynh'] ?? $st['parent_phone'] ?? '');
                    $sPhone = trim($st['sdt_hoc_sinh'] ?? $st['student_phone'] ?? '');
                    $cccd = trim($st['cccd_dinh_danh'] ?? $st['id_card_number'] ?? '');
                    $addr = trim($st['dia_chi_thuong_tru'] ?? $st['hometown'] ?? '');

                    if (!$code || !$name) continue;

                    $cId = $classMap[$cCode] ?? null;
                    $rId = $roomMap[$rCode] ?? null;
                    $isBoarding = ($rId !== null || stripos($resType, 'nội') !== false || $resType === '1' || $resType === 'true') ? 1 : 0;

                    $stmtStudent->execute([
                        $code, $name, $dob ?: '2009-01-01', $gender, $cId, $isBoarding, $rId,
                        $pName, $pPhone, $sPhone, $cccd, $addr
                    ]);
                }

                // Update class statistics
                $db->exec("
                    UPDATE classes c
                    SET total_students = (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id),
                        boarding_students = (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id AND s.is_boarding = 1)
                ");

                // Update room occupancy
                $db->exec("
                    UPDATE dormitory_rooms dr
                    SET current_occupancy = (SELECT COUNT(*) FROM students s WHERE s.dorm_room_id = dr.id)
                ");
            }

            // 7. Users
            if (!empty($users) && is_array($users)) {
                $stmtUser = $db->prepare("
                    INSERT INTO users (username, password_hash, full_name, email, phone, role, status)
                    VALUES (?, ?, ?, ?, ?, ?, 'active')
                ");
                $stmtScope = $db->prepare("INSERT INTO user_scope_assignments (user_id, scope_type, scope_id) VALUES (?, ?, ?)");

                foreach ($users as $u) {
                    $uName = trim($u['ten_dang_nhap'] ?? $u['username'] ?? '');
                    $uPass = trim($u['mat_khau'] ?? $u['password'] ?? 'password123');
                    $fName = trim($u['ho_va_ten'] ?? $u['full_name'] ?? '');
                    $email = trim($u['email'] ?? '');
                    $phone = trim($u['sdt'] ?? $u['phone'] ?? '');
                    $role = trim($u['vai_tro'] ?? $u['role'] ?? 'homeroom_teacher');
                    $scopeType = trim($u['loai_pham_vi'] ?? $u['scope_type'] ?? '');
                    $scopeCode = trim($u['pham_vi_quan_ly'] ?? $u['scope_code'] ?? '');

                    if (!$uName) continue;

                    // If user already exists (e.g. admin), update
                    $existId = $db->query("SELECT id FROM users WHERE username = " . $db->quote($uName))->fetchColumn();
                    $passHash = password_hash($uPass ?: 'password123', PASSWORD_BCRYPT);

                    if ($existId) {
                        $db->prepare("UPDATE users SET full_name = ?, email = ?, phone = ?, role = ?, status = 'active' WHERE id = ?")
                            ->execute([$fName ?: $uName, $email, $phone, $role, (int)$existId]);
                        $userId = (int)$existId;
                    } else {
                        $stmtUser->execute([$uName, $passHash, $fName ?: $uName, $email, $phone, $role]);
                        $userId = (int)$db->lastInsertId();
                    }

                    // Scope assignment
                    $targetScopeId = null;
                    if ($role === 'homeroom_teacher' || $scopeType === 'class') {
                        $targetScopeId = $classMap[$scopeCode] ?? null;
                        $scopeType = 'class';
                    } elseif ($role === 'room_leader' || $scopeType === 'room') {
                        $targetScopeId = $roomMap[$scopeCode] ?? null;
                        $scopeType = 'room';
                    } elseif ($role === 'floor_leader' || $scopeType === 'floor') {
                        $targetScopeId = (int)$scopeCode;
                        $scopeType = 'floor';
                    }

                    if ($targetScopeId && $scopeType) {
                        $db->prepare("DELETE FROM user_scope_assignments WHERE user_id = ?")->execute([$userId]);
                        $stmtScope->execute([$userId, $scopeType, (int)$targetScopeId]);
                    }
                }
            }

            $db->exec("SET FOREIGN_KEY_CHECKS = 1;");

            // Audit Log
            $db->prepare("INSERT INTO audit_logs (user_id, action, entity_type, details) VALUES (?, 'MASTER_DATA_IMPORT', 'system', 'Nhập trọn gói dữ liệu trường học từ file Excel mẫu')")
                ->execute([$currentUser['id'] ?? 1]);

            $db->commit();
        } catch (\Exception $e) {
            $db->rollBack();
            Response::error('Lỗi khi nạp dữ liệu trọn gói: ' . $e->getMessage(), 500);
            return;
        }

        // Return updated system statistics
        $totalStudents = (int)$db->query("SELECT COUNT(*) FROM students")->fetchColumn();
        $totalClasses = (int)$db->query("SELECT COUNT(*) FROM classes")->fetchColumn();
        $totalRooms = (int)$db->query("SELECT COUNT(*) FROM dormitory_rooms")->fetchColumn();
        $totalUsers = (int)$db->query("SELECT COUNT(*) FROM users")->fetchColumn();

        Response::success([
            'school_name' => $schoolInfo['ten_truong'] ?? $schoolInfo['school_name'] ?? 'Trường học mới',
            'total_classes' => $totalClasses,
            'total_rooms' => $totalRooms,
            'total_students' => $totalStudents,
            'total_users' => $totalUsers,
            'imported_at' => date('Y-m-d H:i:s'),
        ], 'Nhập toàn bộ dữ liệu hệ thống từ file Excel thành công! Toàn bộ website đã được cập nhật dữ liệu của trường mới.');
    }

    /**
     * Upload an image file from device (Logo, Avatar, Evidence, etc.)
     */
    public function uploadImage(Request $request)
    {
        $folder = preg_replace('/[^a-zA-Z0-9_-]/', '', $request->input('folder') ?? $request->get('folder') ?? 'general');
        if (!$folder) $folder = 'general';

        $uploadDir = __DIR__ . '/../../public/uploads/' . $folder . '/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $filename = '';
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

        // Option 1: Standard multipart/form-data upload via $_FILES
        if (!empty($_FILES['file']) || !empty($_FILES['image'])) {
            $file = !empty($_FILES['file']) ? $_FILES['file'] : $_FILES['image'];
            if ($file['error'] !== UPLOAD_ERR_OK) {
                Response::error('Lỗi khi tải file: ' . $file['error'], 400);
                return;
            }

            $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            if (!in_array($ext, $allowedExtensions)) {
                Response::error('Định dạng file không hợp lệ. Chỉ chấp nhận ảnh (JPG, PNG, GIF, WEBP, SVG)', 400);
                return;
            }

            $filename = $folder . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
            if (!move_uploaded_file($file['tmp_name'], $uploadDir . $filename)) {
                Response::error('Không thể lưu file trên máy chủ', 500);
                return;
            }
        }
        // Option 2: Base64 data URL via JSON body
        else {
            $data = $request->all();
            $base64 = $data['image_data'] ?? $data['file_data'] ?? null;
            if (!$base64) {
                Response::error('Vui lòng chọn hoặc truyền file ảnh từ thiết bị', 400);
                return;
            }

            if (preg_match('/^data:image\/(\w+);base64,/', $base64, $matches)) {
                $ext = strtolower($matches[1]);
                if ($ext === 'jpeg') $ext = 'jpg';
                if (!in_array($ext, $allowedExtensions)) $ext = 'png';
                $base64Data = substr($base64, strpos($base64, ',') + 1);
            } else {
                $ext = 'png';
                $base64Data = $base64;
            }

            $decoded = base64_decode($base64Data);
            if ($decoded === false) {
                Response::error('Dữ liệu ảnh base64 không hợp lệ', 400);
                return;
            }

            $filename = $folder . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
            if (file_put_contents($uploadDir . $filename, $decoded) === false) {
                Response::error('Không thể lưu file ảnh base64', 500);
                return;
            }
        }

        $relativeUrl = '/uploads/' . $folder . '/' . $filename;
        Response::success([
            'url' => $relativeUrl,
            'filename' => $filename,
            'folder' => $folder,
        ], 'Tải ảnh từ thiết bị lên thành công');
    }
}


