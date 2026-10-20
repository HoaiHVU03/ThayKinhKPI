<?php
// backend/scripts/audit_system.php
// Comprehensive Deep System Audit

require __DIR__ . '/../app/Core/Database.php';

use App\Core\Database;

$db = Database::getConnection();

echo "========================================================\n";
echo "   THPT CHUYEN HUNG VUONG - COMPREHENSIVE SYSTEM AUDIT   \n";
echo "========================================================\n\n";

// 1. Table Counts & Schema Verification
$tables = [
    'students', 'classes', 'dormitory_rooms', 'room_assignments',
    'teachers', 'duty_schedules', 'duty_checklist_items', 'kpi_rules',
    'violation_records', 'student_kpi_summaries', 'daily_regimes',
    'regime_checklist_items', 'regime_execution_records', 'leave_requests',
    'users', 'user_scope_assignments', 'school_settings', 'audit_logs'
];

echo "1. VERIFYING DATABASE TABLES & RECORDS:\n";
$allTablesOk = true;
foreach ($tables as $t) {
    try {
        $count = (int)$db->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();
        echo sprintf("   %-28s : %6d rows [OK]\n", $t, $count);
    } catch (\Exception $e) {
        echo sprintf("   %-28s : FAILED (%s)\n", $t, $e->getMessage());
        $allTablesOk = false;
    }
}

// 2. Business Logic Checks according to masterprompt.txt
echo "\n2. CHECKING BUSINESS RULES FROM MASTERPROMPT:\n";

// Total students: 1,880
$totalStudents = (int)$db->query("SELECT COUNT(*) FROM students")->fetchColumn();
echo "   - Total students: $totalStudents " . ($totalStudents >= 1880 ? "[MATCH]" : "[MISMATCH: target 1,880]") . "\n";

// Total classes: 54
$totalClasses = (int)$db->query("SELECT COUNT(*) FROM classes")->fetchColumn();
echo "   - Total classes: $totalClasses " . ($totalClasses === 54 ? "[MATCH]" : "[MISMATCH: target 54]") . "\n";

// Grades breakdown
$g10 = (int)$db->query("SELECT COUNT(*) FROM classes WHERE grade_level = 10")->fetchColumn();
$g11 = (int)$db->query("SELECT COUNT(*) FROM classes WHERE grade_level = 11")->fetchColumn();
$g12 = (int)$db->query("SELECT COUNT(*) FROM classes WHERE grade_level = 12")->fetchColumn();
echo "   - Grade 10 classes: $g10 (target: 17) " . ($g10 === 17 ? "[OK]" : "[WARN]") . "\n";
echo "   - Grade 11 classes: $g11 (target: 17) " . ($g11 === 17 ? "[OK]" : "[WARN]") . "\n";
echo "   - Grade 12 classes: $g12 (target: 20) " . ($g12 === 20 ? "[OK]" : "[WARN]") . "\n";

// Boarding vs Day students
$boarding = (int)$db->query("SELECT COUNT(*) FROM students WHERE is_boarding = 1")->fetchColumn();
$day = (int)$db->query("SELECT COUNT(*) FROM students WHERE is_boarding = 0")->fetchColumn();
$maleBoarding = (int)$db->query("SELECT COUNT(*) FROM students WHERE is_boarding = 1 AND gender = 'Nam'")->fetchColumn();
$femaleBoarding = (int)$db->query("SELECT COUNT(*) FROM students WHERE is_boarding = 1 AND gender = 'Nữ'")->fetchColumn();
echo "   - Boarding students: $boarding (Male: $maleBoarding, Female: $femaleBoarding)\n";
echo "   - Day students: $day\n";

// Dormitory rooms
$totalRooms = (int)$db->query("SELECT COUNT(*) FROM dormitory_rooms")->fetchColumn();
$maleRooms = (int)$db->query("SELECT COUNT(*) FROM dormitory_rooms WHERE gender = 'Nam'")->fetchColumn();
$femaleRooms = (int)$db->query("SELECT COUNT(*) FROM dormitory_rooms WHERE gender = 'Nữ'")->fetchColumn();
echo "   - Dormitory rooms: $totalRooms (target: 120) [Male: $maleRooms, Female: $femaleRooms]\n";

// Duty teachers
$dutyTeachers = (int)$db->query("SELECT COUNT(*) FROM teachers WHERE is_duty_teacher = 1")->fetchColumn();
echo "   - Duty teachers: $dutyTeachers (target: 37) " . ($dutyTeachers === 37 ? "[MATCH]" : "[WARN]") . "\n";

// KPI Rules L01 - L10
$kpiRules = $db->query("SELECT code, name, deduction_points FROM kpi_rules ORDER BY code ASC")->fetchAll();
echo "   - KPI Rules count: " . count($kpiRules) . " (target: 10 L01-L10)\n";
foreach ($kpiRules as $r) {
    echo "     * {$r['code']}: {$r['name']} (-{$r['deduction_points']} pts)\n";
}

// 11 Daily Regimes
$regimes = $db->query("SELECT order_num, name, time_start, time_end, responsible_role FROM daily_regimes ORDER BY order_num ASC")->fetchAll();
echo "   - Daily Regimes count: " . count($regimes) . " (target: 11)\n";
foreach ($regimes as $reg) {
    echo "     * Moc {$reg['order_num']}: {$reg['name']} ({$reg['time_start']} - {$reg['time_end']})\n";
}

// Users and roles
$users = $db->query("SELECT role, COUNT(*) as cnt FROM users GROUP BY role")->fetchAll(PDO::FETCH_KEY_PAIR);
echo "   - System Users by Role:\n";
foreach ($users as $r => $cnt) {
    echo "     * Role '$r': $cnt users\n";
}

echo "\n3. DATA INTEGRITY CHECKS:\n";
// Orphan students (invalid class_id)
$orphanStudents = (int)$db->query("SELECT COUNT(*) FROM students s LEFT JOIN classes c ON s.class_id = c.id WHERE c.id IS NULL")->fetchColumn();
echo "   - Orphan students without class: $orphanStudents " . ($orphanStudents === 0 ? "[PASS]" : "[FAIL]") . "\n";

// Boarding students with room mismatch
$roomMismatch = (int)$db->query("SELECT COUNT(*) FROM students s JOIN dormitory_rooms r ON s.dorm_room_id = r.id WHERE s.gender != r.gender")->fetchColumn();
echo "   - Boarding students assigned to opposite gender room: $roomMismatch " . ($roomMismatch === 0 ? "[PASS]" : "[FAIL]") . "\n";

// Overcapacity rooms
$overcapacity = (int)$db->query("SELECT COUNT(*) FROM dormitory_rooms WHERE current_occupancy > capacity")->fetchColumn();
echo "   - Rooms exceeding capacity: $overcapacity " . ($overcapacity === 0 ? "[PASS]" : "[FAIL]") . "\n";

// Student KPI summary match
$missingKpi = (int)$db->query("SELECT COUNT(*) FROM students s LEFT JOIN student_kpi_summaries sks ON s.id = sks.student_id WHERE sks.id IS NULL")->fetchColumn();
echo "   - Students missing KPI summary record: $missingKpi " . ($missingKpi === 0 ? "[PASS]" : "[FAIL]") . "\n";

echo "\n=== AUDIT FINISHED ===\n";
