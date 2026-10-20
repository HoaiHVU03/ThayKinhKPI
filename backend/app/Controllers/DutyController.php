<?php
// backend/app/Controllers/DutyController.php

namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Middleware\AuthMiddleware;
use PDO;

class DutyController {
    public function schedules(Request $request): void {
        $db = Database::getConnection();
        $date = $request->get('date');

        $where = ['1=1'];
        $params = [];
        if ($date) {
            $where[] = "ds.duty_date = ?";
            $params[] = $date;
        }

        $sql = "
            SELECT ds.*, t.code AS teacher_code, t.full_name AS teacher_name, t.phone AS teacher_phone, t.subject
            FROM duty_schedules ds
            JOIN teachers t ON ds.teacher_id = t.id
            WHERE " . implode(' AND ', $where) . "
            ORDER BY ds.duty_date DESC, ds.id DESC
            LIMIT 50
        ";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $schedules = $stmt->fetchAll();

        foreach ($schedules as &$sch) {
            $stepsStmt = $db->prepare("SELECT * FROM duty_checklist_items WHERE schedule_id = ? ORDER BY step_number ASC");
            $stepsStmt->execute([$sch['id']]);
            $sch['steps'] = $stepsStmt->fetchAll();
        }

        Response::success($schedules);
    }

    public function teachers(Request $request): void {
        $db = Database::getConnection();
        $teachers = $db->query("SELECT id, code, full_name, subject, phone FROM teachers WHERE is_duty_teacher = 1 ORDER BY full_name ASC")->fetchAll();
        Response::success($teachers);
    }

