<?php
// backend/app/Controllers/AuthController.php

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Middleware\AuthMiddleware;
use PDO;

class AuthController {
    public function login(Request $request): void {
        $username = trim($request->input('username', ''));
        $password = trim($request->input('password', ''));

        if (!$username || !$password) {
            Response::error('Vui lòng nhập tên đăng nhập và mật khẩu', 422);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM users WHERE username = ? LIMIT 1");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        // 1. Fallback alias resolution: map friendly aliases (gv_10t1, ltbt_10t1, etc.)
        if (!$user) {
            $aliases = [
                'gv_10t1'     => ['gv_10_toan_a', 'gvcn_10ton1'],
                'ltbt_10t1'   => ['ltbt_10_toan_a'],
                'gvcn_10ton1' => ['gv_10_toan_a', 'gv_10t1'],
                'gvcn_10t1'   => ['gv_10_toan_a', 'gv_10t1'],
            ];
            if (isset($aliases[$username])) {
                foreach ($aliases[$username] as $altUser) {
                    $stmt->execute([$altUser]);
                    $user = $stmt->fetch();
                    if ($user) break;
                }
            }
        }

        // 2. Self-healing auto-provision for standard demo accounts if missing in database
        if (!$user && in_array($username, ['hocsinh', 'ltbt_10t1', 'gv_10t1'], true)) {
            try {
                $db->exec("ALTER TABLE `users` MODIFY COLUMN `role` ENUM('admin', 'dorm_manager', 'homeroom_teacher', 'class_cadre', 'student', 'room_leader', 'floor_leader', 'youth_union') NOT NULL DEFAULT 'student'");
            } catch (\Exception $e) {}

            $firstClassId = (int)($db->query("SELECT id FROM classes ORDER BY id ASC LIMIT 1")->fetchColumn() ?: 1);
            $hash = password_hash('password123', PASSWORD_BCRYPT);

            if ($username === 'hocsinh') {
                $db->prepare("INSERT INTO users (username, password_hash, full_name, email, phone, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)")
                   ->execute(['hocsinh', $hash, 'Học sinh THPT Chuyên Hùng Vương (Tài khoản xem)', 'hocsinh@hungvuong.edu.vn', '0988001122', 'student', 'active']);
            } elseif ($username === 'ltbt_10t1') {
                $db->prepare("INSERT INTO users (username, password_hash, full_name, email, phone, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)")
                   ->execute(['ltbt_10t1', $hash, 'Ban Cán Sự Lớp 10 Toán 1 (Lớp trưởng / Bí thư)', 'ltbt_10t1@hungvuong.edu.vn', '0981112233', 'class_cadre', 'active']);
            } elseif ($username === 'gv_10t1') {
                $db->prepare("INSERT INTO users (username, password_hash, full_name, email, phone, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)")
                   ->execute(['gv_10t1', $hash, 'Triệu Văn Dũng (GVCN 10 Toán 1)', 'gv_10t1@hungvuong.edu.vn', '0981012345', 'homeroom_teacher', 'active']);
            }

            $newId = (int)$db->lastInsertId();
            if ($newId > 0) {
                try {
                    $db->prepare("INSERT INTO user_scope_assignments (user_id, scope_type, scope_id) VALUES (?, 'class', ?)")
                       ->execute([$newId, $firstClassId]);
                } catch (\Exception $e) {}

                $stmt->execute([$username]);
                $user = $stmt->fetch();
            }
        }

        if (!$user || !password_verify($password, $user['password_hash'])) {
            Response::error('Tên đăng nhập hoặc mật khẩu không chính xác', 401);
            return;
        }

        if ($user['status'] !== 'active') {
            Response::error('Tài khoản của bạn đang bị khóa. Vui lòng liên hệ Quản trị viên.', 403);
            return;
        }

        // Fetch scopes with human-readable name
        $scopeStmt = $db->prepare("
            SELECT usa.scope_type, usa.scope_id,
                   CASE 
                       WHEN usa.scope_type = 'class' THEN (SELECT name FROM classes WHERE id = usa.scope_id)
                       WHEN usa.scope_type = 'room' THEN (SELECT code FROM dormitory_rooms WHERE id = usa.scope_id)
                       WHEN usa.scope_type = 'floor' THEN CONCAT('Tầng ', usa.scope_id)
                       ELSE NULL
                   END AS scope_name
            FROM user_scope_assignments usa 
            WHERE usa.user_id = ?
        ");
        $scopeStmt->execute([$user['id']]);
        $scopes = $scopeStmt->fetchAll();

        $tokenPayload = [
            'id' => (int)$user['id'],
            'username' => $user['username'],
            'full_name' => $user['full_name'],
            'role' => $user['role'],
            'email' => $user['email'],
            'scopes' => $scopes
        ];

        $token = Auth::createToken($tokenPayload, 86400 * 7); // 7 days

        // Record audit log
        $auditStmt = $db->prepare("INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, 'LOGIN', 'users', ?, 'Đăng nhập hệ thống thành công', ?)");
        $auditStmt->execute([$user['id'], $user['id'], $request->ip()]);

        Response::success([
            'token' => $token,
            'user' => [
                'id' => (int)$user['id'],
                'username' => $user['username'],
                'full_name' => $user['full_name'],
                'role' => $user['role'],
                'email' => $user['email'],
                'phone' => $user['phone'],
                'avatar_url' => $user['avatar_url'],
                'scopes' => $scopes
            ]
        ], 'Đăng nhập thành công');
    }

    public function me(Request $request): void {
        $currentUser = AuthMiddleware::$currentUser;
        if (!$currentUser) {
            Response::unauthorized();
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT id, username, full_name, email, phone, role, status, avatar_url FROM users WHERE id = ?");
        $stmt->execute([$currentUser['id']]);
        $user = $stmt->fetch();

        if (!$user) {
            Response::notFound('Người dùng không tồn tại');
            return;
        }

        $scopeStmt = $db->prepare("
            SELECT usa.scope_type, usa.scope_id,
                   CASE 
                       WHEN usa.scope_type = 'class' THEN (SELECT name FROM classes WHERE id = usa.scope_id)
                       WHEN usa.scope_type = 'room' THEN (SELECT code FROM dormitory_rooms WHERE id = usa.scope_id)
                       WHEN usa.scope_type = 'floor' THEN CONCAT('Tầng ', usa.scope_id)
                       ELSE NULL
                   END AS scope_name
            FROM user_scope_assignments usa 
            WHERE usa.user_id = ?
        ");
        $scopeStmt->execute([$user['id']]);
        $user['scopes'] = $scopeStmt->fetchAll();

        Response::success($user);
    }

    public function logout(Request $request): void {
        $currentUser = AuthMiddleware::$currentUser;
        if ($currentUser) {
            $db = Database::getConnection();
            $stmt = $db->prepare("INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, 'LOGOUT', 'users', ?, 'Đăng xuất khỏi hệ thống', ?)");
            $stmt->execute([$currentUser['id'], $currentUser['id'], $request->ip()]);
        }
        Response::success(null, 'Đăng xuất thành công');
    }

    public function changePassword(Request $request): void {
        $currentUser = AuthMiddleware::$currentUser;
        $currentPassword = $request->input('current_password', '');
        $newPassword = $request->input('new_password', '');

        if (strlen($newPassword) < 6) {
            Response::error('Mật khẩu mới phải có ít nhất 6 ký tự', 422);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT password_hash FROM users WHERE id = ?");
        $stmt->execute([$currentUser['id']]);
        $hash = $stmt->fetchColumn();

        if (!password_verify($currentPassword, $hash)) {
            Response::error('Mật khẩu hiện tại không chính xác', 400);
            return;
        }

        $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
        $updateStmt = $db->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
        $updateStmt->execute([$newHash, $currentUser['id']]);

        // Audit log
        $auditStmt = $db->prepare("INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, 'CHANGE_PASSWORD', 'users', ?, 'Đổi mật khẩu tài khoản', ?)");
        $auditStmt->execute([$currentUser['id'], $currentUser['id'], $request->ip()]);

        Response::success(null, 'Đổi mật khẩu thành công');
    }
}
