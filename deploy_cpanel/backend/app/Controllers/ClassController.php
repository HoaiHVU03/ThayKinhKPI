<?php
// backend/app/Controllers/ClassController.php

namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Middleware\AuthMiddleware;
use PDO;

class ClassController {
    public function index(Request $request): void {
        $db = Database::getConnection();
        $user = AuthMiddleware::$currentUser;
        $grade = $request->get('grade');

        $where = ['1=1'];
        $params = [];

        // Role-based scoping
        if ($user && $user['role'] === 'homeroom_teacher') {
            $classScope = AuthMiddleware::getUserScope('class');
            if ($classScope) {
                $where[] = "c.id = ?";
                $params[] = $classScope;
            }
        } elseif ($user && in_array($user['role'], ['room_leader', 'floor_leader'])) {
            // Dormitory leaders only manage dorms, return classes where their room students are
            $roomScope = AuthMiddleware::getUserScope('room');
            $floorScope = AuthMiddleware::getUserScope('floor');
            if ($roomScope) {
                $where[] = "c.id IN (SELECT DISTINCT class_id FROM students WHERE dorm_room_id = ?)";
                $params[] = $roomScope;
            } elseif ($floorScope) {
                $where[] = "c.id IN (SELECT DISTINCT s.class_id FROM students s JOIN dormitory_rooms dr ON s.dorm_room_id = dr.id WHERE dr.floor_number = ?)";
                $params[] = $floorScope;
            }
        }

        if ($grade) {
            $where[] = "c.grade_level = ?";
            $params[] = (int)$grade;
        }

        $sql = "
            SELECT c.id, c.code, c.name, c.grade_level, c.total_students, c.boarding_students, c.room_location,
                   t.id AS teacher_id, t.full_name AS teacher_name, t.phone AS teacher_phone,
                   ROUND(COALESCE(AVG(sks.final_score), 100.0), 1) AS avg_kpi,
                   COUNT(DISTINCT v.id) AS violation_count
            FROM classes c
            LEFT JOIN teachers t ON c.homeroom_teacher_id = t.id
            LEFT JOIN students s ON c.id = s.class_id
            LEFT JOIN student_kpi_summaries sks ON s.id = sks.student_id
            LEFT JOIN violation_records v ON s.id = v.student_id AND v.status = 'approved'
            WHERE " . implode(' AND ', $where) . "
            GROUP BY c.id
            ORDER BY c.grade_level ASC, c.id ASC
        ";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $classes = $stmt->fetchAll();

        Response::success($classes);
    }

