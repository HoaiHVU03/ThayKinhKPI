<?php
// backend/public/index.php
// Front controller for THPT Chuyen Hung Vuong Management & KPI System

// Thiết lập múi giờ Việt Nam chuẩn (GMT+7) cho toàn bộ hệ thống
date_default_timezone_set('Asia/Ho_Chi_Minh');

// Tự động bắt lỗi PHP và trả về thông báo JSON thay vì màn hình 500 trắng
ini_set('display_errors', 0);
error_reporting(E_ALL);

set_exception_handler(function (Throwable $e) {
    http_response_code(500);
    header("Access-Control-Allow-Origin: *");
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode([
        'success' => false,
        'message' => 'Lỗi máy chủ: ' . $e->getMessage(),
        'file' => basename($e->getFile()),
        'line' => $e->getLine()
    ], JSON_UNESCAPED_UNICODE);
    exit;
});

// CORS Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-School-Code");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// PSR-4 Autoloader thông minh (Tự động nhận diện thư mục app dù nằm ở bất cứ vị trí nào)
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relativeClass = substr($class, $len);
    $relFile = str_replace('\\', '/', $relativeClass) . '.php';

    $candidateDirs = [
        __DIR__ . '/../app/',
        __DIR__ . '/../',
        __DIR__ . '/../app/app/',
        __DIR__ . '/../../app/',
        dirname(__DIR__, 2) . '/backend/app/',
        dirname(__DIR__, 2) . '/backend/',
    ];

    foreach ($candidateDirs as $dir) {
        $file = $dir . $relFile;
        if (file_exists($file)) {
            require_once $file;
            return;
        }
    }
});

use App\Core\Router;
use App\Middleware\AuthMiddleware;
use App\Controllers\AuthController;
use App\Controllers\DashboardController;
use App\Controllers\StudentController;
use App\Controllers\ClassController;
use App\Controllers\DormitoryController;
use App\Controllers\RegimeController;
use App\Controllers\KpiController;
use App\Controllers\DutyController;
use App\Controllers\LeaveRequestController;
use App\Controllers\ReportController;
use App\Controllers\AcademicYearController;
use App\Controllers\AdminController;
use App\Controllers\ChatbotController;
use App\Controllers\ClassAttendanceController;
use App\Controllers\SchoolWorkspaceController;

$router = new Router();

// Public routes
$router->post('/api/auth/login', [AuthController::class, 'login']);
$router->get('/api/public/settings', [AdminController::class, 'settings']);
$router->get('/api/public/schools', [SchoolWorkspaceController::class, 'list']);
$router->post('/api/public/schools', [SchoolWorkspaceController::class, 'create']);
$router->post('/api/chatbot/message', [ChatbotController::class, 'sendMessage']);
$router->get('/api/public/students-search', [LeaveRequestController::class, 'publicStudentSearch']);
$router->post('/api/public/leave-requests', [LeaveRequestController::class, 'publicCreate']);

// Authenticated routes
$auth = [AuthMiddleware::class];

// Auth & User Profile
$router->get('/api/auth/me', [AuthController::class, 'me'], $auth);
$router->post('/api/auth/logout', [AuthController::class, 'logout'], $auth);
$router->post('/api/auth/change-password', [AuthController::class, 'changePassword'], $auth);

// Dashboard
$router->get('/api/dashboard/stats', [DashboardController::class, 'stats'], $auth);
$router->get('/api/dashboard/charts', [DashboardController::class, 'charts'], $auth);
$router->get('/api/dashboard/realtime-attendance', [DashboardController::class, 'realtimeAttendance'], $auth);

// Students
$router->get('/api/students', [StudentController::class, 'index'], $auth);
$router->get('/api/students/export', [StudentController::class, 'export'], $auth);
$router->post('/api/students/import', [StudentController::class, 'import'], $auth);
$router->get('/api/students/{id}', [StudentController::class, 'show'], $auth);
$router->post('/api/students', [StudentController::class, 'store'], $auth);
$router->put('/api/students/{id}', [StudentController::class, 'update'], $auth);
$router->delete('/api/students/{id}', [StudentController::class, 'destroy'], $auth);

