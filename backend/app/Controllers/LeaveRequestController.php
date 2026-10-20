<?php
// backend/app/Controllers/LeaveRequestController.php

namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Middleware\AuthMiddleware;
use PDO;

class LeaveRequestController {
    public function index(Request $request): void {
        $db = Database::getConnection();
        $status = $request->get('status');
        $studentId = $request->get('student_id');
        $type = $request->get('request_type');
        $date = $request->get('date');
        $search = trim($request->get('search', ''));
        $sort = $request->get('sort', 'newest'); // 'newest' (default), 'oldest', 'start_desc', 'start_asc'

        $where = ['1=1'];
        $params = [];

        // Role-based scoping
        $user = AuthMiddleware::$currentUser;
        if ($user && $user['role'] === 'homeroom_teacher') {
            $classScope = AuthMiddleware::getUserScope('class');
            if ($classScope) {
                $where[] = "s.class_id = ?";
                $params[] = $classScope;
            }
        } elseif ($user && $user['role'] === 'room_leader') {
            $roomScope = AuthMiddleware::getUserScope('room');
            if ($roomScope) {
                $where[] = "s.dorm_room_id = ?";
                $params[] = $roomScope;
            }
        } elseif ($user && $user['role'] === 'floor_leader') {
            $floorScope = AuthMiddleware::getUserScope('floor');
            if ($floorScope) {
                $where[] = "dr.floor_number = ?";
                $params[] = $floorScope;
            }
        }

        if ($status) {
            $where[] = "lr.status = ?";
            $params[] = $status;
        }
        if ($studentId) {
            $where[] = "lr.student_id = ?";
            $params[] = (int)$studentId;
        }
        if ($type) {
            $where[] = "lr.request_type = ?";
            $params[] = $type;
        }
        if (!empty($date)) {
            $where[] = "(DATE(lr.start_time) = ? OR DATE(lr.created_at) = ? OR (? BETWEEN DATE(lr.start_time) AND DATE(lr.expected_end_time)))";
            $params[] = $date;
            $params[] = $date;
            $params[] = $date;
        }
        if ($search !== '') {
            $where[] = "(lr.code LIKE ? OR s.code LIKE ? OR s.full_name LIKE ? OR lr.reason LIKE ? OR c.name LIKE ? OR dr.code LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        // Determine ordering: Default to newest first (highest ID and latest created_at)
        $orderBy = "lr.id DESC, lr.created_at DESC";
        if ($sort === 'oldest') {
            $orderBy = "lr.id ASC, lr.created_at ASC";
        } elseif ($sort === 'start_desc') {
            $orderBy = "lr.start_time DESC, lr.id DESC";
        } elseif ($sort === 'start_asc') {
            $orderBy = "lr.start_time ASC, lr.id ASC";
        }

        $sql = "
            SELECT lr.*, s.code AS student_code, s.full_name AS student_name, s.student_phone,
                   c.name AS class_name, dr.code AS room_code, dr.floor_number,
                   u.full_name AS approver_name
            FROM leave_requests lr
            JOIN students s ON lr.student_id = s.id
            JOIN classes c ON s.class_id = c.id
            LEFT JOIN dormitory_rooms dr ON s.dorm_room_id = dr.id
            LEFT JOIN users u ON lr.approved_by_user_id = u.id
            WHERE " . implode(' AND ', $where) . "
            ORDER BY $orderBy
            LIMIT 150
        ";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $items = $stmt->fetchAll();

        // Calculate auto overdue status if expected return is past current time and not checked in
        $now = date('Y-m-d H:i:s');
        foreach ($items as &$item) {
            if ($item['status'] === 'approved' && $item['expected_end_time'] < $now && empty($item['actual_return_time'])) {
                $item['is_overdue'] = true;
            } else {
                $item['is_overdue'] = false;
            }
        }

        Response::success($items);
    }

    public function create(Request $request): void {
        $db = Database::getConnection();
        $studentId = (int)$request->input('student_id');
        $requestType = $request->input('request_type', 'home');
        $reason = trim($request->input('reason', ''));
        $startTime = $request->input('start_time');
        $expectedEndTime = $request->input('expected_end_time');
        $contactPhone = trim($request->input('contact_phone', ''));
        $parentConfirmation = (int)$request->input('parent_confirmation', 1);

        if (!$studentId || !$reason || !$startTime || !$expectedEndTime) {
            Response::error('Vui lòng điền đầy đủ học sinh, lý do và thời gian xin phép', 422);
            return;
        }

        $code = 'NP-' . date('Y') . '-' . sprintf("%04d", rand(1000, 9999));

        $stmt = $db->prepare("
            INSERT INTO leave_requests (code, student_id, request_type, reason, start_time, expected_end_time, parent_confirmation, contact_phone, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        ");
        $stmt->execute([$code, $studentId, $requestType, $reason, $startTime, $expectedEndTime, $parentConfirmation, $contactPhone]);

        Response::success(['code' => $code], 'Nộp đơn xin phép thành công. Đang chờ Quản sinh xét duyệt.', 201);
    }

    public function approve(Request $request, string $id): void {
        $db = Database::getConnection();
        $user = AuthMiddleware::$currentUser;
        $notes = trim($request->input('approval_notes', 'Đã liên hệ xác nhận phụ huynh'));

        if (!in_array($user['role'] ?? '', ['admin', 'dorm_manager', 'homeroom_teacher'])) {
            Response::forbidden('Bạn không có quyền phê duyệt đơn xin phép');
            return;
        }

        if ($user['role'] === 'homeroom_teacher') {
            $classScope = AuthMiddleware::getUserScope('class');
            $stClassId = (int)$db->query("SELECT s.class_id FROM leave_requests lr JOIN students s ON lr.student_id = s.id WHERE lr.id = " . (int)$id)->fetchColumn();
            if (!$classScope || $stClassId !== $classScope) {
                Response::forbidden('Bạn chỉ có quyền phê duyệt đơn cho học sinh thuộc lớp của mình');
                return;
            }
        }

        $stmt = $db->prepare("
            UPDATE leave_requests 
            SET status = 'approved', approved_by_user_id = ?, approved_at = NOW(), approval_notes = ?
            WHERE id = ?
        ");
        $stmt->execute([$user['id'] ?? null, $notes, (int)$id]);

        Response::success(null, 'Phê duyệt đơn xin phép thành công');
    }

    public function reject(Request $request, string $id): void {
        $db = Database::getConnection();
        $user = AuthMiddleware::$currentUser;
        $notes = trim($request->input('approval_notes', 'Không đủ điều kiện cho phép'));

        if (!in_array($user['role'] ?? '', ['admin', 'dorm_manager', 'homeroom_teacher'])) {
            Response::forbidden('Bạn không có quyền từ chối đơn xin phép');
            return;
        }

        if ($user['role'] === 'homeroom_teacher') {
            $classScope = AuthMiddleware::getUserScope('class');
            $stClassId = (int)$db->query("SELECT s.class_id FROM leave_requests lr JOIN students s ON lr.student_id = s.id WHERE lr.id = " . (int)$id)->fetchColumn();
            if (!$classScope || $stClassId !== $classScope) {
                Response::forbidden('Bạn chỉ có quyền từ chối đơn cho học sinh thuộc lớp của mình');
                return;
            }
        }

        $stmt = $db->prepare("
            UPDATE leave_requests 
            SET status = 'rejected', approved_by_user_id = ?, approved_at = NOW(), approval_notes = ?
            WHERE id = ?
        ");
        $stmt->execute([$user['id'] ?? null, $notes, (int)$id]);

        Response::success(null, 'Đã từ chối đơn xin phép');
    }

    public function checkin(Request $request, string $id): void {
        $db = Database::getConnection();
        $actualTime = $request->input('actual_return_time', date('Y-m-d H:i:s'));

        $stmt = $db->prepare("
            UPDATE leave_requests 
            SET status = 'completed', actual_return_time = ?
            WHERE id = ?
        ");
        $stmt->execute([$actualTime, (int)$id]);

        Response::success(null, 'Đã xác nhận học sinh trở về KTX an toàn');
    }

    public function update(Request $request, string $id): void {
        $db = Database::getConnection();
        $reason = trim($request->input('reason', ''));
        $requestType = $request->input('request_type');
        $startTime = $request->input('start_time');
        $expectedEndTime = $request->input('expected_end_time');
        $contactPhone = trim($request->input('contact_phone', ''));
        $parentConfirmation = (int)$request->input('parent_confirmation', 1);
        $status = $request->input('status');

        $lr = $db->query("SELECT * FROM leave_requests WHERE id = " . (int)$id)->fetch();
        if (!$lr) {
            Response::notFound('Đơn xin phép không tồn tại');
            return;
        }

        $stmt = $db->prepare("
            UPDATE leave_requests 
            SET reason = ?, request_type = ?, start_time = ?, expected_end_time = ?, contact_phone = ?, parent_confirmation = ?, status = ?
            WHERE id = ?
        ");
        $stmt->execute([
            $reason ?: $lr['reason'],
            $requestType ?: $lr['request_type'],
            $startTime ?: $lr['start_time'],
            $expectedEndTime ?: $lr['expected_end_time'],
            $contactPhone ?: $lr['contact_phone'],
            $parentConfirmation,
            $status ?: $lr['status'],
            (int)$id
        ]);

        Response::success(null, 'Cập nhật đơn xin phép thành công');
    }

    public function destroy(Request $request, string $id): void {
        $db = Database::getConnection();
        $stmt = $db->prepare("DELETE FROM leave_requests WHERE id = ?");
        $stmt->execute([(int)$id]);

        Response::success(null, 'Đã hủy và xóa đơn xin phép thành công');
    }

    public function ticker(Request $request): void {
        $db = Database::getConnection();
        
        // Count pending
        $countPending = (int)$db->query("SELECT COUNT(*) FROM leave_requests WHERE status = 'pending'")->fetchColumn();
        
        // Latest pending requests (up to 15)
        $sql = "
            SELECT lr.id, lr.code, lr.student_id, lr.request_type, lr.reason, 
                   lr.start_time, lr.expected_end_time, lr.contact_phone, lr.parent_confirmation,
                   lr.status, lr.created_at,
                   s.code AS student_code, s.full_name AS student_name, s.student_phone, s.parent_phone,
                   c.name AS class_name, dr.code AS room_code, dr.floor_number
            FROM leave_requests lr
            JOIN students s ON lr.student_id = s.id
            JOIN classes c ON s.class_id = c.id
            LEFT JOIN dormitory_rooms dr ON s.dorm_room_id = dr.id
            WHERE lr.status = 'pending'
            ORDER BY lr.id DESC, lr.created_at DESC
            LIMIT 15
        ";
        $stmt = $db->query($sql);
        $pendingItems = $stmt->fetchAll();

        // Also get latest 5 recently active if needed
        $recentSql = "
            SELECT lr.id, lr.code, lr.student_id, lr.request_type, lr.reason, 
                   lr.start_time, lr.expected_end_time, lr.contact_phone, lr.status, lr.created_at,
                   s.code AS student_code, s.full_name AS student_name,
                   c.name AS class_name, dr.code AS room_code
            FROM leave_requests lr
            JOIN students s ON lr.student_id = s.id
            JOIN classes c ON s.class_id = c.id
            LEFT JOIN dormitory_rooms dr ON s.dorm_room_id = dr.id
            ORDER BY lr.id DESC
            LIMIT 5
        ";
        $recentItems = $db->query($recentSql)->fetchAll();

        Response::success([
            'pending_count' => $countPending,
            'pending' => $pendingItems,
            'recent' => $recentItems,
            'latest_id' => !empty($pendingItems) ? (int)$pendingItems[0]['id'] : (!empty($recentItems) ? (int)$recentItems[0]['id'] : 0),
            'server_time' => date('Y-m-d H:i:s')
        ]);
    }

    public function publicStudentSearch(Request $request): void {
        $db = Database::getConnection();
        $q = trim($request->get('q', ''));
        if (mb_strlen($q) < 2) {
            Response::success([]);
            return;
        }

        $stmt = $db->prepare("
            SELECT s.id, s.code, s.full_name, s.dob, s.student_phone, s.parent_phone,
                   c.name AS class_name, dr.code AS room_code
            FROM students s
            JOIN classes c ON s.class_id = c.id
            LEFT JOIN dormitory_rooms dr ON s.dorm_room_id = dr.id
            WHERE s.status = 'studying' AND (s.code LIKE ? OR s.full_name LIKE ? OR s.student_phone LIKE ?)
            LIMIT 8
        ");
        $term = "%$q%";
        $stmt->execute([$term, $term, $term]);
        Response::success($stmt->fetchAll());
    }

    public function publicCreate(Request $request): void {
        $db = Database::getConnection();
        $studentId = (int)$request->input('student_id');
        $requestType = $request->input('request_type', 'home');
        $reason = trim($request->input('reason', ''));
        $startTime = $request->input('start_time');
        $expectedEndTime = $request->input('expected_end_time');
        $contactPhone = trim($request->input('contact_phone', ''));
        $parentConfirmation = (int)$request->input('parent_confirmation', 1);

        if (!$studentId || !$reason || !$startTime || !$expectedEndTime) {
            Response::error('Vui lòng điền đầy đủ học sinh, lý do và thời gian xin phép', 422);
            return;
        }

        // Verify student exists
        $st = $db->prepare("SELECT id, code, full_name, parent_phone FROM students WHERE id = ?");
        $st->execute([$studentId]);
        $student = $st->fetch();
        if (!$student) {
            Response::error('Không tìm thấy thông tin học sinh', 404);
            return;
        }

        if (empty($contactPhone)) {
            $contactPhone = $student['parent_phone'] ?: '0987654321';
        }

        $code = 'NP-' . date('Y') . '-' . sprintf("%04d", rand(1000, 9999));

        $stmt = $db->prepare("
            INSERT INTO leave_requests (code, student_id, request_type, reason, start_time, expected_end_time, parent_confirmation, contact_phone, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        ");
        $stmt->execute([$code, $studentId, $requestType, $reason, $startTime, $expectedEndTime, $parentConfirmation, $contactPhone]);

        Response::success([
            'code' => $code,
            'student_name' => $student['full_name'],
            'student_code' => $student['code'],
            'created_at' => date('Y-m-d H:i:s')
        ], 'Nộp đơn xin phép KTX thành công! Ban Quản sinh và Thầy Cô đã nhận được thông báo.', 201);
    }
}

