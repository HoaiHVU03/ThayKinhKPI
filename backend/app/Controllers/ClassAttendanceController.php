<?php
// backend/app/Controllers/ClassAttendanceController.php

namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Middleware\AuthMiddleware;
use PDO;

class ClassAttendanceController {
    /**
     * Get attendance overview and statistics for classes on a given date
     */
    public function sessions(Request $request): void {
        $db = Database::getConnection();
        $user = AuthMiddleware::$currentUser;

        $date = $request->get('date', date('Y-m-d'));
        $grade = $request->get('grade');
        $search = trim($request->get('search', ''));

        $where = ['1=1'];
        $params = [];

        // Role scoping
        if ($user && in_array($user['role'], ['homeroom_teacher', 'class_cadre', 'student'])) {
            $classScope = AuthMiddleware::getUserScope('class');
            if ($classScope) {
                $where[] = "c.id = ?";
                $params[] = $classScope;
            }
        } elseif ($user && in_array($user['role'], ['room_leader', 'floor_leader'])) {
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

        if ($search !== '') {
            $where[] = "(c.code LIKE ? OR c.name LIKE ? OR t.full_name LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        $whereClause = implode(' AND ', $where);

        // Fetch classes with their session for the date
        $sql = "
            SELECT c.id AS class_id, c.code AS class_code, c.name AS class_name, c.grade_level,
                   c.room_location, c.total_students AS class_student_count,
                   t.id AS teacher_id, t.full_name AS teacher_name, t.phone AS teacher_phone,
                   cas.id AS session_id, cas.session_date, cas.session_time, cas.shift_name,
                   COALESCE(cas.total_students, c.total_students) AS total_students,
                   COALESCE(cas.present_count, 0) AS present_count,
                   COALESCE(cas.excused_count, 0) AS excused_count,
                   COALESCE(cas.unexcused_count, 0) AS unexcused_count,
                   COALESCE(cas.late_count, 0) AS late_count,
                   COALESCE(cas.status, 'unrecorded') AS session_status,
                   cas.notes, cas.updated_at,
                   u.full_name AS recorder_name
            FROM classes c
            LEFT JOIN teachers t ON c.homeroom_teacher_id = t.id
            LEFT JOIN class_attendance_sessions cas ON c.id = cas.class_id AND cas.session_date = ?
            LEFT JOIN users u ON cas.recorded_by_user_id = u.id
            WHERE $whereClause
            ORDER BY c.grade_level ASC, c.id ASC
        ";

        $stmt = $db->prepare($sql);
        $queryParams = array_merge([$date], $params);
        $stmt->execute($queryParams);
        $items = $stmt->fetchAll();

        // Calculate aggregate statistics for this date
        $totalClasses = count($items);
        $completedClasses = 0;
        $totalStudents = 0;
        $totalPresent = 0;
        $totalExcused = 0;
        $totalUnexcused = 0;
        $totalLate = 0;

        $gradeBreakdown = [
            10 => ['grade' => 10, 'classes' => 0, 'completed' => 0, 'total' => 0, 'present' => 0, 'excused' => 0, 'unexcused' => 0, 'late' => 0],
            11 => ['grade' => 11, 'classes' => 0, 'completed' => 0, 'total' => 0, 'present' => 0, 'excused' => 0, 'unexcused' => 0, 'late' => 0],
            12 => ['grade' => 12, 'classes' => 0, 'completed' => 0, 'total' => 0, 'present' => 0, 'excused' => 0, 'unexcused' => 0, 'late' => 0],
        ];

        foreach ($items as $row) {
            $g = (int)$row['grade_level'];
            $stCount = (int)$row['total_students'];
            $isDone = ($row['session_status'] === 'completed');

            $totalStudents += $stCount;
            if ($isDone) {
                $completedClasses++;
                $totalPresent += (int)$row['present_count'];
                $totalExcused += (int)$row['excused_count'];
                $totalUnexcused += (int)$row['unexcused_count'];
                $totalLate += (int)$row['late_count'];
            }

            if (isset($gradeBreakdown[$g])) {
                $gradeBreakdown[$g]['classes']++;
                $gradeBreakdown[$g]['total'] += $stCount;
                if ($isDone) {
                    $gradeBreakdown[$g]['completed']++;
                    $gradeBreakdown[$g]['present'] += (int)$row['present_count'];
                    $gradeBreakdown[$g]['excused'] += (int)$row['excused_count'];
                    $gradeBreakdown[$g]['unexcused'] += (int)$row['unexcused_count'];
                    $gradeBreakdown[$g]['late'] += (int)$row['late_count'];
                }
            }
        }

        // Attendance rate calculation
        $checkedStudents = $totalPresent + $totalExcused + $totalUnexcused + $totalLate;
        $attendanceRate = $checkedStudents > 0 ? round(($totalPresent / $checkedStudents) * 100, 1) : 0.0;

        // 7-day trend
        $trendDates = [];
        for ($i = 6; $i >= 0; $i--) {
            $trendDates[] = date('Y-m-d', strtotime("-$i days", strtotime($date)));
        }

        $trendSql = "
            SELECT session_date,
                   SUM(total_students) AS total,
                   SUM(present_count) AS present,
                   SUM(excused_count) AS excused,
                   SUM(unexcused_count) AS unexcused,
                   SUM(late_count) AS late
            FROM class_attendance_sessions
            WHERE session_date IN ('" . implode("','", $trendDates) . "')
            GROUP BY session_date
            ORDER BY session_date ASC
        ";
        $trendRows = $db->query($trendSql)->fetchAll();
        $trendMap = [];
        foreach ($trendRows as $tr) {
            $tot = (int)$tr['total'];
            $pre = (int)$tr['present'];
            $trendMap[$tr['session_date']] = [
                'date' => $tr['session_date'],
                'date_formatted' => date('d/m', strtotime($tr['session_date'])),
                'present' => $pre,
                'excused' => (int)$tr['excused'],
                'unexcused' => (int)$tr['unexcused'],
                'late' => (int)$tr['late'],
                'rate' => $tot > 0 ? round(($pre / $tot) * 100, 1) : 0,
            ];
        }

        $trend7Days = [];
        foreach ($trendDates as $td) {
            if (isset($trendMap[$td])) {
                $trend7Days[] = $trendMap[$td];
            } else {
                $trend7Days[] = [
                    'date' => $td,
                    'date_formatted' => date('d/m', strtotime($td)),
                    'present' => 0,
                    'excused' => 0,
                    'unexcused' => 0,
                    'late' => 0,
                    'rate' => 0,
                ];
            }
        }

        Response::success([
            'date' => $date,
            'items' => $items,
            'statistics' => [
                'total_classes' => $totalClasses,
                'completed_classes' => $completedClasses,
                'pending_classes' => $totalClasses - $completedClasses,
                'total_students' => $totalStudents,
                'present_count' => $totalPresent,
                'excused_count' => $totalExcused,
                'unexcused_count' => $totalUnexcused,
                'late_count' => $totalLate,
                'attendance_rate' => $attendanceRate,
                'grade_breakdown' => array_values($gradeBreakdown),
                'trend_7days' => $trend7Days
            ]
        ]);
    }

    /**
     * Get multi-dimensional attendance statistics:
     * - Time dimension: day, week, month
     * - Scope dimension: individual class, grade (10, 11, 12), all school (54 classes)
     */
    public function statistics(Request $request): void {
        $db = Database::getConnection();
        $user = AuthMiddleware::$currentUser;

        $periodType = $request->get('period_type', 'day'); // 'day' | 'week' | 'month'
        $refDate = $request->get('date', date('Y-m-d'));
        $scope = $request->get('scope', 'school'); // 'school' | 'grade' | 'class'
        $grade = $request->get('grade'); // '10' | '11' | '12' | null | 'all'
        $classId = $request->get('class_id'); // integer | null | 'all'

        // Role scoping
        if ($user && $user['role'] === 'homeroom_teacher') {
            $classScope = AuthMiddleware::getUserScope('class');
            if ($classScope) {
                $classId = (string)$classScope;
                $scope = 'class';
            }
        }

        // Calculate from_date and to_date based on periodType
        $ts = strtotime($refDate);
        if ($ts === false) $ts = time();

        if ($periodType === 'week') {
            $dayOfWeek = (int)date('N', $ts); // 1 (Mon) to 7 (Sun)
            $fromDate = date('Y-m-d', strtotime('-' . ($dayOfWeek - 1) . ' days', $ts));
            $toDate = date('Y-m-d', strtotime('+' . (7 - $dayOfWeek) . ' days', $ts));
            $weekNum = date('W', $ts);
            $label = "Tuần $weekNum (" . date('d/m', strtotime($fromDate)) . " - " . date('d/m/Y', strtotime($toDate)) . ")";
        } elseif ($periodType === 'month') {
            $fromDate = date('Y-m-01', $ts);
            $toDate = date('Y-m-t', $ts);
            $label = "Tháng " . date('m/Y', $ts) . " (" . date('d/m', strtotime($fromDate)) . " - " . date('d/m/Y', strtotime($toDate)) . ")";
        } else {
            // Day
            $fromDate = date('Y-m-d', $ts);
            $toDate = date('Y-m-d', $ts);
            $dayNames = [
                'Mon' => 'Thứ Hai', 'Tue' => 'Thứ Ba', 'Wed' => 'Thứ Tư',
                'Thu' => 'Thứ Năm', 'Fri' => 'Thứ Sáu', 'Sat' => 'Thứ Bảy', 'Sun' => 'Chủ Nhật'
            ];
            $dEn = date('D', $ts);
            $label = ($dayNames[$dEn] ?? '') . ", Ngày " . date('d/m/Y', $ts);
        }

        // Allow manual override of from_date / to_date if passed
        if ($request->get('from_date') && $request->get('to_date')) {
            $fromDate = $request->get('from_date');
            $toDate = $request->get('to_date');
            $label = "Từ " . date('d/m/Y', strtotime($fromDate)) . " đến " . date('d/m/Y', strtotime($toDate));
        }

        // Base class where clause
        $cWhere = ['1=1'];
        $cParams = [];

        if ($scope === 'class' && $classId && $classId !== 'all') {
            $cWhere[] = "c.id = ?";
            $cParams[] = (int)$classId;
        } elseif ($scope === 'grade' && $grade && $grade !== 'all') {
            $cWhere[] = "c.grade_level = ?";
            $cParams[] = (int)$grade;
        } elseif ($grade && $grade !== 'all') {
            $cWhere[] = "c.grade_level = ?";
            $cParams[] = (int)$grade;
        }

        $cWhereSql = implode(' AND ', $cWhere);

        // Fetch classes under scope
        $classStmt = $db->prepare("
            SELECT c.id, c.code, c.name, c.grade_level, c.room_location, c.total_students,
                   t.full_name AS teacher_name, t.phone AS teacher_phone
            FROM classes c
            LEFT JOIN teachers t ON c.homeroom_teacher_id = t.id
            WHERE $cWhereSql
            ORDER BY c.grade_level ASC, c.id ASC
        ");
        $classStmt->execute($cParams);
        $classes = $classStmt->fetchAll();
        $classIds = array_column($classes, 'id');

        if (empty($classIds)) {
            $classIds = [-1];
        }

        $inClassIds = implode(',', array_map('intval', $classIds));

        // Fetch all completed sessions in date range for these classes
        $sessSql = "
            SELECT cas.id, cas.class_id, cas.session_date, cas.session_time, cas.total_students,
                   cas.present_count, cas.excused_count, cas.unexcused_count, cas.late_count,
                   cas.status, cas.notes, cas.updated_at,
                   c.grade_level, c.code AS class_code, c.name AS class_name
            FROM class_attendance_sessions cas
            JOIN classes c ON cas.class_id = c.id
            WHERE cas.session_date >= ? AND cas.session_date <= ?
              AND cas.class_id IN ($inClassIds)
              AND cas.status = 'completed'
            ORDER BY cas.session_date ASC, c.grade_level ASC, c.id ASC
        ";
        $sessStmt = $db->prepare($sessSql);
        $sessStmt->execute([$fromDate, $toDate]);
        $sessionRows = $sessStmt->fetchAll();

        // Calculate summary
        $totalStudents = array_sum(array_column($classes, 'total_students'));
        $totalSessions = count($sessionRows);
        $totalPresent = 0;
        $totalExcused = 0;
        $totalUnexcused = 0;
        $totalLate = 0;

        // Group by class
        $classStatsMap = [];
        foreach ($classes as $c) {
            $classStatsMap[$c['id']] = [
                'class_id' => $c['id'],
                'class_code' => $c['code'],
                'class_name' => $c['name'],
                'grade_level' => (int)$c['grade_level'],
                'room_location' => $c['room_location'] ?: 'Nhà A',
                'teacher_name' => $c['teacher_name'] ?: 'Chưa phân công',
                'teacher_phone' => $c['teacher_phone'] ?: '',
                'total_students' => (int)$c['total_students'],
                'sessions_count' => 0,
                'present_count' => 0,
                'excused_count' => 0,
                'unexcused_count' => 0,
                'late_count' => 0,
                'last_session_time' => null,
                'last_updated_at' => null,
                'attendance_rate' => 0.0,
            ];
        }

        // Group by grade
        $gradeStatsMap = [
            10 => ['grade' => 10, 'classes_count' => 0, 'students_count' => 0, 'sessions_count' => 0, 'present_count' => 0, 'excused_count' => 0, 'unexcused_count' => 0, 'late_count' => 0, 'attendance_rate' => 0.0],
            11 => ['grade' => 11, 'classes_count' => 0, 'students_count' => 0, 'sessions_count' => 0, 'present_count' => 0, 'excused_count' => 0, 'unexcused_count' => 0, 'late_count' => 0, 'attendance_rate' => 0.0],
            12 => ['grade' => 12, 'classes_count' => 0, 'students_count' => 0, 'sessions_count' => 0, 'present_count' => 0, 'excused_count' => 0, 'unexcused_count' => 0, 'late_count' => 0, 'attendance_rate' => 0.0],
        ];

        foreach ($classes as $c) {
            $g = (int)$c['grade_level'];
            if (isset($gradeStatsMap[$g])) {
                $gradeStatsMap[$g]['classes_count']++;
                $gradeStatsMap[$g]['students_count'] += (int)$c['total_students'];
            }
        }

        // Group by date (Timeline)
        $dateStatsMap = [];
        $curDateTs = strtotime($fromDate);
        $endDateTs = strtotime($toDate);
        while ($curDateTs <= $endDateTs) {
            $dStr = date('Y-m-d', $curDateTs);
            $dEn = date('D', $curDateTs);
            $dayNamesShort = [
                'Mon' => 'T2', 'Tue' => 'T3', 'Wed' => 'T4', 'Thu' => 'T5', 'Fri' => 'T6', 'Sat' => 'T7', 'Sun' => 'CN'
            ];
            $dateStatsMap[$dStr] = [
                'date' => $dStr,
                'date_formatted' => date('d/m', $curDateTs),
                'day_name' => $dayNamesShort[$dEn] ?? '',
                'sessions_count' => 0,
                'present_count' => 0,
                'excused_count' => 0,
                'unexcused_count' => 0,
                'late_count' => 0,
                'rate' => 0.0
            ];
            $curDateTs = strtotime('+1 day', $curDateTs);
        }

        foreach ($sessionRows as $row) {
            $cId = (int)$row['class_id'];
            $g = (int)$row['grade_level'];
            $d = $row['session_date'];
            $p = (int)$row['present_count'];
            $e = (int)$row['excused_count'];
            $u = (int)$row['unexcused_count'];
            $l = (int)$row['late_count'];

            $totalPresent += $p;
            $totalExcused += $e;
            $totalUnexcused += $u;
            $totalLate += $l;

            // Class map
            if (isset($classStatsMap[$cId])) {
                $classStatsMap[$cId]['sessions_count']++;
                $classStatsMap[$cId]['present_count'] += $p;
                $classStatsMap[$cId]['excused_count'] += $e;
                $classStatsMap[$cId]['unexcused_count'] += $u;
                $classStatsMap[$cId]['late_count'] += $l;
                $classStatsMap[$cId]['last_session_time'] = $row['session_time'] ?: '07:00';
                $classStatsMap[$cId]['last_updated_at'] = $row['updated_at'];
            }

            // Grade map
            if (isset($gradeStatsMap[$g])) {
                $gradeStatsMap[$g]['sessions_count']++;
                $gradeStatsMap[$g]['present_count'] += $p;
                $gradeStatsMap[$g]['excused_count'] += $e;
                $gradeStatsMap[$g]['unexcused_count'] += $u;
                $gradeStatsMap[$g]['late_count'] += $l;
            }

            // Date map
            if (isset($dateStatsMap[$d])) {
                $dateStatsMap[$d]['sessions_count']++;
                $dateStatsMap[$d]['present_count'] += $p;
                $dateStatsMap[$d]['excused_count'] += $e;
                $dateStatsMap[$d]['unexcused_count'] += $u;
                $dateStatsMap[$d]['late_count'] += $l;
            }
        }

        // Calculate rates
        $totalChecked = $totalPresent + $totalExcused + $totalUnexcused + $totalLate;
        $overallRate = $totalChecked > 0 ? round(($totalPresent / $totalChecked) * 100, 1) : 0.0;

        foreach ($classStatsMap as &$cs) {
            $chk = $cs['present_count'] + $cs['excused_count'] + $cs['unexcused_count'] + $cs['late_count'];
            $cs['attendance_rate'] = $chk > 0 ? round(($cs['present_count'] / $chk) * 100, 1) : 0.0;
        }
        unset($cs);

        foreach ($gradeStatsMap as &$gs) {
            $chk = $gs['present_count'] + $gs['excused_count'] + $gs['unexcused_count'] + $gs['late_count'];
            $gs['attendance_rate'] = $chk > 0 ? round(($gs['present_count'] / $chk) * 100, 1) : 0.0;
        }
        unset($gs);

        foreach ($dateStatsMap as &$ds) {
            $chk = $ds['present_count'] + $ds['excused_count'] + $ds['unexcused_count'] + $ds['late_count'];
            $ds['rate'] = $chk > 0 ? round(($ds['present_count'] / $chk) * 100, 1) : 0.0;
        }
        unset($ds);

        // Top absent students in the period
        $topAbsentSql = "
            SELECT s.id, s.code, s.full_name, s.gender, s.parent_name, s.parent_phone,
                   c.code AS class_code, c.name AS class_name, c.grade_level,
                   SUM(CASE WHEN car.status = 'excused_absence' THEN 1 ELSE 0 END) AS excused_count,
                   SUM(CASE WHEN car.status = 'unexcused_absence' THEN 1 ELSE 0 END) AS unexcused_count,
                   SUM(CASE WHEN car.status = 'late' THEN 1 ELSE 0 END) AS late_count,
                   COUNT(car.id) AS total_issues
            FROM class_attendance_records car
            JOIN class_attendance_sessions cas ON car.session_id = cas.id
            JOIN students s ON car.student_id = s.id
            JOIN classes c ON car.class_id = c.id
            WHERE cas.session_date >= ? AND cas.session_date <= ?
              AND car.class_id IN ($inClassIds)
              AND car.status IN ('excused_absence', 'unexcused_absence', 'late')
            GROUP BY s.id, s.code, s.full_name, s.gender, s.parent_name, s.parent_phone, c.code, c.name, c.grade_level
            ORDER BY total_issues DESC, unexcused_count DESC, late_count DESC
            LIMIT 20
        ";
        $topStmt = $db->prepare($topAbsentSql);
        $topStmt->execute([$fromDate, $toDate]);
        $topAbsentStudents = $topStmt->fetchAll();

        // Sort class rankings by attendance_rate desc
        $classList = array_values($classStatsMap);
        usort($classList, function($a, $b) {
            if ($b['attendance_rate'] == $a['attendance_rate']) {
                return $a['unexcused_count'] <=> $b['unexcused_count'];
            }
            return ($b['attendance_rate'] < $a['attendance_rate']) ? -1 : 1;
        });

        Response::success([
            'period' => [
                'type' => $periodType,
                'date' => $refDate,
                'from_date' => $fromDate,
                'to_date' => $toDate,
                'label' => $label,
            ],
            'scope' => [
                'level' => $scope, // 'school' | 'grade' | 'class'
                'grade' => $grade ?: 'all',
                'class_id' => $classId ?: 'all',
            ],
            'summary' => [
                'total_classes' => count($classes),
                'total_students' => $totalStudents,
                'total_sessions_recorded' => $totalSessions,
                'total_present' => $totalPresent,
                'total_excused' => $totalExcused,
                'total_unexcused' => $totalUnexcused,
                'total_late' => $totalLate,
                'attendance_rate' => $overallRate,
            ],
            'grade_breakdown' => array_values($gradeStatsMap),
            'class_breakdown' => $classList,
            'timeline' => array_values($dateStatsMap),
            'top_absent_students' => $topAbsentStudents,
        ]);
    }

    /**
     * Get student list of a specific class for roll-call attendance
     */
    public function classStudents(Request $request, string $classId): void {
        $db = Database::getConnection();
        $user = AuthMiddleware::$currentUser;
        $classIdInt = (int)$classId;

        // Scoping
        if ($user && in_array($user['role'], ['homeroom_teacher', 'class_cadre', 'student'])) {
            $classScope = AuthMiddleware::getUserScope('class');
            if ($classScope && $classScope !== $classIdInt) {
                Response::forbidden('Bạn chỉ có quyền xem lớp của mình');
                return;
            }
        }

        $date = $request->get('date', date('Y-m-d'));

        // Class info
        $classStmt = $db->prepare("
            SELECT c.*, t.full_name AS teacher_name, t.phone AS teacher_phone
            FROM classes c
            LEFT JOIN teachers t ON c.homeroom_teacher_id = t.id
            WHERE c.id = ?
        ");
        $classStmt->execute([$classIdInt]);
        $class = $classStmt->fetch();

        if (!$class) {
            Response::notFound('Không tìm thấy lớp học');
            return;
        }

        // Session info if already created
        $sessStmt = $db->prepare("
            SELECT cas.*, u.full_name AS recorder_name
            FROM class_attendance_sessions cas
            LEFT JOIN users u ON cas.recorded_by_user_id = u.id
            WHERE cas.class_id = ? AND cas.session_date = ?
        ");
        $sessStmt->execute([$classIdInt, $date]);
        $session = $sessStmt->fetch();

        // Students with attendance status for this date
        $stStmt = $db->prepare("
            SELECT s.id, s.code, s.full_name, s.dob, s.gender, s.is_boarding,
                   dr.code AS room_code, s.parent_name, s.parent_phone, s.student_phone,
                   COALESCE(sks.final_score, 100.0) AS kpi_score,
                   COALESCE(car.status, 'present') AS attendance_status,
                   COALESCE(car.note, '') AS attendance_note,
                   car.recorded_at
            FROM students s
            LEFT JOIN dormitory_rooms dr ON s.dorm_room_id = dr.id
            LEFT JOIN student_kpi_summaries sks ON s.id = sks.student_id
            LEFT JOIN (
                SELECT car_inner.* 
                FROM class_attendance_records car_inner
                JOIN class_attendance_sessions cas_inner ON car_inner.session_id = cas_inner.id
                WHERE cas_inner.class_id = ? AND cas_inner.session_date = ?
            ) car ON s.id = car.student_id
            WHERE s.class_id = ?
            ORDER BY SUBSTRING_INDEX(TRIM(s.full_name), ' ', -1) ASC, s.full_name ASC
        ");
        $stStmt->execute([$classIdInt, $date, $classIdInt]);
        $students = $stStmt->fetchAll();

        Response::success([
            'class' => $class,
            'session' => $session ?: [
                'id' => null,
                'class_id' => $classIdInt,
                'session_date' => $date,
                'session_time' => '07:00',
                'shift_name' => 'Đầu giờ sáng',
                'total_students' => count($students),
                'present_count' => count($students),
                'excused_count' => 0,
                'unexcused_count' => 0,
                'late_count' => 0,
                'status' => 'unrecorded',
                'notes' => ''
            ],
            'students' => $students
        ]);
    }

    /**
     * Save / update roll call attendance for a class
     */
    public function saveAttendance(Request $request, string $classId): void {
        $db = Database::getConnection();
        $user = AuthMiddleware::$currentUser;
        $classIdInt = (int)$classId;

        // Scoping check
        if ($user && $user['role'] === 'student') {
            Response::forbidden('Học sinh chỉ có quyền xem, không được phép điểm danh');
            return;
        } elseif ($user && in_array($user['role'], ['homeroom_teacher', 'class_cadre'])) {
            $classScope = AuthMiddleware::getUserScope('class');
            if ($classScope && $classScope !== $classIdInt) {
                Response::forbidden('Bạn chỉ có quyền điểm danh cho lớp của mình');
                return;
            }
        } elseif ($user && in_array($user['role'], ['dorm_manager', 'room_leader', 'floor_leader'])) {
            Response::forbidden('Quản sinh/Ban quản lý KTX không có quyền điểm danh lớp học');
            return;
        }

        $sessionDate = $request->input('session_date', date('Y-m-d'));
        $sessionTime = $request->input('session_time') ?: date('H:i');
        $shiftName = $request->input('shift_name', 'Đầu giờ sáng');
        $notes = trim($request->input('notes', ''));
        $records = $request->input('records', []); // Array of { student_id, status, note }

        if (empty($records)) {
            Response::error('Danh sách học sinh điểm danh không được để trống', 422);
            return;
        }

        // Count statuses
        $totalStudents = count($records);
        $presentCount = 0;
        $excusedCount = 0;
        $unexcusedCount = 0;
        $lateCount = 0;

        foreach ($records as $r) {
            $st = $r['status'] ?? 'present';
            if ($st === 'present') $presentCount++;
            elseif ($st === 'excused_absence') $excusedCount++;
            elseif ($st === 'unexcused_absence') $unexcusedCount++;
            elseif ($st === 'late') $lateCount++;
            else $presentCount++;
        }

        $db->beginTransaction();
        try {
            // Upsert session
            $sessStmt = $db->prepare("
                INSERT INTO class_attendance_sessions (
                    class_id, session_date, session_time, shift_name, total_students,
                    present_count, excused_count, unexcused_count, late_count, status, notes, recorded_by_user_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)
                ON DUPLICATE KEY UPDATE
                    session_time = VALUES(session_time),
                    shift_name = VALUES(shift_name),
                    total_students = VALUES(total_students),
                    present_count = VALUES(present_count),
                    excused_count = VALUES(excused_count),
                    unexcused_count = VALUES(unexcused_count),
                    late_count = VALUES(late_count),
                    status = 'completed',
                    notes = VALUES(notes),
                    recorded_by_user_id = VALUES(recorded_by_user_id),
                    updated_at = NOW()
            ");
            $sessStmt->execute([
                $classIdInt, $sessionDate, $sessionTime, $shiftName, $totalStudents,
                $presentCount, $excusedCount, $unexcusedCount, $lateCount, $notes, $user['id'] ?? 1
            ]);

            // Get session ID
            $sessionId = (int)$db->lastInsertId();
            if ($sessionId === 0) {
                $chk = $db->prepare("SELECT id FROM class_attendance_sessions WHERE class_id = ? AND session_date = ?");
                $chk->execute([$classIdInt, $sessionDate]);
                $sessionId = (int)$chk->fetchColumn();
            }

            // Upsert records
            $recStmt = $db->prepare("
                INSERT INTO class_attendance_records (
                    session_id, class_id, student_id, status, note, recorded_by_user_id, recorded_at
                ) VALUES (?, ?, ?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE
                    status = VALUES(status),
                    note = VALUES(note),
                    recorded_by_user_id = VALUES(recorded_by_user_id),
                    recorded_at = NOW()
            ");

            foreach ($records as $rec) {
                $studentId = (int)$rec['student_id'];
                $status = in_array($rec['status'], ['present', 'excused_absence', 'unexcused_absence', 'late']) ? $rec['status'] : 'present';
                $note = trim($rec['note'] ?? '');
                $recStmt->execute([$sessionId, $classIdInt, $studentId, $status, $note ?: null, $user['id'] ?? 1]);
            }

            // Audit log
            $db->prepare("
                INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
                VALUES (?, 'CLASS_ATTENDANCE_SAVED', 'class_attendance_sessions', ?, ?)
            ")->execute([
                $user['id'] ?? 1,
                $sessionId,
                "Chốt điểm danh đầu giờ lớp $classIdInt ngày $sessionDate: Có mặt $presentCount, Có phép $excusedCount, Không phép $unexcusedCount, Muộn $lateCount"
            ]);

            $db->commit();
            Response::success([
                'session_id' => $sessionId,
                'present_count' => $presentCount,
                'excused_count' => $excusedCount,
                'unexcused_count' => $unexcusedCount,
                'late_count' => $lateCount,
            ], 'Đã chốt sổ điểm danh đầu giờ thành công');
        } catch (\Exception $e) {
            $db->rollBack();
            Response::error('Lỗi khi lưu điểm danh: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Mark 100% students in a class as present with 1 touch
     */
    public function markAllPresent(Request $request, string $classId): void {
        $db = Database::getConnection();
        $user = AuthMiddleware::$currentUser;
        $classIdInt = (int)$classId;

        if ($user && $user['role'] === 'student') {
            Response::forbidden('Học sinh chỉ có quyền xem, không được phép điểm danh');
            return;
        } elseif ($user && in_array($user['role'], ['homeroom_teacher', 'class_cadre'])) {
            $classScope = AuthMiddleware::getUserScope('class');
            if ($classScope && $classScope !== $classIdInt) {
                Response::forbidden('Bạn chỉ có quyền điểm danh lớp của mình');
                return;
            }
        } elseif ($user && in_array($user['role'], ['dorm_manager', 'room_leader', 'floor_leader'])) {
            Response::forbidden('Tài khoản quản lý KTX không có quyền điểm danh lớp học');
            return;
        }

        $sessionDate = $request->input('session_date', date('Y-m-d'));
        $sessionTime = $request->input('session_time') ?: date('H:i');
        $students = $db->query("SELECT id FROM students WHERE class_id = $classIdInt")->fetchAll();
        $total = count($students);

        if ($total === 0) {
            Response::error('Lớp chưa có học sinh', 400);
            return;
        }

        $db->beginTransaction();
        try {
            $sessStmt = $db->prepare("
                INSERT INTO class_attendance_sessions (
                    class_id, session_date, session_time, shift_name, total_students,
                    present_count, excused_count, unexcused_count, late_count, status, notes, recorded_by_user_id
                ) VALUES (?, ?, ?, 'Đầu giờ sáng', ?, ?, 0, 0, 0, 'completed', '1 chạm - Cả lớp có mặt đầy đủ', ?)
                ON DUPLICATE KEY UPDATE
                    session_time = VALUES(session_time),
                    total_students = VALUES(total_students),
                    present_count = VALUES(present_count),
                    excused_count = 0,
                    unexcused_count = 0,
                    late_count = 0,
                    status = 'completed',
                    notes = '1 chạm - Cả lớp có mặt đầy đủ',
                    recorded_by_user_id = VALUES(recorded_by_user_id),
                    updated_at = NOW()
            ");
            $sessStmt->execute([$classIdInt, $sessionDate, $sessionTime, $total, $total, $user['id'] ?? 1]);

            $sessionId = (int)$db->lastInsertId();
            if ($sessionId === 0) {
                $chk = $db->prepare("SELECT id FROM class_attendance_sessions WHERE class_id = ? AND session_date = ?");
                $chk->execute([$classIdInt, $sessionDate]);
                $sessionId = (int)$chk->fetchColumn();
            }

            $recStmt = $db->prepare("
                INSERT INTO class_attendance_records (
                    session_id, class_id, student_id, status, note, recorded_by_user_id, recorded_at
                ) VALUES (?, ?, ?, 'present', NULL, ?, NOW())
                ON DUPLICATE KEY UPDATE
                    status = 'present',
                    note = NULL,
                    recorded_by_user_id = VALUES(recorded_by_user_id),
                    recorded_at = NOW()
            ");

            foreach ($students as $st) {
                $recStmt->execute([$sessionId, $classIdInt, (int)$st['id'], $user['id'] ?? 1]);
            }

            $db->commit();
            Response::success(null, "Đã ghi nhận 1 CHẠM — ĐỦ MẶT 100% ($total học sinh) cho lớp!");
        } catch (\Exception $e) {
            $db->rollBack();
            Response::error('Lỗi: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get list of all absent or late students for real-time tracking
     */
    public function absentList(Request $request): void {
        $db = Database::getConnection();
        $user = AuthMiddleware::$currentUser;

        $date = $request->get('date', date('Y-m-d'));
        $statusFilter = $request->get('status'); // 'unexcused_absence', 'excused_absence', 'late', or null
        $grade = $request->get('grade');

        $where = ["cas.session_date = ?", "car.status IN ('unexcused_absence', 'excused_absence', 'late')"];
        $params = [$date];

        if ($user && $user['role'] === 'homeroom_teacher') {
            $classScope = AuthMiddleware::getUserScope('class');
            if ($classScope) {
                $where[] = "c.id = ?";
                $params[] = $classScope;
            }
        }

        if ($statusFilter) {
            $where[] = "car.status = ?";
            $params[] = $statusFilter;
        }

        if ($grade) {
            $where[] = "c.grade_level = ?";
            $params[] = (int)$grade;
        }

        $whereClause = implode(' AND ', $where);

        $sql = "
            SELECT car.id AS record_id, car.status, car.note, car.recorded_at,
                   s.id AS student_id, s.code AS student_code, s.full_name AS student_name,
                   s.gender, s.parent_name, s.parent_phone, s.student_phone, s.is_boarding,
                   dr.code AS room_code,
                   c.id AS class_id, c.code AS class_code, c.name AS class_name, c.grade_level,
                   t.full_name AS teacher_name, t.phone AS teacher_phone
            FROM class_attendance_records car
            JOIN class_attendance_sessions cas ON car.session_id = cas.id
            JOIN students s ON car.student_id = s.id
            JOIN classes c ON car.class_id = c.id
            LEFT JOIN teachers t ON c.homeroom_teacher_id = t.id
            LEFT JOIN dormitory_rooms dr ON s.dorm_room_id = dr.id
            WHERE $whereClause
            ORDER BY c.grade_level ASC, c.id ASC, car.status ASC, SUBSTRING_INDEX(TRIM(s.full_name), ' ', -1) ASC, s.full_name ASC
        ";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $items = $stmt->fetchAll();

        Response::success([
            'date' => $date,
            'total' => count($items),
            'items' => $items
        ]);
    }

    /**
     * Quick-create a KPI violation ticket directly from an attendance issue
     */
    public function createViolation(Request $request): void {
        $db = Database::getConnection();
        $user = AuthMiddleware::$currentUser;

        $studentId = (int)$request->input('student_id');
        $ruleCode = trim($request->input('rule_code', 'L01')); // L01: Muộn, L04: Vắng không phép
        $date = $request->input('date', date('Y-m-d'));
        $note = trim($request->input('note', ''));

        if (!$studentId) {
            Response::error('Mã học sinh không hợp lệ', 422);
            return;
        }

        $student = $db->query("SELECT id, code, full_name, class_id FROM students WHERE id = $studentId")->fetch();
        if (!$student) {
            Response::notFound('Học sinh không tồn tại');
            return;
        }

        $rule = $db->prepare("SELECT id, code, name, deduction_points FROM kpi_rules WHERE code = ?");
        $rule->execute([$ruleCode]);
        $r = $rule->fetch();
        if (!$r) {
            Response::notFound("Không tìm thấy quy chế lỗi mã $ruleCode");
            return;
        }

        $code = 'BB-' . date('Ymd') . '-' . sprintf("%04d", rand(1000, 9999));
        $desc = "Điểm danh đầu giờ ngày $date: " . ($note ?: $r['name']);
        $time = date('H:i:s');

        $isAdminOrMgr = in_array($user['role'] ?? '', ['admin', 'dorm_manager', 'youth_union', 'homeroom_teacher']);
        $status = 'approved'; // Teachers and admins can directly confirm attendance violations
        $approverId = $user['id'] ?? null;
        $approvedAt = date('Y-m-d H:i:s');

        $db->beginTransaction();
        try {
            $stmt = $db->prepare("
                INSERT INTO violation_records (code, student_id, class_id, rule_id, period_id, violation_date, violation_time, location, description, points_deducted, reported_by_user_id, status, approved_by_user_id, approved_at)
                VALUES (?, ?, ?, ?, 1, ?, ?, 'Lớp học đầu giờ', ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $code, $studentId, $student['class_id'], $r['id'], $date, $time,
                $desc, $r['deduction_points'], $user['id'] ?? 1,
                $status, $approverId, $approvedAt
            ]);
            $violationId = $db->lastInsertId();

            // Recalculate student KPI
            $kpiCtrl = new KpiController();
            $kpiCtrl->recalculateStudentKpi($db, $studentId, 1);

            $db->commit();
            Response::success([
                'violation_id' => $violationId,
                'code' => $code,
                'points_deducted' => $r['deduction_points'],
            ], "Đã lập biên bản $code (-{$r['deduction_points']} điểm) cho học sinh {$student['full_name']}");
        } catch (\Exception $e) {
            $db->rollBack();
            Response::error('Lỗi khi lập biên bản: ' . $e->getMessage(), 500);
        }
    }
}