// Classes
$router->get('/api/classes', [ClassController::class, 'index'], $auth);
$router->get('/api/classes/teachers-list', [ClassController::class, 'teachersList'], $auth);
$router->post('/api/classes/import', [ClassController::class, 'import'], $auth);
$router->get('/api/classes/{id}', [ClassController::class, 'show'], $auth);
$router->get('/api/classes/{id}/students', [ClassController::class, 'students'], $auth);
$router->post('/api/classes/{id}/change-teacher', [ClassController::class, 'changeTeacher'], $auth);
$router->post('/api/classes', [ClassController::class, 'store'], $auth);
$router->put('/api/classes/{id}', [ClassController::class, 'update'], $auth);
$router->delete('/api/classes/{id}', [ClassController::class, 'destroy'], $auth);

// Class Morning Attendance & Statistics (Điểm danh học sinh theo lớp đầu giờ)
$router->get('/api/class-attendance/sessions', [ClassAttendanceController::class, 'sessions'], $auth);
$router->get('/api/class-attendance/statistics', [ClassAttendanceController::class, 'statistics'], $auth);
$router->get('/api/class-attendance/classes/{id}', [ClassAttendanceController::class, 'classStudents'], $auth);
$router->post('/api/class-attendance/classes/{id}/save', [ClassAttendanceController::class, 'saveAttendance'], $auth);
$router->post('/api/class-attendance/classes/{id}/mark-all-present', [ClassAttendanceController::class, 'markAllPresent'], $auth);
$router->get('/api/class-attendance/absent-list', [ClassAttendanceController::class, 'absentList'], $auth);
$router->post('/api/class-attendance/create-violation', [ClassAttendanceController::class, 'createViolation'], $auth);

// Dormitory & Attendance
$router->get('/api/dormitory/overview', [DormitoryController::class, 'overview'], $auth);
$router->get('/api/dormitory/attendance/statistics', [DormitoryController::class, 'attendanceStatistics'], $auth);
$router->get('/api/dormitory/students', [DormitoryController::class, 'studentsList'], $auth);
$router->post('/api/dormitory/students/convert', [DormitoryController::class, 'convertBoarding'], $auth);
$router->get('/api/dormitory/rooms', [DormitoryController::class, 'rooms'], $auth);
$router->get('/api/dormitory/rooms/{id}', [DormitoryController::class, 'showRoom'], $auth);
$router->post('/api/dormitory/rooms', [DormitoryController::class, 'storeRoom'], $auth);
$router->put('/api/dormitory/rooms/{id}', [DormitoryController::class, 'updateRoom'], $auth);
$router->delete('/api/dormitory/rooms/{id}', [DormitoryController::class, 'destroyRoom'], $auth);
$router->post('/api/dormitory/rooms/{id}/assign', [DormitoryController::class, 'assignStudent'], $auth);
$router->post('/api/dormitory/rooms/{id}/remove-student', [DormitoryController::class, 'removeStudent'], $auth);
$router->post('/api/dormitory/rooms/import-assignments', [DormitoryController::class, 'importAssignments'], $auth);
$router->post('/api/dormitory/attendance/mark-all-present', [DormitoryController::class, 'markAllPresent'], $auth);
$router->post('/api/dormitory/attendance/mark-student', [DormitoryController::class, 'markStudent'], $auth);
$router->get('/api/dormitory/floor-reports/{floor}/zalo', [DormitoryController::class, 'generateZaloReport'], $auth);

// 11 Daily Regimes
$router->get('/api/regimes', [RegimeController::class, 'index'], $auth);
$router->get('/api/regimes/current', [RegimeController::class, 'current'], $auth);
$router->post('/api/regimes', [RegimeController::class, 'store'], $auth);
$router->put('/api/regimes/{id}', [RegimeController::class, 'update'], $auth);
$router->delete('/api/regimes/{id}', [RegimeController::class, 'destroy'], $auth);
$router->post('/api/regimes/{id}/complete', [RegimeController::class, 'complete'], $auth);

// KPI & Discipline
$router->get('/api/kpi/rules', [KpiController::class, 'rules'], $auth);
$router->post('/api/kpi/rules', [KpiController::class, 'storeRule'], $auth);
$router->put('/api/kpi/rules/{id}', [KpiController::class, 'updateRule'], $auth);
$router->delete('/api/kpi/rules/{id}', [KpiController::class, 'destroyRule'], $auth);
$router->get('/api/kpi/violations', [KpiController::class, 'violations'], $auth);
$router->post('/api/kpi/violations', [KpiController::class, 'createViolation'], $auth);
$router->post('/api/kpi/violations/import', [KpiController::class, 'importViolations'], $auth);
$router->put('/api/kpi/violations/{id}', [KpiController::class, 'updateViolation'], $auth);
$router->delete('/api/kpi/violations/{id}', [KpiController::class, 'destroyViolation'], $auth);
$router->post('/api/kpi/violations/{id}/approve', [KpiController::class, 'approve'], $auth);
$router->post('/api/kpi/violations/{id}/reject', [KpiController::class, 'reject'], $auth);
$router->get('/api/kpi/discipline-levels', [KpiController::class, 'disciplineLevels'], $auth);

