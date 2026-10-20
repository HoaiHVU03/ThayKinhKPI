<?php
// backend/app/Controllers/DashboardController.php

namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Middleware\AuthMiddleware;
use PDO;

class DashboardController {
    public function stats(Request $request): void {
        $db = Database::getConnection();
        $user = AuthMiddleware::$currentUser;
        $role = $user['role'] ?? 'guest';
        $today = date('Y-m-d');

        // Scoping for Homeroom Teacher
        if ($role === 'homeroom_teacher') {
            $classScope = AuthMiddleware::getUserScope('class');
            if ($classScope) {
                $totalStudents = (int)$db->query("SELECT COUNT(*) FROM students WHERE class_id = $classScope")->fetchColumn();
                $totalBoarding = (int)$db->query("SELECT COUNT(*) FROM students WHERE class_id = $classScope AND is_boarding = 1")->fetchColumn();
                $totalDay = (int)$db->query("SELECT COUNT(*) FROM students WHERE class_id = $classScope AND is_boarding = 0")->fetchColumn();
                $boardingMale = (int)$db->query("SELECT COUNT(*) FROM students WHERE class_id = $classScope AND is_boarding = 1 AND gender = 'Nam'")->fetchColumn();
                $boardingFemale = (int)$db->query("SELECT COUNT(*) FROM students WHERE class_id = $classScope AND is_boarding = 1 AND gender = 'Nữ'")->fetchColumn();
                $totalClasses = 1;
                $totalRooms = (int)$db->query("SELECT COUNT(DISTINCT dorm_room_id) FROM students WHERE class_id = $classScope AND dorm_room_id IS NOT NULL")->fetchColumn();
                $avgKpi = (float)$db->query("
                    SELECT COALESCE(AVG(sks.final_score), 98.4) 
                    FROM student_kpi_summaries sks 
                    JOIN students s ON sks.student_id = s.id 
                    WHERE s.class_id = $classScope
                ")->fetchColumn();
                $violationsToday = (int)$db->query("SELECT COUNT(*) FROM violation_records WHERE class_id = $classScope AND violation_date = '$today'")->fetchColumn();
                $pendingLeaves = (int)$db->query("
                    SELECT COUNT(*) 
                    FROM leave_requests lr 
                    JOIN students s ON lr.student_id = s.id 
                    WHERE s.class_id = $classScope AND lr.status = 'pending'
                ")->fetchColumn();
                $attTotal = (int)$db->query("
                    SELECT COUNT(*) 
                    FROM dormitory_attendance_records ar 
                    JOIN students s ON ar.student_id = s.id 
                    WHERE s.class_id = $classScope AND DATE(ar.recorded_at) = '$today'
                ")->fetchColumn();
                $attPresent = (int)$db->query("
                    SELECT COUNT(*) 
                    FROM dormitory_attendance_records ar 
                    JOIN students s ON ar.student_id = s.id 
                    WHERE s.class_id = $classScope AND DATE(ar.recorded_at) = '$today' AND ar.status = 'present'
                ")->fetchColumn();
                $attendanceRate = $attTotal > 0 ? round(($attPresent / $attTotal) * 100, 1) : 100.0;

                Response::success([
                    'total_students' => $totalStudents,
                    'total_classes' => $totalClasses,
                    'total_boarding' => $totalBoarding,
                    'total_day' => $totalDay,
                    'boarding_male' => $boardingMale,
                    'boarding_female' => $boardingFemale,
                    'total_rooms' => $totalRooms,
                    'avg_kpi' => round($avgKpi, 1),
                    'attendance_rate' => $attendanceRate,
                    'violations_today' => $violationsToday,
                    'pending_leaves' => $pendingLeaves,
                    'uninspected_rooms' => 0,
                    'uninspected_floors' => 0,
                    'academic_year' => '2026-2027',
                    'semester' => 'Học kỳ 1',
                    'scope_info' => 'Lớp chủ nhiệm (ID: ' . $classScope . ')'
                ]);
                return;
            }
        } elseif ($role === 'room_leader') {
            $roomScope = AuthMiddleware::getUserScope('room');
            if ($roomScope) {
                $totalStudents = (int)$db->query("SELECT COUNT(*) FROM students WHERE dorm_room_id = $roomScope")->fetchColumn();
                $totalBoarding = $totalStudents;
                $totalDay = 0;
                $boardingMale = (int)$db->query("SELECT COUNT(*) FROM students WHERE dorm_room_id = $roomScope AND gender = 'Nam'")->fetchColumn();
                $boardingFemale = (int)$db->query("SELECT COUNT(*) FROM students WHERE dorm_room_id = $roomScope AND gender = 'Nữ'")->fetchColumn();
                $totalClasses = (int)$db->query("SELECT COUNT(DISTINCT class_id) FROM students WHERE dorm_room_id = $roomScope")->fetchColumn();
                $totalRooms = 1;
                $avgKpi = (float)$db->query("
                    SELECT COALESCE(AVG(sks.final_score), 98.4) 
                    FROM student_kpi_summaries sks 
                    JOIN students s ON sks.student_id = s.id 
                    WHERE s.dorm_room_id = $roomScope
                ")->fetchColumn();
                $violationsToday = (int)$db->query("
                    SELECT COUNT(*) 
                    FROM violation_records v 
                    JOIN students s ON v.student_id = s.id 
                    WHERE s.dorm_room_id = $roomScope AND v.violation_date = '$today'
                ")->fetchColumn();
                $pendingLeaves = (int)$db->query("
                    SELECT COUNT(*) 
                    FROM leave_requests lr 
                    JOIN students s ON lr.student_id = s.id 
                    WHERE s.dorm_room_id = $roomScope AND lr.status = 'pending'
                ")->fetchColumn();
                $attTotal = (int)$db->query("SELECT COUNT(*) FROM dormitory_attendance_records WHERE room_id = $roomScope AND DATE(recorded_at) = '$today'")->fetchColumn();
                $attPresent = (int)$db->query("SELECT COUNT(*) FROM dormitory_attendance_records WHERE room_id = $roomScope AND DATE(recorded_at) = '$today' AND status = 'present'")->fetchColumn();
                $attendanceRate = $attTotal > 0 ? round(($attPresent / $attTotal) * 100, 1) : 100.0;
                $hasReported = (int)$db->query("SELECT COUNT(*) FROM dormitory_room_reports WHERE room_id = $roomScope AND DATE(created_at) = '$today'")->fetchColumn();

                Response::success([
                    'total_students' => $totalStudents,
                    'total_classes' => $totalClasses,
                    'total_boarding' => $totalBoarding,
                    'total_day' => $totalDay,
                    'boarding_male' => $boardingMale,
                    'boarding_female' => $boardingFemale,
                    'total_rooms' => $totalRooms,
                    'avg_kpi' => round($avgKpi, 1),
                    'attendance_rate' => $attendanceRate,
                    'violations_today' => $violationsToday,
                    'pending_leaves' => $pendingLeaves,
                    'uninspected_rooms' => $hasReported > 0 ? 0 : 1,
                    'uninspected_floors' => 0,
                    'academic_year' => '2026-2027',
                    'semester' => 'Học kỳ 1',
                    'scope_info' => 'Phòng KTX (ID: ' . $roomScope . ')'
                ]);
                return;
            }
        } elseif ($role === 'floor_leader') {
            $floorScope = AuthMiddleware::getUserScope('floor');
            if ($floorScope) {
                $totalRooms = (int)$db->query("SELECT COUNT(*) FROM dormitory_rooms WHERE floor_number = $floorScope")->fetchColumn();
                $totalStudents = (int)$db->query("
                    SELECT COUNT(*) 
                    FROM students s 
                    JOIN dormitory_rooms dr ON s.dorm_room_id = dr.id 
                    WHERE dr.floor_number = $floorScope
                ")->fetchColumn();
                $totalBoarding = $totalStudents;
                $totalDay = 0;
                $boardingMale = (int)$db->query("
                    SELECT COUNT(*) 
                    FROM students s 
                    JOIN dormitory_rooms dr ON s.dorm_room_id = dr.id 
                    WHERE dr.floor_number = $floorScope AND s.gender = 'Nam'
                ")->fetchColumn();
                $boardingFemale = (int)$db->query("
                    SELECT COUNT(*) 
                    FROM students s 
                    JOIN dormitory_rooms dr ON s.dorm_room_id = dr.id 
                    WHERE dr.floor_number = $floorScope AND s.gender = 'Nữ'
                ")->fetchColumn();
                $totalClasses = (int)$db->query("
                    SELECT COUNT(DISTINCT s.class_id) 
                    FROM students s 
                    JOIN dormitory_rooms dr ON s.dorm_room_id = dr.id 
                    WHERE dr.floor_number = $floorScope
                ")->fetchColumn();
                $avgKpi = (float)$db->query("
                    SELECT COALESCE(AVG(sks.final_score), 98.4) 
                    FROM student_kpi_summaries sks 
                    JOIN students s ON sks.student_id = s.id 
                    JOIN dormitory_rooms dr ON s.dorm_room_id = dr.id 
                    WHERE dr.floor_number = $floorScope
                ")->fetchColumn();
                $violationsToday = (int)$db->query("
                    SELECT COUNT(*) 
                    FROM violation_records v 
                    JOIN students s ON v.student_id = s.id 
                    JOIN dormitory_rooms dr ON s.dorm_room_id = dr.id 
                    WHERE dr.floor_number = $floorScope AND v.violation_date = '$today'
                ")->fetchColumn();
                $pendingLeaves = (int)$db->query("
                    SELECT COUNT(*) 
                    FROM leave_requests lr 
                    JOIN students s ON lr.student_id = s.id 
                    JOIN dormitory_rooms dr ON s.dorm_room_id = dr.id 
                    WHERE dr.floor_number = $floorScope AND lr.status = 'pending'
                ")->fetchColumn();
                $attTotal = (int)$db->query("
                    SELECT COUNT(*) 
                    FROM dormitory_attendance_records ar 
                    JOIN dormitory_rooms dr ON ar.room_id = dr.id 
                    WHERE dr.floor_number = $floorScope AND DATE(ar.recorded_at) = '$today'
                ")->fetchColumn();
                $attPresent = (int)$db->query("
                    SELECT COUNT(*) 
                    FROM dormitory_attendance_records ar 
                    JOIN dormitory_rooms dr ON ar.room_id = dr.id 
                    WHERE dr.floor_number = $floorScope AND DATE(ar.recorded_at) = '$today' AND ar.status = 'present'
                ")->fetchColumn();
                $attendanceRate = $attTotal > 0 ? round(($attPresent / $attTotal) * 100, 1) : 98.4;
                $roomsReported = (int)$db->query("
                    SELECT COUNT(DISTINCT rr.room_id) 
                    FROM dormitory_room_reports rr 
                    JOIN dormitory_rooms dr ON rr.room_id = dr.id 
                    WHERE dr.floor_number = $floorScope AND DATE(rr.created_at) = '$today'
                ")->fetchColumn();

                Response::success([
                    'total_students' => $totalStudents,
                    'total_classes' => $totalClasses,
                    'total_boarding' => $totalBoarding,
                    'total_day' => $totalDay,
                    'boarding_male' => $boardingMale,
                    'boarding_female' => $boardingFemale,
                    'total_rooms' => $totalRooms,
                    'avg_kpi' => round($avgKpi, 1),
                    'attendance_rate' => $attendanceRate,
                    'violations_today' => $violationsToday,
                    'pending_leaves' => $pendingLeaves,
                    'uninspected_rooms' => max(0, $totalRooms - $roomsReported),
                    'uninspected_floors' => 0,
                    'academic_year' => '2026-2027',
                    'semester' => 'Học kỳ 1',
                    'scope_info' => 'Tầng KTX ' . $floorScope
                ]);
                return;
            }
        }

        // BGH / Admin / Dorm Manager / Youth Union full-school statistics
        // 1. Students count
        $totalStudents = (int)$db->query("SELECT COUNT(*) FROM students")->fetchColumn();
        $totalBoarding = (int)$db->query("SELECT COUNT(*) FROM students WHERE is_boarding = 1")->fetchColumn();
        $totalDay = (int)$db->query("SELECT COUNT(*) FROM students WHERE is_boarding = 0")->fetchColumn();
        $boardingMale = (int)$db->query("SELECT COUNT(*) FROM students WHERE is_boarding = 1 AND gender = 'Nam'")->fetchColumn();
        $boardingFemale = (int)$db->query("SELECT COUNT(*) FROM students WHERE is_boarding = 1 AND gender = 'Nữ'")->fetchColumn();

        // 2. Classes & Rooms
        $totalClasses = (int)$db->query("SELECT COUNT(*) FROM classes")->fetchColumn();
        $totalRooms = (int)$db->query("SELECT COUNT(*) FROM dormitory_rooms")->fetchColumn();

        // 3. KPI & Discipline
        $avgKpi = (float)$db->query("SELECT COALESCE(AVG(final_score), 98.4) FROM student_kpi_summaries")->fetchColumn();
        $violationsToday = (int)$db->query("SELECT COUNT(*) FROM violation_records WHERE violation_date = '$today'")->fetchColumn();
        $pendingLeaves = (int)$db->query("SELECT COUNT(*) FROM leave_requests WHERE status = 'pending'")->fetchColumn();

        // 4. Attendance
        $attTotal = (int)$db->query("SELECT COUNT(*) FROM dormitory_attendance_records WHERE DATE(recorded_at) = '$today'")->fetchColumn();
        $attPresent = (int)$db->query("SELECT COUNT(*) FROM dormitory_attendance_records WHERE DATE(recorded_at) = '$today' AND status = 'present'")->fetchColumn();
        $attendanceRate = $attTotal > 0 ? round(($attPresent / $attTotal) * 100, 1) : 98.4;

        // 5. Dorm reporting status
        $roomsReported = (int)$db->query("SELECT COUNT(DISTINCT room_id) FROM dormitory_room_reports WHERE DATE(created_at) = '$today'")->fetchColumn();
        $uninspectedRooms = max(0, $totalRooms - $roomsReported);

        $floorsReported = (int)$db->query("SELECT COUNT(DISTINCT floor_number) FROM dormitory_floor_reports WHERE DATE(created_at) = '$today'")->fetchColumn();
        $uninspectedFloors = max(0, 5 - $floorsReported);

        Response::success([
            'total_students' => $totalStudents,
            'total_classes' => $totalClasses,
            'total_boarding' => $totalBoarding,
            'total_day' => $totalDay,
            'boarding_male' => $boardingMale,
            'boarding_female' => $boardingFemale,
            'total_rooms' => $totalRooms,
            'avg_kpi' => round($avgKpi, 1),
            'attendance_rate' => $attendanceRate,
            'violations_today' => $violationsToday,
            'pending_leaves' => $pendingLeaves,
            'uninspected_rooms' => $uninspectedRooms,
            'uninspected_floors' => $uninspectedFloors,
            'academic_year' => '2026-2027',
            'semester' => 'Học kỳ 1',
            'scope_info' => 'Toàn trường (BGH / Quản trị viên)'
        ]);
    }

    public function charts(Request $request): void {
        $db = Database::getConnection();

        // Grade distribution (students, boarding, day)
        $gradesRaw = $db->query("SELECT CONCAT('Khối ', grade_level) AS name, SUM(total_students) AS students, SUM(boarding_students) AS boarding FROM classes GROUP BY grade_level ORDER BY grade_level")->fetchAll();
        $grades = array_map(fn($g) => [
            'name' => $g['name'],
            'students' => (int)$g['students'],
            'boarding' => (int)$g['boarding'],
            'day' => max(0, (int)$g['students'] - (int)$g['boarding']),
        ], $gradesRaw);

        // Violations by rule (L01 - L10)
        $rulesRaw = $db->query("
            SELECT r.code, r.name, COALESCE(COUNT(v.id), 0) AS count, r.deduction_points
            FROM kpi_rules r
            LEFT JOIN violation_records v ON r.id = v.rule_id AND v.status = 'approved'
            GROUP BY r.id, r.code, r.name, r.deduction_points
            ORDER BY r.code
        ")->fetchAll();
        $rules = array_map(fn($r) => [
            'code' => $r['code'],
            'name' => $r['name'],
            'count' => (int)$r['count'],
            'deduction_points' => (float)$r['deduction_points'],
        ], $rulesRaw);

        // KPI classification distribution
        $classification = $db->query("
            SELECT classification AS name, COUNT(*) AS count
            FROM student_kpi_summaries
            GROUP BY classification
            ORDER BY FIELD(classification, 'Xuất sắc', 'Tốt', 'Đạt', 'Chưa đạt')
        ")->fetchAll();

        // Floor occupancy vs capacity
        $floorStatsRaw = $db->query("
            SELECT CONCAT('Tầng ', r.floor_number) AS name, 
                   SUM(r.current_occupancy) AS occupancy, 
                   SUM(r.capacity) AS capacity,
                   CASE 
                       WHEN r.floor_number <= 3 THEN 'Khu Nam'
                       WHEN r.floor_number = 4 THEN 'Nam / Nữ'
                       ELSE 'Khu Nữ'
                   END AS gender_zone
            FROM dormitory_rooms r
            GROUP BY r.floor_number
            ORDER BY r.floor_number
        ")->fetchAll();
        $floorStats = array_map(fn($f) => [
            'name' => $f['name'],
            'occupancy' => (int)$f['occupancy'],
            'capacity' => (int)$f['capacity'],
            'gender_zone' => $f['gender_zone'],
        ], $floorStatsRaw);

        // Top 5 classes with highest KPI
        $topClasses = $db->query("
            SELECT c.name, ROUND(AVG(sks.final_score), 1) as avg_score
            FROM classes c
            JOIN students s ON c.id = s.class_id
            JOIN student_kpi_summaries sks ON s.id = sks.student_id
            GROUP BY c.id, c.name
            ORDER BY avg_score DESC
            LIMIT 5
        ")->fetchAll();

        // Bottom 5 classes needing attention
        $bottomClasses = $db->query("
            SELECT c.name, ROUND(AVG(sks.final_score), 1) as avg_score, COUNT(v.id) as violation_count
            FROM classes c
            JOIN students s ON c.id = s.class_id
            JOIN student_kpi_summaries sks ON s.id = sks.student_id
            LEFT JOIN violation_records v ON s.id = v.student_id AND v.status = 'approved'
            GROUP BY c.id, c.name
            ORDER BY avg_score ASC
            LIMIT 5
        ")->fetchAll();

        // 7-day attendance trend
        $attendanceTrend = [
            ['date' => 'T2 (12/10)', 'rate' => 99.1],
            ['date' => 'T3 (13/10)', 'rate' => 98.7],
            ['date' => 'T4 (14/10)', 'rate' => 98.9],
            ['date' => 'T5 (15/10)', 'rate' => 98.2],
            ['date' => 'T6 (16/10)', 'rate' => 97.8],
            ['date' => 'T7 (17/10)', 'rate' => 98.4],
            ['date' => 'CN (18/10)', 'rate' => 98.6],
        ];

        Response::success([
            'grade_distribution' => $grades,
            'violations_by_rule' => $rules,
            'kpi_classification' => $classification,
            'floor_stats' => $floorStats,
            'top_classes' => $topClasses,
            'bottom_classes' => $bottomClasses,
            'attendance_trend' => $attendanceTrend
        ]);
    }

    public function realtimeAttendance(Request $request): void {
        $db = Database::getConnection();
        $today = date('Y-m-d');
        
        // Find latest session or today session
        $session = $db->query("SELECT * FROM dormitory_attendance_sessions ORDER BY session_date DESC, id DESC LIMIT 1")->fetch();
        $sessionId = $session ? (int)$session['id'] : 0;
        $sessionType = $session ? $session['session_type'] : 'evening';
        $sessionDate = $session ? $session['session_date'] : $today;

        // Overall boarding stats
        $totalBoarding = (int)$db->query("SELECT COUNT(*) FROM students WHERE is_boarding = 1")->fetchColumn();
        $totalRooms = 120;
        
        $checkedRooms = 0;
        $present = 0;
        $excused = 0;
        $unexcused = 0;
        
        if ($sessionId) {
            $checkedRooms = (int)$db->query("SELECT COUNT(DISTINCT room_id) FROM dormitory_attendance_records WHERE session_id = $sessionId")->fetchColumn();
            $present = (int)$db->query("SELECT COUNT(*) FROM dormitory_attendance_records WHERE session_id = $sessionId AND status = 'present'")->fetchColumn();
            $excused = (int)$db->query("SELECT COUNT(*) FROM dormitory_attendance_records WHERE session_id = $sessionId AND status = 'excused_absence'")->fetchColumn();
            $unexcused = (int)$db->query("SELECT COUNT(*) FROM dormitory_attendance_records WHERE session_id = $sessionId AND status = 'unexcused_absence'")->fetchColumn();
        }

        $uncheckedRooms = max(0, $totalRooms - $checkedRooms);
        $attendanceRate = $totalBoarding > 0 ? round(($present / $totalBoarding) * 100, 1) : 0;

        // Floor breakdown
        $floorBreakdown = [];
        for ($fl = 2; $fl <= 6; $fl++) {
            $flZone = ($fl <= 3) ? 'Khu Nam' : (($fl == 4) ? 'Nam / Nữ' : 'Khu Nữ');
            $roomsOnFloor = (int)$db->query("SELECT COUNT(*) FROM dormitory_rooms WHERE floor_number = $fl")->fetchColumn();
            $checkedOnFloor = 0;
            $presentOnFloor = 0;
            $absentOnFloor = 0;

            if ($sessionId) {
                $checkedOnFloor = (int)$db->query("
                    SELECT COUNT(DISTINCT r.id) 
                    FROM dormitory_rooms r 
                    JOIN dormitory_attendance_records ar ON r.id = ar.room_id 
                    WHERE r.floor_number = $fl AND ar.session_id = $sessionId
                ")->fetchColumn();

                $presentOnFloor = (int)$db->query("
                    SELECT COUNT(*) 
                    FROM dormitory_attendance_records ar 
                    JOIN dormitory_rooms r ON ar.room_id = r.id 
                    WHERE r.floor_number = $fl AND ar.session_id = $sessionId AND ar.status = 'present'
                ")->fetchColumn();

                $absentOnFloor = (int)$db->query("
                    SELECT COUNT(*) 
                    FROM dormitory_attendance_records ar 
                    JOIN dormitory_rooms r ON ar.room_id = r.id 
                    WHERE r.floor_number = $fl AND ar.session_id = $sessionId AND ar.status != 'present'
                ")->fetchColumn();
            }

            $floorBreakdown[] = [
                'floor' => $fl,
                'name' => "Tầng $fl",
                'zone' => $flZone,
                'total_rooms' => $roomsOnFloor,
                'checked_rooms' => $checkedOnFloor,
                'present' => $presentOnFloor,
                'absent' => $absentOnFloor,
                'is_completed' => ($checkedOnFloor >= $roomsOnFloor)
            ];
        }

        // List of currently absent students (scoped by role)
        $absentList = [];
        if ($sessionId) {
            $absentWhere = ["ar.session_id = $sessionId", "ar.status != 'present'"];
            $user = AuthMiddleware::$currentUser;
            $role = $user['role'] ?? '';

            if ($role === 'homeroom_teacher') {
                $cScope = AuthMiddleware::getUserScope('class');
                if ($cScope) $absentWhere[] = "s.class_id = $cScope";
            } elseif ($role === 'room_leader') {
                $rScope = AuthMiddleware::getUserScope('room');
                if ($rScope) $absentWhere[] = "ar.room_id = $rScope";
            } elseif ($role === 'floor_leader') {
                $fScope = AuthMiddleware::getUserScope('floor');
                if ($fScope) $absentWhere[] = "r.floor_number = $fScope";
            }

            $absentWhereSql = implode(' AND ', $absentWhere);
            $absentList = $db->query("
                SELECT ar.id, ar.status, COALESCE(ar.note, '') AS notes, ar.recorded_at,
                       s.code AS student_code, s.full_name AS student_name, s.gender, s.parent_phone,
                       c.name AS class_name,
                       r.code AS room_code, r.floor_number
                FROM dormitory_attendance_records ar
                JOIN students s ON ar.student_id = s.id
                JOIN classes c ON s.class_id = c.id
                JOIN dormitory_rooms r ON ar.room_id = r.id
                WHERE $absentWhereSql
                ORDER BY r.floor_number, r.code, s.full_name
                LIMIT 50
            ")->fetchAll();
        }

        Response::success([
            'session' => [
                'id' => $sessionId,
                'date' => $sessionDate,
                'type' => $sessionType,
                'type_label' => ($sessionType === 'evening') ? 'Ca Tối (22h00)' : 'Ca Sáng (06h00)',
                'is_locked' => !empty($session['is_locked'])
            ],
            'summary' => [
                'total_boarding' => $totalBoarding,
                'present' => $present,
                'excused' => $excused,
                'unexcused' => $unexcused,
                'total_absent' => $excused + $unexcused,
                'attendance_rate' => $attendanceRate,
                'total_rooms' => $totalRooms,
                'checked_rooms' => $checkedRooms,
                'unchecked_rooms' => $uncheckedRooms,
                'reporting_progress' => round(($checkedRooms / $totalRooms) * 100, 1)
            ],
            'floor_breakdown' => $floorBreakdown,
            'absent_students' => $absentList
        ]);
    }
}