    public function today(Request $request): void {
        $db = Database::getConnection();
        $today = date('Y-m-d');

        $stmt = $db->prepare("
            SELECT ds.*, t.code AS teacher_code, t.full_name AS teacher_name, t.phone AS teacher_phone, t.subject
            FROM duty_schedules ds
            JOIN teachers t ON ds.teacher_id = t.id
            WHERE ds.duty_date = ?
            LIMIT 1
        ");
        $stmt->execute([$today]);
        $duty = $stmt->fetch();

        if (!$duty) {
            // Auto create duty schedule for today using a random teacher from 37 duty teachers
            $t = $db->query("SELECT id FROM teachers WHERE is_duty_teacher = 1 ORDER BY RAND() LIMIT 1")->fetch();
            $tId = $t ? (int)$t['id'] : 1;
            $db->prepare("INSERT INTO duty_schedules (duty_date, shift_name, teacher_id, location, status, notes) VALUES (?, '06:55 - 07:15', ?, 'Tòa nhà A', 'pending', 'Trực ban buổi sáng')")
                ->execute([$today, $tId]);
            $dutyId = $db->lastInsertId();

            $steps = [
                1 => 'Kiểm tra bảng và điều kiện phòng học',
                2 => 'Thu gom, quản lý hộp điện thoại trong thời gian 15 phút truy bài',
                3 => 'Ghi nhận tình hình lớp và trao đổi thực tế với học sinh khi cần',
                4 => 'Hoàn thành báo cáo trực ban và ghi nhận các sự việc liên quan KPI'
            ];
            foreach ($steps as $sNum => $sTitle) {
                $db->prepare("INSERT INTO duty_checklist_items (schedule_id, step_number, title, is_completed) VALUES (?, ?, ?, 0)")
                    ->execute([$dutyId, $sNum, $sTitle]);
            }

            $stmt->execute([$today]);
            $duty = $stmt->fetch();
        }

        $stepsStmt = $db->prepare("SELECT * FROM duty_checklist_items WHERE schedule_id = ? ORDER BY step_number ASC");
        $stepsStmt->execute([$duty['id']]);
        $duty['steps'] = $stepsStmt->fetchAll();

        Response::success($duty);
    }

    public function toggleStep(Request $request, string $scheduleId): void {
        $db = Database::getConnection();
        $stepNumber = (int)$request->input('step_number');
        $isCompleted = (int)$request->input('is_completed', 1);
        $notes = trim($request->input('notes', ''));

        $stmt = $db->prepare("UPDATE duty_checklist_items SET is_completed = ?, notes = ? WHERE schedule_id = ? AND step_number = ?");
        $stmt->execute([$isCompleted, $notes, (int)$scheduleId, $stepNumber]);

        // Check if all 4 steps are completed
        $pendingCount = (int)$db->query("SELECT COUNT(*) FROM duty_checklist_items WHERE schedule_id = " . (int)$scheduleId . " AND is_completed = 0")->fetchColumn();
        $newStatus = ($pendingCount === 0) ? 'completed' : 'pending';
        $db->prepare("UPDATE duty_schedules SET status = ? WHERE id = ?")->execute([$newStatus, (int)$scheduleId]);

        Response::success(['schedule_status' => $newStatus], 'Cập nhật tiến độ trực ban thành công');
    }

    public function storeSchedule(Request $request): void {
        $db = Database::getConnection();
        $teacherId = (int)$request->input('teacher_id');
        $dutyDate = $request->input('duty_date', date('Y-m-d'));
        $shiftName = trim($request->input('shift_name', '06:55 - 07:15'));
        $location = trim($request->input('location', 'Tòa nhà A'));
        $notes = trim($request->input('notes', ''));

        if (!$teacherId || !$dutyDate) {
            Response::error('Giáo viên trực ban và ngày trực là bắt buộc', 422);
            return;
        }

        $stmt = $db->prepare("INSERT INTO duty_schedules (duty_date, shift_name, teacher_id, location, status, notes) VALUES (?, ?, ?, ?, 'pending', ?)");
        $stmt->execute([$dutyDate, $shiftName, $teacherId, $location, $notes]);
        $scheduleId = $db->lastInsertId();

        $steps = [
            1 => 'Kiểm tra bảng và điều kiện phòng học',
            2 => 'Thu gom, quản lý hộp điện thoại trong thời gian 15 phút truy bài',
            3 => 'Ghi nhận tình hình lớp và trao đổi thực tế với học sinh khi cần',
            4 => 'Hoàn thành báo cáo trực ban và ghi nhận các sự việc liên quan KPI'
        ];
        foreach ($steps as $sNum => $sTitle) {
            $db->prepare("INSERT INTO duty_checklist_items (schedule_id, step_number, title, is_completed) VALUES (?, ?, ?, 0)")
                ->execute([$scheduleId, $sNum, $sTitle]);
        }

        Response::success(['id' => $scheduleId], 'Phân công ca trực ban mới thành công', 201);
    }

    public function updateSchedule(Request $request, string $id): void {
        $db = Database::getConnection();
        $existing = $db->query("SELECT * FROM duty_schedules WHERE id = " . (int)$id)->fetch();
        if (!$existing) {
            Response::notFound('Ca trực ban không tồn tại');
            return;
        }

        $teacherId = (int)$request->input('teacher_id') ?: (int)$existing['teacher_id'];
        $dutyDate = $request->input('duty_date') ?: $existing['duty_date'];
        $shiftName = trim($request->input('shift_name', '')) ?: $existing['shift_name'];
        $location = trim($request->input('location', '')) ?: $existing['location'];
        $status = $request->input('status') ?: $existing['status'];
        $notes = $request->input('notes') !== null ? trim($request->input('notes', '')) : $existing['notes'];

        $stmt = $db->prepare("UPDATE duty_schedules SET teacher_id = ?, duty_date = ?, shift_name = ?, location = ?, status = ?, notes = ? WHERE id = ?");
        $stmt->execute([$teacherId, $dutyDate, $shiftName, $location, $status, $notes, (int)$id]);

        Response::success(null, 'Cập nhật ca trực ban thành công');
    }

    public function destroySchedule(Request $request, string $id): void {
        $db = Database::getConnection();
        $db->prepare("DELETE FROM duty_checklist_items WHERE schedule_id = ?")->execute([(int)$id]);
        $db->prepare("DELETE FROM duty_schedules WHERE id = ?")->execute([(int)$id]);

        Response::success(null, 'Đã xóa lịch trực ban thành công');
    }
}