// Duty Building A
$router->get('/api/duty/schedules', [DutyController::class, 'schedules'], $auth);
$router->get('/api/duty/teachers', [DutyController::class, 'teachers'], $auth);
$router->get('/api/duty/today', [DutyController::class, 'today'], $auth);
$router->post('/api/duty/schedules', [DutyController::class, 'storeSchedule'], $auth);
$router->put('/api/duty/schedules/{id}', [DutyController::class, 'updateSchedule'], $auth);
$router->delete('/api/duty/schedules/{id}', [DutyController::class, 'destroySchedule'], $auth);
$router->post('/api/duty/{id}/step', [DutyController::class, 'toggleStep'], $auth);

// Leave Requests
$router->get('/api/leave-requests/ticker', [LeaveRequestController::class, 'ticker'], $auth);
$router->get('/api/leave-requests', [LeaveRequestController::class, 'index'], $auth);
$router->post('/api/leave-requests', [LeaveRequestController::class, 'create'], $auth);
$router->put('/api/leave-requests/{id}', [LeaveRequestController::class, 'update'], $auth);
$router->delete('/api/leave-requests/{id}', [LeaveRequestController::class, 'destroy'], $auth);
$router->post('/api/leave-requests/{id}/approve', [LeaveRequestController::class, 'approve'], $auth);
$router->post('/api/leave-requests/{id}/reject', [LeaveRequestController::class, 'reject'], $auth);
$router->post('/api/leave-requests/{id}/checkin', [LeaveRequestController::class, 'checkin'], $auth);

// Reports & A4 Template
$router->get('/api/reports/matrix', [ReportController::class, 'matrix'], $auth);
$router->get('/api/reports/students-kpi', [ReportController::class, 'studentsKpi'], $auth);
$router->get('/api/reports/official-document', [ReportController::class, 'officialDocument'], $auth);
$router->get('/api/reports/class-kpi/{id}', [ReportController::class, 'classKpiDocument'], $auth);
$router->get('/api/reports/student-kpi-card/{id}', [ReportController::class, 'studentKpiCard'], $auth);

// Academic Year
$router->get('/api/academic-year/preview', [AcademicYearController::class, 'preview'], $auth);
$router->post('/api/academic-year/commit', [AcademicYearController::class, 'commit'], $auth);

// Administration & Settings
$router->get('/api/admin/users', [AdminController::class, 'users'], $auth);
$router->post('/api/admin/users', [AdminController::class, 'createUser'], $auth);
$router->put('/api/admin/users/{id}', [AdminController::class, 'updateUser'], $auth);
$router->delete('/api/admin/users/{id}', [AdminController::class, 'destroyUser'], $auth);
$router->get('/api/admin/settings', [AdminController::class, 'settings'], $auth);
$router->put('/api/admin/settings', [AdminController::class, 'updateSettings'], $auth);
$router->get('/api/admin/audit-logs', [AdminController::class, 'auditLogs'], $auth);
$router->get('/api/admin/backup', [AdminController::class, 'backup'], $auth);
$router->get('/api/admin/onboarding/export-all', [AdminController::class, 'exportAllData'], $auth);
$router->post('/api/admin/onboarding/clear-data', [AdminController::class, 'clearAllData'], $auth);
$router->post('/api/admin/onboarding/master-import', [AdminController::class, 'masterImport'], $auth);
$router->post('/api/upload', [AdminController::class, 'uploadImage'], $auth);

// AI Gemini Chatbot Admin
$router->get('/api/chatbot/settings', [ChatbotController::class, 'getSettings'], $auth);
$router->post('/api/chatbot/settings', [ChatbotController::class, 'saveSettings'], $auth);
$router->post('/api/chatbot/test-key', [ChatbotController::class, 'testKey'], $auth);

// Dispatch request
$router->dispatch($_SERVER['REQUEST_METHOD'], $_SERVER['REQUEST_URI']);
