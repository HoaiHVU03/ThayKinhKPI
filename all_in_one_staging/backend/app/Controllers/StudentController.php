<?php
// backend/app/Controllers/StudentController.php

namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Middleware\AuthMiddleware;
use PDO;

class StudentController {
    public function index(Request $request): void {
        $db = Database::getConnection();
        $user = AuthMiddleware::$currentUser;

        $page = max(1, (int)$request->get('page', 1));
        $limit = max(1, min(100, (int)$request->get('limit', 20)));
        $offset = ($page - 1) * $limit;

        $search = trim($request->get('search', ''));
        $grade = $request->get('grade');
        $classId = $request->get('class_id');
        $gender = $request->get('gender');
        $isBoarding = $request->get('is_boarding');
        $roomId = $request->get('room_id');

        $where = ['1=1'];
        $params = [];

        // Role-based data scoping
        $isScopedTeacher = false;
        $isScopedRoom = false;
        $isScopedFloor = false;

        if ($user && in_array($user['role'], ['homeroom_teacher', 'class_cadre', 'student'])) {
            $classScope = AuthMiddleware::getUserScope('class');
            if ($classScope) {
                $where[] = "s.class_id = ?";
                $params[] = $classScope;
                $isScopedTeacher = true;
            }
        } elseif ($user && $user['role'] === 'room_leader') {
            $roomScope = AuthMiddleware::getUserScope('room');
            if ($roomScope) {
                $where[] = "s.dorm_room_id = ?";
                $params[] = $roomScope;
                $isScopedRoom = true;
            }
        } elseif ($user && $user['role'] === 'floor_leader') {
            $floorScope = AuthMiddleware::getUserScope('floor');
            if ($floorScope) {
                $where[] = "dr.floor_number = ?";
                $params[] = $floorScope;
                $isScopedFloor = true;
            }
        }

        if ($search !== '') {
            $where[] = "(s.full_name LIKE ? OR s.code LIKE ? OR s.hometown LIKE ? OR c.name LIKE ? OR c.code LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }
        if ($grade && !$isScopedTeacher) {
            $where[] = "c.grade_level = ?";
            $params[] = (int)$grade;
        }
        if ($classId && !$isScopedTeacher) {
            $where[] = "s.class_id = ?";
            $params[] = (int)$classId;
        }
        if ($gender) {
            $where[] = "s.gender = ?";
            $params[] = $gender;
        }
        if ($isBoarding !== null && $isBoarding !== '') {
            $where[] = "s.is_boarding = ?";
            $params[] = (int)$isBoarding;
        }
        if ($roomId && !$isScopedRoom) {
            $where[] = "s.dorm_room_id = ?";
            $params[] = (int)$roomId;
        }

        $whereClause = implode(' AND ', $where);

        // Count total
        $countSql = "SELECT COUNT(*) FROM students s 
                     JOIN classes c ON s.class_id = c.id 
                     LEFT JOIN dormitory_rooms dr ON s.dorm_room_id = dr.id 
                     WHERE $whereClause";
        $countStmt = $db->prepare($countSql);
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        // Query records
        $sql = "SELECT s.id, s.code, s.full_name, s.dob, s.gender, s.class_id, s.is_boarding, s.dorm_room_id,
                       s.parent_name, s.parent_phone, s.student_phone, s.id_card_number, s.hometown, s.status,
                       c.name AS class_name, c.grade_level, dr.code AS room_code, dr.floor_number,
                       sks.final_score, sks.classification
                FROM students s
                JOIN classes c ON s.class_id = c.id
                LEFT JOIN dormitory_rooms dr ON s.dorm_room_id = dr.id
                LEFT JOIN student_kpi_summaries sks ON s.id = sks.student_id
                WHERE $whereClause
                ORDER BY c.grade_level ASC, c.id ASC, s.full_name ASC
                LIMIT $limit OFFSET $offset";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $students = $stmt->fetchAll();

        // Mask sensitive data for unauthorized viewers
        $isAdminOrGVCN = $user && in_array($user['role'], ['admin', 'homeroom_teacher', 'dorm_manager']);
        foreach ($students as &$st) {
            if (!$isAdminOrGVCN && !empty($st['id_card_number'])) {
                $st['id_card_number'] = substr($st['id_card_number'], 0, 3) . '******' . substr($st['id_card_number'], -3);
            }
            if (!$isAdminOrGVCN && !empty($st['parent_phone'])) {
                $st['parent_phone'] = substr($st['parent_phone'], 0, 3) . '****' . substr($st['parent_phone'], -3);
            }
        }

        Response::success([
            'items' => $students,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'total_pages' => ceil($total / $limit)
        ]);
    }

    public function show(Request $request, string $id): void {
        $db = Database::getConnection();
        $stmt = $db->prepare("
            SELECT s.*, c.name AS class_name, c.grade_level, t.full_name AS teacher_name, t.phone AS teacher_phone,
                   dr.code AS room_code, dr.floor_number, dr.capacity AS room_capacity,
                   sks.baseline_score, sks.total_deducted, sks.final_score, sks.classification
            FROM students s
            JOIN classes c ON s.class_id = c.id
            LEFT JOIN teachers t ON c.homeroom_teacher_id = t.id
            LEFT JOIN dormitory_rooms dr ON s.dorm_room_id = dr.id
            LEFT JOIN student_kpi_summaries sks ON s.id = sks.student_id
            WHERE s.id = ?
        ");
        $stmt->execute([(int)$id]);
        $student = $stmt->fetch();

        if (!$student) {
            Response::notFound('Không tìm thấy hồ sơ học sinh');
            return;
        }

        // Scope validation
        if ($user && in_array($user['role'], ['homeroom_teacher', 'class_cadre', 'student'])) {
            $classScope = AuthMiddleware::getUserScope('class');
            if ($classScope && (int)$student['class_id'] !== $classScope) {
                Response::forbidden('Bạn chỉ có quyền xem hồ sơ học sinh thuộc lớp của mình');
                return;
            }
        } elseif ($user && $user['role'] === 'room_leader') {
            $roomScope = AuthMiddleware::getUserScope('room');
            if ($roomScope && (int)$student['dorm_room_id'] !== $roomScope) {
                Response::forbidden('Bạn chỉ có quyền xem học sinh thuộc phòng KTX của mình');
                return;
            }
        } elseif ($user && $user['role'] === 'floor_leader') {
            $floorScope = AuthMiddleware::getUserScope('floor');
            if ($floorScope && (int)$student['floor_number'] !== $floorScope) {
                Response::forbidden('Bạn chỉ có quyền xem học sinh thuộc tầng KTX của mình');
                return;
            }
        }

        // Violations history
        $vStmt = $db->prepare("
            SELECT v.*, r.code AS rule_code, r.name AS rule_name
            FROM violation_records v
            JOIN kpi_rules r ON v.rule_id = r.id
            WHERE v.student_id = ?
            ORDER BY v.violation_date DESC
        ");
        $vStmt->execute([(int)$id]);
        $student['violations'] = $vStmt->fetchAll();

        // Leave requests history
        $lStmt = $db->prepare("
            SELECT * FROM leave_requests WHERE student_id = ? ORDER BY created_at DESC LIMIT 10
        ");
        $lStmt->execute([(int)$id]);
        $student['leaves'] = $lStmt->fetchAll();

        Response::success($student);
    }

    public function store(Request $request): void {
        if (!AuthMiddleware::requireAdmin('Chỉ Quản trị viên mới có quyền thêm hồ sơ học sinh')) {
            return;
        }

        $db = Database::getConnection();
        $code = trim($request->input('code', ''));
        $fullName = trim($request->input('full_name', ''));
        $dob = $request->input('dob', '2010-01-01');
        $gender = $request->input('gender', 'Nam');
        $classId = (int)$request->input('class_id');
        $isBoarding = (int)$request->input('is_boarding', 0);
        $dormRoomId = $request->input('dorm_room_id') ? (int)$request->input('dorm_room_id') : null;
        $parentName = trim($request->input('parent_name', ''));
        $parentPhone = trim($request->input('parent_phone', ''));
        $studentPhone = trim($request->input('student_phone', ''));
        $idCardNumber = trim($request->input('id_card_number', ''));
        $hometown = trim($request->input('hometown', ''));

        if (!$code || !$fullName || !$classId) {
            Response::error('Mã học sinh, họ tên và lớp là các trường bắt buộc', 422);
            return;
        }

        // Check duplicate code
        $dupStmt = $db->prepare("SELECT id FROM students WHERE code = ?");
        $dupStmt->execute([$code]);
        if ($dupStmt->fetch()) {
            Response::error("Mã học sinh '$code' đã tồn tại trong hệ thống", 409);
            return;
        }

        $stmt = $db->prepare("
            INSERT INTO students (code, full_name, dob, gender, class_id, is_boarding, dorm_room_id, parent_name, parent_phone, student_phone, id_card_number, hometown, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'studying')
        ");
        $stmt->execute([$code, $fullName, $dob, $gender, $classId, $isBoarding, $dormRoomId, $parentName, $parentPhone, $studentPhone, $idCardNumber, $hometown]);
        $studentId = $db->lastInsertId();

        // Initialize KPI summary
        $db->prepare("INSERT INTO student_kpi_summaries (student_id, period_id, baseline_score, total_deducted, final_score, classification) VALUES (?, 1, 100, 0, 100, 'Xuất sắc')")->execute([$studentId]);

        // Update class count
        $db->prepare("UPDATE classes SET total_students = total_students + 1 WHERE id = ?")->execute([$classId]);
        if ($isBoarding) {
            $db->prepare("UPDATE classes SET boarding_students = boarding_students + 1 WHERE id = ?")->execute([$classId]);
            if ($dormRoomId) {
                $db->prepare("UPDATE dormitory_rooms SET current_occupancy = current_occupancy + 1 WHERE id = ?")->execute([$dormRoomId]);
            }
        }

        Response::success(['id' => $studentId], 'Thêm hồ sơ học sinh thành công', 201);
    }

    public function update(Request $request, string $id): void {
        if (!AuthMiddleware::requireAdmin('Chỉ Quản trị viên mới có quyền cập nhật hồ sơ học sinh')) {
            return;
        }

        $db = Database::getConnection();
        $fullName = trim($request->input('full_name', ''));
        $dob = $request->input('dob');
        $gender = $request->input('gender');
        $classId = (int)$request->input('class_id');
        $isBoarding = (int)$request->input('is_boarding', 0);
        $dormRoomId = $request->input('dorm_room_id') ? (int)$request->input('dorm_room_id') : null;
        $parentName = trim($request->input('parent_name', ''));
        $parentPhone = trim($request->input('parent_phone', ''));
        $studentPhone = trim($request->input('student_phone', ''));
        $idCardNumber = trim($request->input('id_card_number', ''));
        $hometown = trim($request->input('hometown', ''));
        $status = $request->input('status', 'studying');

        $stmt = $db->prepare("
            UPDATE students SET full_name = ?, dob = ?, gender = ?, class_id = ?, is_boarding = ?, dorm_room_id = ?,
                                parent_name = ?, parent_phone = ?, student_phone = ?, id_card_number = ?, hometown = ?, status = ?
            WHERE id = ?
        ");
        $stmt->execute([$fullName, $dob, $gender, $classId, $isBoarding, $dormRoomId, $parentName, $parentPhone, $studentPhone, $idCardNumber, $hometown, $status, (int)$id]);

        Response::success(null, 'Cập nhật hồ sơ học sinh thành công');
    }

    public function import(Request $request): void {
        if (!AuthMiddleware::requireAdmin('Chỉ Quản trị viên mới có quyền nhập dữ liệu học sinh từ Excel')) {
            return;
        }

        $db = Database::getConnection();
        $items = $request->input('items', []);

        if (empty($items) || !is_array($items)) {
            Response::error('Dữ liệu nhập trống hoặc sai cấu trúc', 422);
            return;
        }

        $successCount = 0;
        $errors = [];

        // Preload classes map
        $classes = $db->query("SELECT id, code, name FROM classes")->fetchAll();
        $classMap = [];
        foreach ($classes as $c) {
            $classMap[strtolower($c['code'])] = $c['id'];
            $classMap[strtolower($c['name'])] = $c['id'];
        }

        $db->beginTransaction();
        try {
            foreach ($items as $idx => $row) {
                $line = $idx + 1;
                $code = trim($row['code'] ?? '');
                $name = trim($row['full_name'] ?? '');
                $className = strtolower(trim($row['class'] ?? ''));

                if (!$code || !$name || !$className) {
                    $errors[] = "Dòng $line: Thiếu thông tin bắt buộc (Mã HS, Họ tên hoặc Lớp)";
                    continue;
                }

                // Check class exists
                if (!isset($classMap[$className])) {
                    $errors[] = "Dòng $line: Lớp '$className' không tồn tại trong danh mục 54 lớp chuyên";
                    continue;
                }
                $cId = $classMap[$className];

                // Check duplicate code
                $chk = $db->prepare("SELECT id FROM students WHERE code = ?");
                $chk->execute([$code]);
                if ($chk->fetch()) {
                    $errors[] = "Dòng $line: Mã học sinh '$code' đã tồn tại";
                    continue;
                }

                $gender = trim($row['gender'] ?? 'Nam');
                $dob = trim($row['dob'] ?? '2010-01-01');
                if (preg_match('/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/', $dob, $m)) {
                    $dob = sprintf('%04d-%02d-%02d', $m[3], $m[2], $m[1]);
                }
                
                $rawBoarding = mb_strtolower(trim((string)($row['is_boarding'] ?? '')));
                $isBoarding = (in_array($rawBoarding, ['1', 'có', 'co', 'nội trú', 'noi tru', 'nt', 'true', 'x'])) ? 1 : 0;
                $pName = trim($row['parent_name'] ?? '');
                $pPhone = trim($row['parent_phone'] ?? '');
                $sPhone = trim($row['student_phone'] ?? '');
                $hometown = trim($row['hometown'] ?? '');

                $insert = $db->prepare("INSERT INTO students (code, full_name, dob, gender, class_id, is_boarding, parent_name, parent_phone, student_phone, hometown, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'studying')");
                $insert->execute([$code, $name, $dob, $gender, $cId, $isBoarding, $pName, $pPhone, $sPhone, $hometown]);
                $sId = $db->lastInsertId();

                $db->prepare("INSERT INTO student_kpi_summaries (student_id, period_id, baseline_score, total_deducted, final_score, classification) VALUES (?, 1, 100, 0, 100, 'Xuất sắc')")->execute([$sId]);
                $successCount++;
            }

            $db->commit();
        } catch (\Exception $e) {
            $db->rollBack();
            Response::error('Lỗi nhập dữ liệu: ' . $e->getMessage(), 500);
            return;
        }

        Response::success([
            'success_count' => $successCount,
            'failed_count' => count($errors),
            'errors' => $errors
        ], "Đã nhập thành công $successCount bản ghi. " . (count($errors) > 0 ? count($errors) . ' bản ghi lỗi.' : ''));
    }

    public function export(Request $request): void {
        $db = Database::getConnection();
        $classId = $request->get('class_id');
        $grade = $request->get('grade');

        $where = ['1=1'];
        $params = [];
        if ($classId) {
            $where[] = "s.class_id = ?";
            $params[] = (int)$classId;
        }
        if ($grade) {
            $where[] = "c.grade_level = ?";
            $params[] = (int)$grade;
        }

        $sql = "SELECT s.code, s.full_name, s.dob, s.gender, c.name AS class_name, 
                       CASE WHEN s.is_boarding = 1 THEN 'Nội trú' ELSE 'Ngoại trú' END AS boarding_status,
                       dr.code AS room_code, s.hometown,
                       sks.baseline_score, sks.total_deducted, sks.final_score, sks.classification
                FROM students s
                JOIN classes c ON s.class_id = c.id
                LEFT JOIN dormitory_rooms dr ON s.dorm_room_id = dr.id
                LEFT JOIN student_kpi_summaries sks ON s.id = sks.student_id
                WHERE " . implode(' AND ', $where) . "
                ORDER BY c.grade_level ASC, c.id ASC, s.full_name ASC";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $data = $stmt->fetchAll();

        // Output CSV with UTF-8 BOM
        header('Content-Type: text/csv; charset=UTF-8');
        header('Content-Disposition: attachment; filename="Danh_sach_hoc_sinh_KPI_' . date('Ymd_His') . '.csv"');
        echo "\xEF\xBB\xBF"; // UTF-8 BOM
        $out = fopen('php://output', 'w');

        fputcsv($out, ['Mã HS', 'Họ và tên', 'Ngày sinh', 'Giới tính', 'Lớp', 'Hình thức', 'Phòng KTX', 'Quê quán', 'Điểm gốc', 'Điểm trừ', 'Điểm KPI', 'Xếp loại']);

        foreach ($data as $r) {
            fputcsv($out, [
                $r['code'], $r['full_name'], $r['dob'], $r['gender'], $r['class_name'],
                $r['boarding_status'], $r['room_code'] ?? '—', $r['hometown'],
                $r['baseline_score'] ?? 100, $r['total_deducted'] ?? 0, $r['final_score'] ?? 100, $r['classification'] ?? 'Xuất sắc'
            ]);
        }
        fclose($out);
        exit;
    }

    public function destroy(Request $request, string $id): void {
        if (!AuthMiddleware::requireAdmin()) {
            return;
        }

        $db = Database::getConnection();
        $user = AuthMiddleware::$currentUser;

        $stmt = $db->prepare("SELECT * FROM students WHERE id = ?");
        $stmt->execute([(int)$id]);
        $student = $stmt->fetch();

        if (!$student) {
            Response::notFound('Học sinh không tồn tại');
            return;
        }

        $db->beginTransaction();
        try {
            // Adjust class counts
            $db->prepare("UPDATE classes SET total_students = GREATEST(0, total_students - 1) WHERE id = ?")->execute([$student['class_id']]);
            if ($student['is_boarding']) {
                $db->prepare("UPDATE classes SET boarding_students = GREATEST(0, boarding_students - 1) WHERE id = ?")->execute([$student['class_id']]);
                if ($student['dorm_room_id']) {
                    $db->prepare("UPDATE dormitory_rooms SET current_occupancy = GREATEST(0, current_occupancy - 1) WHERE id = ?")->execute([$student['dorm_room_id']]);
                }
            }

            // Delete student
            $del = $db->prepare("DELETE FROM students WHERE id = ?");
            $del->execute([(int)$id]);

            // Audit log
            $db->prepare("INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, 'DELETE_STUDENT', 'students', ?, ?)")
                ->execute([$user['id'] ?? 1, (int)$id, "Xóa hồ sơ học sinh: {$student['full_name']} ({$student['code']})"]);

            $db->commit();
        } catch (\Exception $e) {
            $db->rollBack();
            Response::error('Lỗi khi xóa học sinh: ' . $e->getMessage(), 500);
            return;
        }

        Response::success(null, 'Đã xóa hồ sơ học sinh thành công');
    }
}