    public function show(Request $request, string $id): void {
        $user = AuthMiddleware::$currentUser;
        if ($user && $user['role'] === 'homeroom_teacher') {
            $classScope = AuthMiddleware::getUserScope('class');
            if ($classScope && (int)$id !== $classScope) {
                Response::forbidden('Bạn chỉ có quyền xem thông tin của lớp mình phụ trách');
                return;
            }
        } elseif ($user && in_array($user['role'], ['room_leader', 'floor_leader'])) {
            Response::forbidden('Tài khoản quản lý KTX không có quyền quản lý danh sách lớp học');
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare("
            SELECT c.*, t.full_name AS teacher_name, t.phone AS teacher_phone, t.email AS teacher_email,
                   ROUND(COALESCE(AVG(sks.final_score), 100.0), 1) AS avg_kpi
            FROM classes c
            LEFT JOIN teachers t ON c.homeroom_teacher_id = t.id
            LEFT JOIN students s ON c.id = s.class_id
            LEFT JOIN student_kpi_summaries sks ON s.id = sks.student_id
            WHERE c.id = ?
            GROUP BY c.id
        ");
        $stmt->execute([(int)$id]);
        $class = $stmt->fetch();

        if (!$class) {
            Response::notFound('Không tìm thấy lớp học');
            return;
        }

        Response::success($class);
    }

    public function students(Request $request, string $id): void {
        $user = AuthMiddleware::$currentUser;
        if ($user && $user['role'] === 'homeroom_teacher') {
            $classScope = AuthMiddleware::getUserScope('class');
            if ($classScope && (int)$id !== $classScope) {
                Response::forbidden('Bạn chỉ có quyền xem học sinh của lớp mình phụ trách');
                return;
            }
        } elseif ($user && in_array($user['role'], ['room_leader', 'floor_leader'])) {
            Response::forbidden('Tài khoản quản lý KTX không có quyền quản lý danh sách lớp học');
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare("
            SELECT s.id, s.code, s.full_name, s.dob, s.gender, s.is_boarding,
                   dr.code AS room_code, s.parent_name, s.parent_phone, s.student_phone, s.hometown,
                   sks.baseline_score, sks.total_deducted, sks.final_score, sks.classification,
                   COALESCE(vc.violation_count, 0) AS violation_count
            FROM students s
            LEFT JOIN dormitory_rooms dr ON s.dorm_room_id = dr.id
            LEFT JOIN student_kpi_summaries sks ON s.id = sks.student_id
            LEFT JOIN (
                SELECT student_id, COUNT(*) AS violation_count
                FROM violation_records
                WHERE status = 'approved'
                GROUP BY student_id
            ) vc ON s.id = vc.student_id
            WHERE s.class_id = ?
            ORDER BY s.full_name ASC
        ");
        $stmt->execute([(int)$id]);
        $students = $stmt->fetchAll();

        Response::success($students);
    }

    public function store(Request $request): void {
        if (!AuthMiddleware::requireAdmin()) {
            return;
        }

        $db = Database::getConnection();
        $code = trim($request->input('code', ''));
        $name = trim($request->input('name', ''));
        $gradeLevel = (int)$request->input('grade_level', 10);
        $teacherId = $request->input('homeroom_teacher_id') ? (int)$request->input('homeroom_teacher_id') : null;
        $roomLocation = trim($request->input('room_location', ''));

        if (!$code || !$name) {
            Response::error('Mã lớp và tên lớp là bắt buộc', 422);
            return;
        }

        $chk = $db->prepare("SELECT id FROM classes WHERE code = ?");
        $chk->execute([$code]);
        if ($chk->fetch()) {
            Response::error("Mã lớp '$code' đã tồn tại", 409);
            return;
        }

        $stmt = $db->prepare("INSERT INTO classes (code, name, grade_level, academic_year_id, homeroom_teacher_id, room_location) VALUES (?, ?, ?, 1, ?, ?)");
        $stmt->execute([$code, $name, $gradeLevel, $teacherId, $roomLocation]);

        Response::success(['id' => $db->lastInsertId()], 'Tạo lớp chuyên mới thành công', 201);
    }

    public function update(Request $request, string $id): void {
        if (!AuthMiddleware::requireAdmin()) {
            return;
        }

        $db = Database::getConnection();
        $name = trim($request->input('name', ''));
        $gradeLevel = (int)$request->input('grade_level', 10);
        $teacherId = $request->input('homeroom_teacher_id') ? (int)$request->input('homeroom_teacher_id') : null;
        $roomLocation = trim($request->input('room_location', ''));

        $stmt = $db->prepare("UPDATE classes SET name = ?, grade_level = ?, homeroom_teacher_id = ?, room_location = ? WHERE id = ?");
        $stmt->execute([$name, $gradeLevel, $teacherId, $roomLocation, (int)$id]);

        Response::success(null, 'Cập nhật thông tin lớp thành công');
    }

    public function destroy(Request $request, string $id): void {
        if (!AuthMiddleware::requireAdmin()) {
            return;
        }

        $db = Database::getConnection();

        // Check if has students
        $count = (int)$db->query("SELECT COUNT(*) FROM students WHERE class_id = " . (int)$id)->fetchColumn();
        if ($count > 0) {
            Response::error("Không thể xóa lớp này vì đang có $count học sinh. Hãy chuyển học sinh sang lớp khác trước.", 400);
            return;
        }

        $stmt = $db->prepare("DELETE FROM classes WHERE id = ?");
        $stmt->execute([(int)$id]);

        Response::success(null, 'Đã xóa lớp chuyên thành công');
    }

    public function import(Request $request): void {
        if (!AuthMiddleware::requireAdmin()) {
            return;
        }

        $db = Database::getConnection();
        $items = $request->input('items', $request->input('classes', []));

        if (empty($items) || !is_array($items)) {
            Response::error('Dữ liệu nhập trống hoặc sai cấu trúc', 422);
            return;
        }

        $teachers = $db->query("SELECT id, full_name, phone FROM teachers")->fetchAll();
        $teacherMap = [];
        foreach ($teachers as $t) {
            $teacherMap[mb_strtolower(trim($t['full_name']))] = $t['id'];
        }

        $successCount = 0;
        $updatedCount = 0;
        $errors = [];

        $db->beginTransaction();
        try {
            foreach ($items as $idx => $row) {
                $line = $idx + 1;
                $code = trim($row['code'] ?? '');
                $name = trim($row['name'] ?? '');

                if (!$code || !$name) {
                    $errors[] = "Dòng $line: Thiếu thông tin bắt buộc (Mã lớp hoặc Tên lớp)";
                    continue;
                }

                // Detect or parse grade_level (10, 11, 12)
                $gradeLevel = 10;
                if (!empty($row['grade_level'])) {
                    $gradeLevel = (int)$row['grade_level'];
                } elseif (preg_match('/^(10|11|12)/', $code, $m) || preg_match('/^(10|11|12)/', $name, $m)) {
                    $gradeLevel = (int)$m[1];
                }

                $roomLocation = trim($row['room_location'] ?? 'Tòa nhà A');
                $teacherName = mb_strtolower(trim($row['teacher_name'] ?? ''));
                $teacherId = null;
                if ($teacherName && isset($teacherMap[$teacherName])) {
                    $teacherId = $teacherMap[$teacherName];
                }

                // Check if class code exists
                $chk = $db->prepare("SELECT id FROM classes WHERE code = ?");
                $chk->execute([$code]);
                $existing = $chk->fetch();

                if ($existing) {
                    $stmt = $db->prepare("UPDATE classes SET name = ?, grade_level = ?, room_location = ?, homeroom_teacher_id = COALESCE(?, homeroom_teacher_id) WHERE id = ?");
                    $stmt->execute([$name, $gradeLevel, $roomLocation, $teacherId, (int)$existing['id']]);
                    $updatedCount++;
                } else {
                    $stmt = $db->prepare("INSERT INTO classes (code, name, grade_level, academic_year_id, homeroom_teacher_id, total_students, boarding_students, room_location) VALUES (?, ?, ?, 1, ?, 0, 0, ?)");
                    $stmt->execute([$code, $name, $gradeLevel, $teacherId, $roomLocation]);
                    $successCount++;
                }
            }

            $db->commit();
            Response::success([
                'success_count' => $successCount,
                'updated_count' => $updatedCount,
                'total_processed' => count($items),
                'errors' => $errors,
            ], "Nhập thành công $successCount lớp mới, cập nhật $updatedCount lớp");
        } catch (\Exception $e) {
            $db->rollBack();
            Response::error('Lỗi khi lưu dữ liệu lớp học: ' . $e->getMessage(), 500);
        }
    }
}

