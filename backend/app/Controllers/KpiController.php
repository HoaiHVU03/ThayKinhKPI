<?php
// backend/app/Controllers/KpiController.php

namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Middleware\AuthMiddleware;
use PDO;

class KpiController {
    public function rules(Request $request): void {
        $db = Database::getConnection();
        $rules = $db->query("SELECT * FROM kpi_rules ORDER BY code ASC")->fetchAll();
        Response::success($rules);
    }

    public function violations(Request $request): void {
        $db = Database::getConnection();
        $user = AuthMiddleware::$currentUser;

        $page = max(1, (int)$request->get('page', 1));
        $limit = max(1, min(100, (int)$request->get('limit', 20)));
        $offset = ($page - 1) * $limit;

        $search = trim($request->get('search', ''));
        $ruleId = $request->get('rule_id');
        $classId = $request->get('class_id');
        $status = $request->get('status');
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');
        $date = $request->get('date');

        $where = ['1=1'];
        $params = [];

        // Scoping: homeroom teacher, class cadre, or student only sees their class violations
        if ($user && in_array($user['role'], ['homeroom_teacher', 'class_cadre', 'student'])) {
            $classScope = AuthMiddleware::getUserScope('class');
            if ($classScope) {
                $where[] = "v.class_id = ?";
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

        if ($search !== '') {
            $where[] = "(s.full_name LIKE ? OR s.code LIKE ? OR v.code LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }
        if ($ruleId) {
            $where[] = "v.rule_id = ?";
            $params[] = (int)$ruleId;
        }
        if ($classId) {
            $where[] = "v.class_id = ?";
            $params[] = (int)$classId;
        }
        if ($status) {
            $where[] = "v.status = ?";
            $params[] = $status;
        }
        if ($date) {
            $where[] = "v.violation_date = ?";
            $params[] = $date;
        }
        if ($dateFrom) {
            $where[] = "v.violation_date >= ?";
            $params[] = $dateFrom;
        }
        if ($dateTo) {
            $where[] = "v.violation_date <= ?";
            $params[] = $dateTo;
        }

        $whereClause = implode(' AND ', $where);

        // Accurate total count
        $cntStmt = $db->prepare("
            SELECT COUNT(*) 
            FROM violation_records v 
            JOIN students s ON v.student_id = s.id 
            LEFT JOIN dormitory_rooms dr ON s.dorm_room_id = dr.id 
            WHERE $whereClause
        ");
        $cntStmt->execute($params);
        $total = (int)$cntStmt->fetchColumn();

        $sql = "
            SELECT v.*, s.code AS student_code, s.full_name AS student_name, c.name AS class_name,
                   r.code AS rule_code, r.name AS rule_name,
                   u_rep.full_name AS reporter_name, u_app.full_name AS approver_name,
                   dr.code AS room_code, dr.floor_number AS floor_number
            FROM violation_records v
            JOIN students s ON v.student_id = s.id
            JOIN classes c ON v.class_id = c.id
            JOIN kpi_rules r ON v.rule_id = r.id
            LEFT JOIN dormitory_rooms dr ON s.dorm_room_id = dr.id
            LEFT JOIN users u_rep ON v.reported_by_user_id = u_rep.id
            LEFT JOIN users u_app ON v.approved_by_user_id = u_app.id
            WHERE $whereClause
            ORDER BY v.violation_date DESC, v.id DESC
            LIMIT $limit OFFSET $offset
        ";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $items = $stmt->fetchAll();

        Response::success([
            'items' => $items,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'total_pages' => ceil($total / $limit)
        ]);
    }

    public function createViolation(Request $request): void {
        $db = Database::getConnection();
        $user = AuthMiddleware::$currentUser;

        if ($user && in_array($user['role'], ['student', 'class_cadre'])) {
            Response::forbidden('Học sinh và Ban cán sự lớp không có thẩm quyền lập biên bản vi phạm');
            return;
        }

        $studentId = (int)$request->input('student_id');
        $ruleId = (int)$request->input('rule_id');
        $violationDate = $request->input('violation_date', date('Y-m-d'));
        $violationTime = $request->input('violation_time', date('H:i:s'));
        $location = trim($request->input('location', 'Khuôn viên trường'));
        $description = trim($request->input('description', ''));
        $evidenceUrl = trim($request->input('evidence_url', ''));

        if (!$studentId || !$ruleId || !$description) {
            Response::error('Vui lòng chọn học sinh, mã lỗi và nhập mô tả chi tiết sự việc', 422);
            return;
        }

        // Fetch student and class
        $st = $db->query("SELECT id, class_id FROM students WHERE id = $studentId")->fetch();
        if (!$st) {
            Response::notFound('Học sinh không tồn tại');
            return;
        }

        // Fetch rule deduction points
        $rule = $db->query("SELECT code, deduction_points FROM kpi_rules WHERE id = $ruleId")->fetch();
        if (!$rule) {
            Response::notFound('Mã vi phạm không hợp lệ');
            return;
        }

        $code = 'BB-' . date('Ymd') . '-' . sprintf("%04d", rand(1000, 9999));
        
        // Admins and Dorm Manager violations are auto-approved; others (duty teachers, room leaders) can be 'pending' or 'approved'
        $isAdminOrMgr = in_array($user['role'] ?? '', ['admin', 'dorm_manager', 'youth_union']);
        $status = $isAdminOrMgr ? 'approved' : 'pending';
        $approverId = $isAdminOrMgr ? ($user['id'] ?? null) : null;
        $approvedAt = $isAdminOrMgr ? date('Y-m-d H:i:s') : null;

        $db->beginTransaction();
        try {
            $stmt = $db->prepare("
                INSERT INTO violation_records (code, student_id, class_id, rule_id, period_id, violation_date, violation_time, location, description, points_deducted, reported_by_user_id, evidence_url, status, approved_by_user_id, approved_at)
                VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $code, $studentId, $st['class_id'], $ruleId, $violationDate, $violationTime,
                $location, $description, $rule['deduction_points'], $user['id'] ?? 1,
                $evidenceUrl, $status, $approverId, $approvedAt
            ]);
            $violationId = $db->lastInsertId();

            if ($status === 'approved') {
                $this->recalculateStudentKpi($db, $studentId, 1);
            }

            // Audit log
            $db->prepare("INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, 'CREATE_VIOLATION', 'violation_records', ?, ?)")
                ->execute([$user['id'] ?? 1, $violationId, "Lập biên bản vi phạm $code (-{$rule['deduction_points']} điểm)"]);

            $db->commit();
        } catch (\Exception $e) {
            $db->rollBack();
            Response::error('Lỗi khi lập biên bản: ' . $e->getMessage(), 500);
            return;
        }

        Response::success([
            'id' => $violationId,
            'code' => $code,
            'status' => $status
        ], 'Lập biên bản vi phạm thành công', 201);
    }

    public function importViolations(Request $request): void {
        $db = Database::getConnection();
        $user = AuthMiddleware::$currentUser;

        if (!AuthMiddleware::requireRole(['admin', 'dorm_manager', 'youth_union'], 'Chỉ Quản trị viên, Quản sinh hoặc Đoàn Thanh niên mới có quyền nhập hàng loạt biên bản vi phạm')) {
            return;
        }

        $items = $request->input('items', []);

        if (empty($items) || !is_array($items)) {
            Response::error('Dữ liệu nhập trống hoặc sai cấu trúc', 422);
            return;
        }

        // Preload students map (code -> [id, class_id])
        $students = $db->query("SELECT id, code, class_id FROM students")->fetchAll();
        $studentMap = [];
        foreach ($students as $s) {
            $studentMap[strtoupper(trim($s['code']))] = [
                'id' => (int)$s['id'],
                'class_id' => (int)$s['class_id']
            ];
        }

        // Preload rules map (code -> [id, deduction_points])
        $rules = $db->query("SELECT id, code, deduction_points FROM kpi_rules")->fetchAll();
        $ruleMap = [];
        foreach ($rules as $r) {
            $ruleMap[strtoupper(trim($r['code']))] = [
                'id' => (int)$r['id'],
                'deduction_points' => (float)$r['deduction_points']
            ];
        }

        $successCount = 0;
        $errors = [];
        $affectedStudents = [];

        $db->beginTransaction();
        try {
            foreach ($items as $idx => $row) {
                $line = $idx + 1;
                $studentCode = strtoupper(trim($row['student_code'] ?? ''));
                $ruleCode = strtoupper(trim($row['rule_code'] ?? ''));
                $violationDate = trim($row['violation_date'] ?? date('Y-m-d'));
                $location = trim($row['location'] ?? 'Khuôn viên trường');
                $description = trim($row['description'] ?? '');

                if (!$studentCode || !$ruleCode) {
                    $errors[] = "Dòng $line: Thiếu Mã học sinh hoặc Mã vi phạm";
                    continue;
                }

                if (!isset($studentMap[$studentCode])) {
                    $errors[] = "Dòng $line: Học sinh có mã '$studentCode' không tồn tại";
                    continue;
                }

                if (!isset($ruleMap[$ruleCode])) {
                    $errors[] = "Dòng $line: Mã vi phạm '$ruleCode' không hợp lệ (cần từ L01 đến L10)";
                    continue;
                }

                // Normalize date if DD/MM/YYYY
                if (preg_match('/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/', $violationDate, $m)) {
                    $violationDate = sprintf('%04d-%02d-%02d', $m[3], $m[2], $m[1]);
                }

                $stData = $studentMap[$studentCode];
                $ruleData = $ruleMap[$ruleCode];

                if (!$description) {
                    $description = "Vi phạm nề nếp theo mã lỗi " . $ruleCode;
                }

                $code = 'BB-' . date('Ymd') . '-' . sprintf("%04d", rand(1000, 9999));
                $stmt = $db->prepare("
                    INSERT INTO violation_records (code, student_id, class_id, rule_id, period_id, violation_date, violation_time, location, description, points_deducted, reported_by_user_id, status, approved_by_user_id, approved_at)
                    VALUES (?, ?, ?, ?, 1, ?, '12:00:00', ?, ?, ?, ?, 'approved', ?, NOW())
                ");
                $stmt->execute([
                    $code,
                    $stData['id'],
                    $stData['class_id'],
                    $ruleData['id'],
                    $violationDate,
                    $location,
                    $description,
                    $ruleData['deduction_points'],
                    $user['id'] ?? 1,
                    $user['id'] ?? 1
                ]);

                $affectedStudents[$stData['id']] = true;
                $successCount++;
            }

            // Recalculate KPI for all affected students
            foreach (array_keys($affectedStudents) as $sId) {
                $this->recalculateStudentKpi($db, (int)$sId, 1);
            }

            $db->commit();
        } catch (\Exception $e) {
            $db->rollBack();
            Response::error('Lỗi khi nhập dữ liệu vi phạm: ' . $e->getMessage(), 500);
            return;
        }

        Response::success([
            'success_count' => $successCount,
            'failed_count' => count($errors),
            'errors' => $errors
        ], "Đã nhập thành công $successCount biên bản vi phạm. " . (count($errors) > 0 ? count($errors) . ' dòng lỗi.' : ''));
    }

    public function approve(Request $request, string $id): void {
        $db = Database::getConnection();
        $user = AuthMiddleware::$currentUser;

        if (!in_array($user['role'] ?? '', ['admin', 'dorm_manager', 'youth_union'])) {
            Response::forbidden('Bạn không có thẩm quyền phê duyệt biên bản vi phạm');
            return;
        }

        $v = $db->query("SELECT * FROM violation_records WHERE id = " . (int)$id)->fetch();
        if (!$v) {
            Response::notFound('Biên bản không tồn tại');
            return;
        }

        if ($v['status'] === 'approved') {
            Response::error('Biên bản này đã được phê duyệt trước đó', 400);
            return;
        }

        $db->beginTransaction();
        try {
            $db->prepare("UPDATE violation_records SET status = 'approved', approved_by_user_id = ?, approved_at = NOW() WHERE id = ?")
                ->execute([$user['id'], (int)$id]);

            $this->recalculateStudentKpi($db, (int)$v['student_id'], 1);

            $db->prepare("INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, 'APPROVE_VIOLATION', 'violation_records', ?, ?)")
                ->execute([$user['id'], (int)$id, "Phê duyệt biên bản {$v['code']} trừ {$v['points_deducted']} điểm"]);

            $db->commit();
        } catch (\Exception $e) {
            $db->rollBack();
            Response::error('Lỗi khi phê duyệt: ' . $e->getMessage(), 500);
            return;
        }

        Response::success(null, 'Phê duyệt biên bản vi phạm và cập nhật điểm KPI thành công');
    }

    public function reject(Request $request, string $id): void {
        $db = Database::getConnection();
        $user = AuthMiddleware::$currentUser;
        $notes = trim($request->input('notes', 'Không đủ căn cứ xử lý'));

        $v = $db->query("SELECT * FROM violation_records WHERE id = " . (int)$id)->fetch();
        if (!$v) {
            Response::notFound('Biên bản không tồn tại');
            return;
        }

        $db->beginTransaction();
        try {
            $db->prepare("UPDATE violation_records SET status = 'rejected', notes = ?, approved_by_user_id = ?, approved_at = NOW() WHERE id = ?")
                ->execute([$notes, $user['id'] ?? null, (int)$id]);

            // If it was previously approved, recalculate to restore points
            if ($v['status'] === 'approved') {
                $this->recalculateStudentKpi($db, (int)$v['student_id'], 1);
            }

            $db->commit();
        } catch (\Exception $e) {
            $db->rollBack();
            Response::error('Lỗi: ' . $e->getMessage(), 500);
            return;
        }

        Response::success(null, 'Đã từ chối biên bản vi phạm');
    }

    public function disciplineLevels(Request $request): void {
        // Section 9.5
        $levels = [
            [
                'level' => 1,
                'name' => 'Mức 1: Nhắc nhở và Chấn chỉnh',
                'description' => 'Áp dụng cho học sinh vi phạm nền nếp lần đầu hoặc các lỗi nhẹ (L01, L02, L04).',
                'action' => 'Nhắc nhở trực tiếp, kiểm điểm trước phòng/lớp, ghi sổ theo dõi.',
                'authority' => 'Trưởng phòng, Trưởng tầng, Quản sinh'
            ],
            [
                'level' => 2,
                'name' => 'Mức 2: Khiển trách & Thông báo Phụ huynh',
                'description' => 'Áp dụng cho học sinh vi phạm tái diễn từ 2-3 lần hoặc vi phạm L05, L07, L08.',
                'action' => 'Lập biên bản xử phạt, thông báo GVCN và phụ huynh học sinh, xếp loại rèn luyện Tốt/Đạt.',
                'authority' => 'Quản sinh, Đoàn Thanh niên, GVCN'
            ],
            [
                'level' => 3,
                'name' => 'Mức 3: Xem xét Trả phòng KTX & Kỷ luật Cấp trường',
                'description' => 'Áp dụng cho học sinh vi phạm nghiêm trọng (L09, L10) hoặc điểm rèn luyện dưới 50.',
                'action' => 'Hội đồng Kỷ luật nhà trường họp, đình chỉ ở KTX, buộc trả phòng, hạ loại rèn luyện Chưa đạt.',
                'authority' => 'Ban Giám hiệu, Hội đồng Kỷ luật Nhà trường'
            ]
        ];

        Response::success($levels);
    }

    public function updateViolation(Request $request, string $id): void {
        $db = Database::getConnection();
        $user = AuthMiddleware::$currentUser;

        if (!AuthMiddleware::requireRole(['admin', 'dorm_manager', 'youth_union'], 'Chỉ Quản trị viên, Quản sinh hoặc Đoàn Thanh niên mới có quyền sửa biên bản vi phạm')) {
            return;
        }

        $v = $db->query("SELECT * FROM violation_records WHERE id = " . (int)$id)->fetch();
        if (!$v) {
            Response::notFound('Biên bản không tồn tại');
            return;
        }

        $ruleId = $request->input('rule_id') ? (int)$request->input('rule_id') : $v['rule_id'];
        $violationDate = $request->input('violation_date', $v['violation_date']);
        $violationTime = $request->input('violation_time', $v['violation_time']);
        $location = trim($request->input('location', $v['location']));
        $description = trim($request->input('description', $v['description']));
        $notes = trim($request->input('notes', $v['notes'] ?? ''));
        $status = $request->input('status', $v['status']);
        $evidenceUrl = $request->input('evidence_url', $v['evidence_url'] ?? null);

        // Check if rule changed and update points
        $points = (float)$v['points_deducted'];
        if ($ruleId != $v['rule_id']) {
            $newRule = $db->query("SELECT deduction_points FROM kpi_rules WHERE id = $ruleId")->fetch();
            if ($newRule) {
                $points = (float)$newRule['deduction_points'];
            }
        }
        if ($request->input('points_deducted') !== null) {
            $points = (float)$request->input('points_deducted');
        }

        $db->beginTransaction();
        try {
            $stmt = $db->prepare("
                UPDATE violation_records 
                SET rule_id = ?, violation_date = ?, violation_time = ?, location = ?, description = ?, notes = ?, status = ?, points_deducted = ?, evidence_url = ?
                WHERE id = ?
            ");
            $stmt->execute([$ruleId, $violationDate, $violationTime, $location, $description, $notes, $status, $points, $evidenceUrl, (int)$id]);

            // Recalculate student KPI
            $this->recalculateStudentKpi($db, (int)$v['student_id'], (int)($v['period_id'] ?: 1));

            $db->prepare("INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, 'UPDATE_VIOLATION', 'violation_records', ?, ?)")
                ->execute([$user['id'] ?? null, (int)$id, "Cập nhật biên bản {$v['code']}"]);

            $db->commit();
        } catch (\Exception $e) {
            $db->rollBack();
            Response::error('Lỗi khi cập nhật biên bản: ' . $e->getMessage(), 500);
            return;
        }

        Response::success(null, 'Cập nhật biên bản vi phạm thành công');
    }

    public function destroyViolation(Request $request, string $id): void {
        $db = Database::getConnection();
        $user = AuthMiddleware::$currentUser;

        if (!AuthMiddleware::requireAdmin('Chỉ Quản trị viên / Ban Giám hiệu mới có quyền xóa biên bản vi phạm')) {
            return;
        }

        $v = $db->query("SELECT * FROM violation_records WHERE id = " . (int)$id)->fetch();
        if (!$v) {
            Response::notFound('Biên bản không tồn tại');
            return;
        }

        $db->beginTransaction();
        try {
            $db->prepare("DELETE FROM violation_records WHERE id = ?")->execute([(int)$id]);

            // Recalculate student KPI
            $this->recalculateStudentKpi($db, (int)$v['student_id'], (int)($v['period_id'] ?: 1));

            $db->prepare("INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, 'DELETE_VIOLATION', 'violation_records', ?, ?)")
                ->execute([$user['id'] ?? null, (int)$id, "Xóa biên bản vi phạm {$v['code']} của học sinh ID {$v['student_id']}"]);

            $db->commit();
        } catch (\Exception $e) {
            $db->rollBack();
            Response::error('Lỗi khi xóa biên bản: ' . $e->getMessage(), 500);
            return;
        }

        Response::success(null, 'Đã xóa biên bản vi phạm thành công và hoàn lại điểm KPI');
    }

    public function storeRule(Request $request): void {
        if (!AuthMiddleware::requireAdmin('Chỉ Quản trị viên / Ban Giám hiệu mới có quyền cấu hình quy định KPI')) {
            return;
        }

        $db = Database::getConnection();
        $code = strtoupper(trim($request->input('code', '')));
        $name = trim($request->input('name', ''));
        $category = trim($request->input('category', 'KTX'));
        $deductionPoints = (float)$request->input('deduction_points', 5.0);
        $description = trim($request->input('description', ''));

        if (!$code || !$name) {
            Response::error('Mã vi phạm (L01-L10...) và tên hành vi là bắt buộc', 422);
            return;
        }

        $chk = $db->prepare("SELECT id FROM kpi_rules WHERE code = ?");
        $chk->execute([$code]);
        if ($chk->fetch()) {
            Response::error("Mã vi phạm '$code' đã tồn tại", 409);
            return;
        }

        $stmt = $db->prepare("INSERT INTO kpi_rules (code, name, category, deduction_points, description) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$code, $name, $category, $deductionPoints, $description]);

        Response::success(['id' => $db->lastInsertId()], "Đã tạo quy định vi phạm $code thành công", 201);
    }

    public function updateRule(Request $request, string $id): void {
        if (!AuthMiddleware::requireAdmin('Chỉ Quản trị viên / Ban Giám hiệu mới có quyền cập nhật quy định KPI')) {
            return;
        }

        $db = Database::getConnection();
        $name = trim($request->input('name', ''));
        $category = trim($request->input('category', 'KTX'));
        $deductionPoints = (float)$request->input('deduction_points', 5.0);
        $description = trim($request->input('description', ''));

        if (!$name) {
            Response::error('Tên hành vi vi phạm không được để trống', 422);
            return;
        }

        $stmt = $db->prepare("UPDATE kpi_rules SET name = ?, category = ?, deduction_points = ?, description = ? WHERE id = ?");
        $stmt->execute([$name, $category, $deductionPoints, $description, (int)$id]);

        Response::success(null, 'Cập nhật quy định KPI thành công');
    }

    public function destroyRule(Request $request, string $id): void {
        if (!AuthMiddleware::requireAdmin('Chỉ Quản trị viên / Ban Giám hiệu mới có quyền xóa quy định KPI')) {
            return;
        }

        $db = Database::getConnection();
        $rule = $db->query("SELECT * FROM kpi_rules WHERE id = " . (int)$id)->fetch();
        if (!$rule) {
            Response::notFound('Quy định không tồn tại');
            return;
        }

        $usageCount = (int)$db->query("SELECT COUNT(*) FROM violation_records WHERE rule_id = " . (int)$id)->fetchColumn();
        if ($usageCount > 0) {
            Response::error("Không thể xóa quy định {$rule['code']} vì đang có $usageCount biên bản vi phạm áp dụng mã lỗi này.", 400);
            return;
        }

        $db->prepare("DELETE FROM kpi_rules WHERE id = ?")->execute([(int)$id]);
        Response::success(null, "Đã xóa quy định {$rule['code']} thành công");
    }

    private function recalculateStudentKpi(PDO $db, int $studentId, int $periodId): void {
        $totalDeducted = (float)$db->query("
            SELECT COALESCE(SUM(points_deducted), 0)
            FROM violation_records
            WHERE student_id = $studentId AND period_id = $periodId AND status = 'approved'
        ")->fetchColumn();

        $baseline = 100.0;
        $finalScore = max(0.0, $baseline - $totalDeducted);

        $classification = 'Xuất sắc';
        if ($finalScore < 50) $classification = 'Chưa đạt';
        elseif ($finalScore < 75) $classification = 'Đạt';
        elseif ($finalScore < 90) $classification = 'Tốt';

        $stmt = $db->prepare("
            INSERT INTO student_kpi_summaries (student_id, period_id, baseline_score, total_deducted, final_score, classification)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                total_deducted = VALUES(total_deducted),
                final_score = VALUES(final_score),
                classification = VALUES(classification),
                updated_at = NOW()
        ");
        $stmt->execute([$studentId, $periodId, $baseline, $totalDeducted, $finalScore, $classification]);
    }
}
