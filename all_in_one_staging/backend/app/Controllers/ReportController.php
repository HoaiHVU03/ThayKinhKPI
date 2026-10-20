<?php
// backend/app/Controllers/ReportController.php

namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Middleware\AuthMiddleware;
use PDO;

class ReportController {
    public function matrix(Request $request): void {
        $db = Database::getConnection();
        $grade = $request->get('grade');

        // Fetch 54 classes
        $cWhere = $grade ? "WHERE grade_level = " . (int)$grade : "";
        $classes = $db->query("SELECT id, code, name, grade_level, total_students, boarding_students FROM classes $cWhere ORDER BY grade_level ASC, id ASC")->fetchAll();

        // Fetch 10 rules
        $rules = $db->query("SELECT id, code, name, deduction_points FROM kpi_rules ORDER BY code ASC")->fetchAll();

        // Fetch violations counts grouped by class and rule
        $vRows = $db->query("
            SELECT v.class_id, v.rule_id, COUNT(v.id) AS v_count, SUM(v.points_deducted) AS total_pts
            FROM violation_records v
            WHERE v.status = 'approved'
            GROUP BY v.class_id, v.rule_id
        ")->fetchAll();

        $matrixMap = [];
        foreach ($vRows as $vr) {
            $matrixMap[$vr['class_id']][$vr['rule_id']] = [
                'count' => (int)$vr['v_count'],
                'points' => (int)$vr['total_pts']
            ];
        }

        // Fetch average KPI per class
        $kpiMap = $db->query("
            SELECT c.id, ROUND(AVG(sks.final_score), 1) as avg_kpi
            FROM classes c
            JOIN students s ON c.id = s.class_id
            JOIN student_kpi_summaries sks ON s.id = sks.student_id
            GROUP BY c.id
        ")->fetchAll(PDO::FETCH_KEY_PAIR);

        $matrixData = [];
        foreach ($classes as $c) {
            $row = [
                'class_id' => $c['id'],
                'class_code' => $c['code'],
                'class_name' => $c['name'],
                'grade_level' => $c['grade_level'],
                'total_students' => $c['total_students'],
                'avg_kpi' => $kpiMap[$c['id']] ?? 100.0,
                'total_violations' => 0,
                'total_deductions' => 0,
                'rules' => []
            ];

            foreach ($rules as $r) {
                $cnt = $matrixMap[$c['id']][$r['id']]['count'] ?? 0;
                $pts = $matrixMap[$c['id']][$r['id']]['points'] ?? 0;
                $row['rules'][$r['code']] = $cnt;
                $row['total_violations'] += $cnt;
                $row['total_deductions'] += $pts;
            }

            $matrixData[] = $row;
        }

        Response::success([
            'rules' => $rules,
            'matrix' => $matrixData
        ]);
    }

    public function studentsKpi(Request $request): void {
        $db = Database::getConnection();
        $user = AuthMiddleware::$currentUser;
        $classId = $request->get('class_id');
        $grade = $request->get('grade');
        $classification = $request->get('classification');

        $where = ['1=1'];
        $params = [];

        // Role scoping
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

        if ($classId && !($user && $user['role'] === 'homeroom_teacher')) {
            $where[] = "s.class_id = ?";
            $params[] = (int)$classId;
        }
        if ($grade) {
            $where[] = "c.grade_level = ?";
            $params[] = (int)$grade;
        }
        if ($classification) {
            $where[] = "sks.classification = ?";
            $params[] = $classification;
        }

        $sql = "
            SELECT s.id, s.code, s.full_name, s.gender, c.name AS class_name, c.grade_level,
                   s.is_boarding, dr.code AS room_code,
                   sks.baseline_score, sks.total_deducted, sks.final_score, sks.classification,
                   (SELECT COUNT(*) FROM violation_records v WHERE v.student_id = s.id AND v.status = 'approved') AS violation_count
            FROM students s
            JOIN classes c ON s.class_id = c.id
            LEFT JOIN dormitory_rooms dr ON s.dorm_room_id = dr.id
            JOIN student_kpi_summaries sks ON s.id = sks.student_id
            WHERE " . implode(' AND ', $where) . "
            ORDER BY sks.final_score ASC, s.full_name ASC
            LIMIT 200
        ";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $items = $stmt->fetchAll();

        Response::success($items);
    }

    public function officialDocument(Request $request): void {
        $db = Database::getConnection();
        $grade = $request->get('grade');
        $classId = $request->get('class_id');

        $totalStudents = (int)$db->query("SELECT COUNT(*) FROM students")->fetchColumn();
        $avgScore = (float)$db->query("SELECT AVG(final_score) FROM student_kpi_summaries")->fetchColumn();
        $counts = $db->query("
            SELECT classification, COUNT(*) AS count
            FROM student_kpi_summaries
            GROUP BY classification
        ")->fetchAll(PDO::FETCH_KEY_PAIR);

        $totalViolations = (int)$db->query("SELECT COUNT(*) FROM violation_records WHERE status = 'approved'")->fetchColumn();

        $settings = $db->query("SELECT setting_key, setting_value FROM school_settings")->fetchAll(PDO::FETCH_KEY_PAIR) ?: [];
        $schoolName = mb_strtoupper($settings['school_name'] ?? 'TRƯỜNG THPT CHUYÊN HÙNG VƯƠNG', 'UTF-8');
        $province = mb_strtoupper($settings['school_province'] ?? 'PHÚ THỌ', 'UTF-8');
        $deptName = (stripos($province, 'SỞ') === 0) ? $province : "SỞ GIÁO DỤC VÀ ĐÀO TẠO " . $province;
        $principalName = $settings['principal_name'] ?? 'TS. Phạm Tuấn Anh';
        $dormManagerName = $settings['dorm_manager_name'] ?? 'Thầy Đỗ Văn Thắng';
        $youthSecretary = $settings['youth_union_secretary'] ?? 'Cô Trần Thị Mai';
        $acYear = $settings['academic_year_current'] ?? '2026-2027';
        $schoolCode = $settings['school_code'] ?? 'THPTCHV';

        Response::success([
            'doc_number' => date('Y') . '/BC-' . preg_replace('/[^A-Z0-9]/', '', mb_strtoupper($schoolCode)),
            'doc_date' => 'Ngày ' . date('d') . ' tháng ' . date('m') . ' năm ' . date('Y'),
            'school_name' => $schoolName,
            'dept_name' => $deptName,
            'title' => 'BÁO CÁO TỔNG HỢP ĐÁNH GIÁ NỀN NẾP VÀ KPI RÈN LUYỆN HỌC SINH',
            'semester' => "Học kỳ 1 — Năm học {$acYear}",
            'stats' => [
                'total_students' => $totalStudents,
                'avg_score' => round($avgScore, 1),
                'total_violations' => $totalViolations,
                'excellent_count' => $counts['Xuất sắc'] ?? 0,
                'good_count' => $counts['Tốt'] ?? 0,
                'pass_count' => $counts['Đạt'] ?? 0,
                'fail_count' => $counts['Chưa đạt'] ?? 0,
            ],
            'signatories' => [
                ['title' => 'TRƯỞNG BAN QUẢN SINH', 'name' => $dormManagerName],
                ['title' => 'BÍ THƯ ĐOÀN TRƯỜNG', 'name' => $youthSecretary],
                ['title' => 'HIỆU TRƯỞNG', 'name' => $principalName]
            ]
        ]);
    }

    public function classKpiDocument(Request $request, string $classId): void {
        $db = Database::getConnection();
        $user = AuthMiddleware::$currentUser;
        $cId = (int)$classId;

        if ($user && $user['role'] === 'homeroom_teacher') {
            $classScope = AuthMiddleware::getUserScope('class');
            if ($classScope && $classScope !== $cId) {
                Response::forbidden('Bạn chỉ có quyền xem báo cáo KPI của lớp mình chủ nhiệm');
                return;
            }
        } elseif ($user && in_array($user['role'], ['room_leader', 'floor_leader'])) {
            Response::forbidden('Tài khoản của bạn không có quyền xem báo cáo KPI toàn lớp');
            return;
        }

        $class = $db->query("
            SELECT c.*, u.full_name AS teacher_name, u.phone AS teacher_phone 
            FROM classes c 
            LEFT JOIN users u ON c.homeroom_teacher_id = u.id 
            WHERE c.id = $cId
        ")->fetch();

        if (!$class) {
            Response::notFound('Lớp học không tồn tại');
            return;
        }

        $students = $db->query("
            SELECT s.id, s.code, s.full_name, s.gender, s.dob, s.is_boarding, s.parent_name, s.parent_phone,
                    dr.code AS room_code,
                    sks.baseline_score, sks.total_deducted, sks.final_score, sks.classification,
                    (
                        SELECT GROUP_CONCAT(CONCAT(r.code, ' (-', v.points_deducted, 'đ)') SEPARATOR ', ')
                        FROM violation_records v
                        JOIN kpi_rules r ON v.rule_id = r.id
                        WHERE v.student_id = s.id AND v.status = 'approved'
                    ) AS violations_summary
            FROM students s
            JOIN student_kpi_summaries sks ON s.id = sks.student_id
            LEFT JOIN dormitory_rooms dr ON s.dorm_room_id = dr.id
            WHERE s.class_id = $cId
            ORDER BY sks.final_score DESC, s.full_name ASC
        ")->fetchAll();

        // Calculate class stats
        $totalStudents = count($students);
        $totalScores = 0;
        $totalViolations = 0;
        $counts = ['Xuất sắc' => 0, 'Tốt' => 0, 'Đạt' => 0, 'Chưa đạt' => 0];

        foreach ($students as $st) {
            $score = (float)$st['final_score'];
            $totalScores += $score;
            $cls = $st['classification'] ?? 'Xuất sắc';
            if (isset($counts[$cls])) $counts[$cls]++;
            if (!empty($st['violations_summary'])) {
                $totalViolations += count(explode(',', $st['violations_summary']));
            }
        }

        $avgScore = $totalStudents > 0 ? round($totalScores / $totalStudents, 1) : 100.0;

        Response::success([
            'doc_number' => date('Y') . '/KPI-' . $class['code'],
            'doc_date' => 'Ngày ' . date('d') . ' tháng ' . date('m') . ' năm ' . date('Y'),
            'school_name' => 'TRƯỜNG THPT CHUYÊN HÙNG VƯƠNG',
            'dept_name' => 'SỞ GIÁO DỤC VÀ ĐÀO TẠO PHÚ THỌ',
            'semester' => 'Học kỳ 1 — Năm học 2026-2027',
            'class' => [
                'id' => (int)$class['id'],
                'code' => $class['code'],
                'name' => $class['name'],
                'grade_level' => (int)$class['grade_level'],
                'teacher_name' => $class['teacher_name'] ?? 'Chưa phân công',
                'teacher_phone' => $class['teacher_phone'] ?? '',
                'total_students' => $totalStudents,
                'boarding_students' => (int)$class['boarding_students'],
                'avg_score' => $avgScore,
                'total_violations' => $totalViolations,
                'classification_stats' => $counts
            ],
            'students' => $students
        ]);
    }

    public function studentKpiCard(Request $request, string $studentId): void {
        $db = Database::getConnection();
        $user = AuthMiddleware::$currentUser;
        $sId = (int)$studentId;

        $student = $db->query("
            SELECT s.*, c.name AS class_name, c.code AS class_code, c.grade_level, 
                   u.full_name AS teacher_name, u.phone AS teacher_phone,
                   dr.code AS room_code, dr.floor_number,
                   sks.baseline_score, sks.total_deducted, sks.final_score, sks.classification
            FROM students s
            JOIN classes c ON s.class_id = c.id
            LEFT JOIN users u ON c.homeroom_teacher_id = u.id
            LEFT JOIN dormitory_rooms dr ON s.dorm_room_id = dr.id
            JOIN student_kpi_summaries sks ON s.id = sks.student_id
            WHERE s.id = $sId
        ")->fetch();

        if (!$student) {
            Response::notFound('Học sinh không tồn tại');
            return;
        }

        if ($user && $user['role'] === 'homeroom_teacher') {
            $classScope = AuthMiddleware::getUserScope('class');
            if ($classScope && (int)$student['class_id'] !== $classScope) {
                Response::forbidden('Bạn chỉ có quyền xem phiếu KPI của học sinh thuộc lớp mình chủ nhiệm');
                return;
            }
        } elseif ($user && $user['role'] === 'room_leader') {
            $roomScope = AuthMiddleware::getUserScope('room');
            if ($roomScope && (int)$student['dorm_room_id'] !== $roomScope) {
                Response::forbidden('Bạn chỉ có quyền xem phiếu KPI của học sinh thuộc phòng mình quản lý');
                return;
            }
        } elseif ($user && $user['role'] === 'floor_leader') {
            $floorScope = AuthMiddleware::getUserScope('floor');
            if ($floorScope && (int)$student['floor_number'] !== $floorScope) {
                Response::forbidden('Bạn chỉ có quyền xem phiếu KPI của học sinh thuộc tầng mình quản lý');
                return;
            }
        }

        $violations = $db->query("
            SELECT v.id, v.code, v.violation_date, v.violation_time, v.location, v.description, v.points_deducted, v.status,
                   r.code AS rule_code, r.name AS rule_name,
                   u_rep.full_name AS reporter_name,
                   u_app.full_name AS approver_name
            FROM violation_records v
            JOIN kpi_rules r ON v.rule_id = r.id
            LEFT JOIN users u_rep ON v.reported_by_user_id = u_rep.id
            LEFT JOIN users u_app ON v.approved_by_user_id = u_app.id
            WHERE v.student_id = $sId
            ORDER BY v.violation_date DESC, v.id DESC
        ")->fetchAll();

        Response::success([
            'doc_number' => date('Y') . '/PKPI-' . $student['code'],
            'doc_date' => 'Ngày ' . date('d') . ' tháng ' . date('m') . ' năm ' . date('Y'),
            'school_name' => 'TRƯỜNG THPT CHUYÊN HÙNG VƯƠNG',
            'dept_name' => 'SỞ GIÁO DỤC VÀ ĐÀO TẠO PHÚ THỌ',
            'semester' => 'Học kỳ 1 — Năm học 2026-2027',
            'student' => $student,
            'violations' => $violations
        ]);
    }
}
