<?php
// seeder.php - Generates exact target scale data for THPT Chuyen Hung Vuong
$dbHost = '127.0.0.1';
$dbPort = '3306';
$dbName = 'chuyenhungvuong_kpi';
$dbUser = 'root';
$dbPass = '';

try {
    $pdo = new PDO("mysql:host=$dbHost;port=$dbPort;dbname=$dbName;charset=utf8mb4", $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage() . "\n");
}

echo "Starting database seeding...\n";
$pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");

// Truncate existing tables
$tables = [
    'audit_logs', 'user_scope_assignments', 'users', 'academic_years', 'semesters',
    'teachers', 'classes', 'dormitory_floors', 'dormitory_rooms', 'students',
    'room_assignments', 'dormitory_attendance_sessions', 'dormitory_attendance_records',
    'dormitory_room_reports', 'dormitory_floor_reports', 'daily_regimes',
    'regime_checklist_items', 'regime_execution_records', 'kpi_rules',
    'kpi_assessment_periods', 'violation_records', 'student_kpi_summaries',
    'duty_schedules', 'duty_checklist_items', 'leave_requests', 'school_settings'
];
foreach ($tables as $t) {
    $pdo->exec("TRUNCATE TABLE `$t`;");
}
$pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

$defaultPasswordHash = password_hash('password123', PASSWORD_BCRYPT);

// 1. Settings
$settings = [
    'school_name' => 'Trường THPT Chuyên Hùng Vương',
    'school_address' => 'Đại lộ Hùng Vương, TP. Việt Trì, Phú Thọ',
    'school_phone' => '0210 3846 592',
    'school_email' => 'c3hungvuong.phutho@moet.edu.vn',
    'school_logo' => '/logo.png',
    'brand_primary_color' => '#0e3a7c',
    'brand_accent_color' => '#d32027',
    'brand_gold_color' => '#f59e0b',
    'academic_year_current' => '2026-2027',
    'kpi_baseline_score' => '100',
    'morning_attendance_time' => '06:00',
    'evening_attendance_time' => '22:00',
    'zalo_report_time' => '22:15'
];
$stmt = $pdo->prepare("INSERT INTO school_settings (setting_key, setting_value, description) VALUES (?, ?, ?)");
foreach ($settings as $k => $v) {
    $stmt->execute([$k, $v, 'Cấu hình hệ thống']);
}

// 2. Academic Year & Semester
$pdo->exec("INSERT INTO academic_years (id, code, name, is_current, start_date, end_date) 
VALUES (1, '2026-2027', 'Năm học 2026 - 2027', 1, '2026-09-01', '2027-05-31')");

$pdo->exec("INSERT INTO semesters (id, academic_year_id, name, is_current) 
VALUES (1, 1, 'Học kỳ 1 (2026-2027)', 1), (2, 1, 'Học kỳ 2 (2026-2027)', 0)");

$pdo->exec("INSERT INTO kpi_assessment_periods (id, code, name, academic_year_id, start_date, end_date, is_locked)
VALUES (1, 'HK1-2026', 'Học kỳ 1 Năm học 2026-2027', 1, '2026-09-01', '2027-01-15', 0)");

// 3. KPI Rules L01 - L10
$kpiRules = [
    ['L01', 'Đi học muộn sau 07h00', 1, 'Đến lớp sau hiệu lệnh trống/chuông 07h00 sáng', 'nề_nếp_học_đường'],
    ['L02', 'Sai đồng phục hoặc không đeo thẻ', 3, 'Không mặc đúng đồng phục quy định hoặc quên thẻ học sinh', 'nề_nếp_học_đường'],
    ['L03', 'Để xe sai vị trí quy định', 3, 'Xếp xe lộn xộn, không đúng khu vực phân công nhà xe', 'nề_nếp_học_đường'],
    ['L04', 'Ăn quà vặt trong lớp học', 3, 'Mang đồ ăn, thức uống ngoài nước lọc vào lớp, xả rác', 'nề_nếp_học_đường'],
    ['L05', 'Sử dụng điện thoại trái phép', 5, 'Dùng điện thoại ngoài mục đích học tập trong giờ học hoặc truy bài', 'nề_nếp_học_đường'],
    ['L06', 'Không tắt thiết bị khi được yêu cầu', 5, 'Không tắt quạt, điện, máy chiếu khi ra khỏi phòng học', 'nề_nếp_học_đường'],
    ['L07', 'Vi phạm nền nếp nội vụ KTX', 3, 'Gấp chăn màn cẩu thả, phòng bừa bộn, không vệ sinh KTX', 'kỷ_luật_ktx'],
    ['L08', 'Mất trật tự, vi phạm văn hóa ứng xử', 3, 'Gây ồn ào giờ tự học tối, nói tục, cư xử thiếu văn hóa', 'nề_nếp_học_đường'],
    ['L09', 'Gian lận thi cử hoặc lạm dụng AI', 10, 'Quay cóp bài kiểm tra, copy văn mẫu AI nộp bài trái phép', 'học_tập'],
    ['L10', 'Hành vi đặc biệt nghiêm trọng', 20, 'Đánh nhau, phá hoại tài sản công, vi phạm pháp luật quy chế', 'đặc_biệt']
];
$stmt = $pdo->prepare("INSERT INTO kpi_rules (code, name, deduction_points, description, category) VALUES (?, ?, ?, ?, ?)");
foreach ($kpiRules as $r) {
    $stmt->execute($r);
}

// 4. 11 Daily Regimes KTX
$regimes = [
    [1, '05:15', '05:30', 'Báo thức', 'Chuông báo thức toàn KTX, học sinh thức dậy chuẩn bị', 'Ban Quản sinh'],
    [2, '05:30', '06:00', 'Thể dục sáng', 'Tập thể dục sân KTX nâng cao thể lực', 'Ban Tự quản KTX'],
    [3, '06:00', '06:30', 'Gấp chăn màn, chỉnh trang nội vụ', 'Vệ sinh phòng, gấp chăn vuông vắn, xếp đồ dùng', 'Trưởng phòng KTX'],
    [4, '06:30', '07:15', 'Ăn sáng', 'Ăn sáng tại nhà ăn trường THPT Chuyên Hùng Vương', 'Ban Quản sinh'],
    [5, '07:15', '07:30', 'Niêm phong KTX', 'Khóa các phòng KTX, niêm phong cửa tầng', 'Ban Quản sinh & Bảo vệ'],
    [6, '07:30', '11:30', 'Học chính khóa tại Tòa nhà A', 'Học tập các môn chuyên và đại trà tại giảng đường', 'GVCN & Trực ban'],
    [7, '11:45', '13:30', 'Ăn trưa và nghỉ trưa', 'Nghỉ trưa giữ yên tĩnh tại các phòng nội trú', 'Trưởng tầng & Quản sinh'],
    [8, '16:30', '17:45', 'Thể thao chiều', 'Hoạt động thể chất bóng rổ, cầu lông, bóng bàn', 'Đoàn Thanh niên'],
    [9, '18:00', '18:15', 'Chốt cổng trường KTX', 'Kiểm soát học sinh nội trú trở về KTX', 'Bảo vệ & Quản sinh'],
    [10, '19:30', '21:45', 'Tự học tối', 'Tự học tại phòng học hoặc phòng tự học KTX', 'Trưởng tầng & Trưởng phòng'],
    [11, '22:00', '22:30', 'Điểm danh tối & Tắt đèn', 'Điểm danh quân số, tắt đèn ngủ lúc 22h30', 'Trưởng phòng & Quản sinh']
];
$stmt = $pdo->prepare("INSERT INTO daily_regimes (order_num, time_start, time_end, name, description, responsible_role) VALUES (?, ?, ?, ?, ?, ?)");
foreach ($regimes as $reg) {
    $stmt->execute($reg);
    $regId = $pdo->lastInsertId();
    // Add 2-3 checklist items per regime
    $pdo->prepare("INSERT INTO regime_checklist_items (regime_id, title, order_num) VALUES (?, ?, 1), (?, ?, 2)")
        ->execute([
            $regId, "Kiểm tra thực hiện: " . $reg[3],
            $regId, "Báo cáo xác nhận qua ứng dụng",
        ]);
}

// 5. Teachers (37 Duty Teachers)
$ho = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương'];
$demNam = ['Văn', 'Quang', 'Minh', 'Hồng', 'Đức', 'Tuấn', 'Thành', 'Thế', 'Bảo'];
$demNu = ['Thị', 'Ngọc', 'Thu', 'Thanh', 'Hải', 'Ánh', 'Bích', 'Phương', 'Mai'];
$tenNam = ['Kính', 'Hùng', 'Cường', 'Dũng', 'Tùng', 'Sơn', 'Tuấn', 'Hải', 'Long', 'Lâm', 'Nam', 'Hiếu'];
$tenNu = ['Lan', 'Hương', 'Hà', 'Trang', 'Nhung', 'Hoa', 'Thảo', 'Yến', 'Linh', 'Thúy', 'Chi'];
$monHoc = ['Toán', 'Vật lý', 'Hóa học', 'Sinh học', 'Ngữ văn', 'Lịch sử', 'Địa lý', 'Tiếng Anh', 'Tin học', 'GDCD'];

$teacherStmt = $pdo->prepare("INSERT INTO teachers (user_id, code, full_name, email, phone, subject, is_duty_teacher) VALUES (?, ?, ?, ?, ?, ?, ?)");
$dutyTeacherIds = [];

// Create Special Teacher: Thầy Kính (Tên hệ thống)
$teacherStmt->execute([null, 'GV001', 'Nguyễn Văn Kính', 'thaykinh@hungvuong.edu.vn', '0912345678', 'Toán', 1]);
$dutyTeacherIds[] = $pdo->lastInsertId();

for ($i = 2; $i <= 37; $i++) {
    $code = sprintf("GV%03d", $i);
    $isMale = ($i % 2 === 0);
    $name = ($isMale ? $ho[array_rand($ho)] . ' ' . $demNam[array_rand($demNam)] . ' ' . $tenNam[array_rand($tenNam)]
                   : $ho[array_rand($ho)] . ' ' . $demNu[array_rand($demNu)] . ' ' . $tenNu[array_rand($tenNu)]);
    $subj = $monHoc[array_rand($monHoc)];
    $phone = '098' . sprintf("%07d", rand(1000000, 9999999));
    $email = "gv" . sprintf("%03d", $i) . "@hungvuong.edu.vn";
    $teacherStmt->execute([null, $code, $name, $email, $phone, $subj, 1]);
    $dutyTeacherIds[] = $pdo->lastInsertId();
}

// Create remaining teachers for 54 classes (total ~60 teachers)
for ($i = 38; $i <= 60; $i++) {
    $code = sprintf("GV%03d", $i);
    $name = $ho[array_rand($ho)] . ' ' . $demNu[array_rand($demNu)] . ' ' . $tenNu[array_rand($tenNu)];
    $subj = $monHoc[array_rand($monHoc)];
    $phone = '097' . sprintf("%07d", rand(1000000, 9999999));
    $email = "gv" . sprintf("%03d", $i) . "@hungvuong.edu.vn";
    $teacherStmt->execute([null, $code, $name, $email, $phone, $subj, 0]);
}

// 6. 54 Classes
// Grade 10: 17 classes (595 students = 35 each)
// Grade 11: 17 classes (595 students = 35 each)
// Grade 12: 20 classes (690 students = 10 classes of 35 + 10 classes of 34)
$classSpecs = [
    10 => ['Toán 1', 'Toán 2', 'Tin', 'Lý 1', 'Lý 2', 'Hóa 1', 'Hóa 2', 'Sinh', 'Văn 1', 'Văn 2', 'Sử', 'Địa', 'Anh 1', 'Anh 2', 'Pháp', 'Nga', 'Trung'],
    11 => ['Toán 1', 'Toán 2', 'Tin', 'Lý 1', 'Lý 2', 'Hóa 1', 'Hóa 2', 'Sinh', 'Văn 1', 'Văn 2', 'Sử', 'Địa', 'Anh 1', 'Anh 2', 'Pháp', 'Nga', 'Trung'],
    12 => ['Toán 1', 'Toán 2', 'Tin 1', 'Tin 2', 'Lý 1', 'Lý 2', 'Hóa 1', 'Hóa 2', 'Sinh 1', 'Sinh 2', 'Văn 1', 'Văn 2', 'Sử', 'Địa', 'Anh 1', 'Anh 2', 'Anh 3', 'Pháp', 'Nga', 'Trung']
];

$classInsert = $pdo->prepare("INSERT INTO classes (code, name, grade_level, academic_year_id, homeroom_teacher_id, total_students, boarding_students, room_location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
$createdClasses = []; // [id => ['grade' => 10, 'size' => 35]]
$teacherIdx = 1;

foreach ($classSpecs as $grade => $specList) {
    foreach ($specList as $idx => $spec) {
        $cleanSpec = str_replace([' ', '1', '2', '3'], '', $spec);
        $code = $grade . $cleanSpec . ($idx + 1);
        $name = "$grade Chuyên $spec";
        $size = ($grade == 12 && $idx >= 10) ? 34 : 35;
        $tId = ($teacherIdx <= 54) ? $teacherIdx : rand(1, 54);
        $loc = "Phòng A" . ($grade * 10 + ($idx % 10 + 1));
        
        $classInsert->execute([$code, $name, $grade, 1, $tId, $size, 0, $loc]);
        $cId = $pdo->lastInsertId();
        $createdClasses[$cId] = [
            'id' => $cId,
            'code' => $code,
            'name' => $name,
            'grade' => $grade,
            'size' => $size,
            'teacher_id' => $tId
        ];
        $teacherIdx++;
    }
}
echo "Created 54 specialized classes.\n";

// 7. Dormitory Floors & 120 Rooms
// Floors 2 to 6
// Male: 56 rooms (Floor 2: 24 rooms, Floor 3: 24 rooms, Floor 4: 8 rooms) = 56 rooms
// Female: 64 rooms (Floor 4: 16 rooms, Floor 5: 24 rooms, Floor 6: 24 rooms) = 64 rooms
// Total: 120 rooms!
$pdo->exec("INSERT INTO dormitory_floors (floor_number, name, gender_zone, total_rooms) VALUES
(2, 'Tầng 2 - Khu Nam', 'Nam', 24),
(3, 'Tầng 3 - Khu Nam', 'Nam', 24),
(4, 'Tầng 4 - Khu Hỗn hợp (Nam/Nữ)', 'Nam', 24),
(5, 'Tầng 5 - Khu Nữ', 'Nữ', 24),
(6, 'Tầng 6 - Khu Nữ', 'Nữ', 24)");

$roomInsert = $pdo->prepare("INSERT INTO dormitory_rooms (code, floor_number, gender, capacity, current_occupancy, cleanliness_score) VALUES (?, ?, ?, ?, ?, ?)");
$maleRooms = [];
$femaleRooms = [];

// Floor 2 (24 Male rooms: P201 -> P224)
for ($r = 1; $r <= 24; $r++) {
    $code = sprintf("P2%02d", $r);
    $roomInsert->execute([$code, 2, 'Nam', 6, 0, rand(92, 100)]);
    $maleRooms[] = $pdo->lastInsertId();
}
// Floor 3 (24 Male rooms: P301 -> P324)
for ($r = 1; $r <= 24; $r++) {
    $code = sprintf("P3%02d", $r);
    $roomInsert->execute([$code, 3, 'Nam', 6, 0, rand(92, 100)]);
    $maleRooms[] = $pdo->lastInsertId();
}
// Floor 4 (8 Male rooms: P401 -> P408, 16 Female rooms: P409 -> P424)
for ($r = 1; $r <= 8; $r++) {
    $code = sprintf("P4%02d", $r);
    $roomInsert->execute([$code, 4, 'Nam', 6, 0, rand(92, 100)]);
    $maleRooms[] = $pdo->lastInsertId();
}
for ($r = 9; $r <= 24; $r++) {
    $code = sprintf("P4%02d", $r);
    $roomInsert->execute([$code, 4, 'Nữ', 6, 0, rand(92, 100)]);
    $femaleRooms[] = $pdo->lastInsertId();
}
// Floor 5 (24 Female rooms: P501 -> P524)
for ($r = 1; $r <= 24; $r++) {
    $code = sprintf("P5%02d", $r);
    $roomInsert->execute([$code, 5, 'Nữ', 6, 0, rand(92, 100)]);
    $femaleRooms[] = $pdo->lastInsertId();
}
// Floor 6 (24 Female rooms: P601 -> P624)
for ($r = 1; $r <= 24; $r++) {
    $code = sprintf("P6%02d", $r);
    $roomInsert->execute([$code, 6, 'Nữ', 6, 0, rand(92, 100)]);
    $femaleRooms[] = $pdo->lastInsertId();
}
echo "Created 120 Dormitory rooms (56 Male, 64 Female).\n";

// 8. 1,880 Students
// Total: 1,880
// Boarding: 699 (335 male, 364 female)
// Day students: 1,181
echo "Generating 1,880 students with exactly 699 boarding (335 M / 364 F)...\n";

$hometowns = [
    'TP. Việt Trì, Phú Thọ', 'TX. Phú Thọ, Phú Thọ', 'H. Lâm Thao, Phú Thọ', 
    'H. Phù Ninh, Phú Thọ', 'H. Thanh Ba, Phú Thọ', 'H. Đoan Hùng, Phú Thọ',
    'H. Tam Nông, Phú Thọ', 'H. Thanh Thủy, Phú Thọ', 'H. Cẩm Khê, Phú Thọ',
    'H. Yên Lập, Phú Thọ', 'H. Tân Sơn, Phú Thọ', 'H. Thanh Sơn, Phú Thọ', 'H. Hạ Hòa, Phú Thọ'
];

$remainingMaleBoarding = 335;
$remainingFemaleBoarding = 364;

$studentInsert = $pdo->prepare("INSERT INTO students (code, full_name, dob, gender, class_id, is_boarding, dorm_room_id, parent_name, parent_phone, student_phone, id_card_number, hometown, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'studying')");

$studentGlobalIdx = 1;
$maleRoomOcc = array_fill_keys($maleRooms, 0);
$femaleRoomOcc = array_fill_keys($femaleRooms, 0);
$maleRoomIdx = 0;
$femaleRoomIdx = 0;

$studentsData = []; // [id, is_boarding, room_id, class_id, gender]

foreach ($createdClasses as $cId => $class) {
    $classSize = $class['size'];
    $grade = $class['grade'];
    $birthYear = 2026 - $grade; // Grade 10: 2016 (or realistic: 2011, 2010, 2009)
    $dobYear = 2024 - $grade; // 10 -> 2014, etc. Let's use 2010 for grade 10, 2009 for 11, 2008 for 12
    $actualBirthYear = 2026 - 15 - ($grade - 10);
    
    $boardingInClass = 0;
    
    for ($s = 1; $s <= $classSize; $s++) {
        $code = sprintf("HV%02d%04d", $grade, $studentGlobalIdx);
        // Approx 48% male, 52% female
        $isMale = (rand(1, 100) <= 48);
        $gender = $isMale ? 'Nam' : 'Nữ';
        $fullName = $isMale 
            ? $ho[array_rand($ho)] . ' ' . $demNam[array_rand($demNam)] . ' ' . $tenNam[array_rand($tenNam)]
            : $ho[array_rand($ho)] . ' ' . $demNu[array_rand($demNu)] . ' ' . $tenNu[array_rand($tenNu)];
            
        $dob = sprintf("%04d-%02d-%02d", $actualBirthYear, rand(1, 12), rand(1, 28));
        
        // Decide boarding status
        $isBoarding = 0;
        $roomId = null;
        
        if ($isMale && $remainingMaleBoarding > 0) {
            // Chance to be boarding to spread across 54 classes
            if (rand(1, 100) <= 40 || $remainingMaleBoarding >= (1880 - $studentGlobalIdx)) {
                $isBoarding = 1;
                $remainingMaleBoarding--;
                // Assign to male room
                $roomId = $maleRooms[$maleRoomIdx % count($maleRooms)];
                $maleRoomOcc[$roomId]++;
                if ($maleRoomOcc[$roomId] >= 6) {
                    $maleRoomIdx++;
                }
            }
        } elseif (!$isMale && $remainingFemaleBoarding > 0) {
            if (rand(1, 100) <= 40 || $remainingFemaleBoarding >= (1880 - $studentGlobalIdx)) {
                $isBoarding = 1;
                $remainingFemaleBoarding--;
                // Assign to female room
                $roomId = $femaleRooms[$femaleRoomIdx % count($femaleRooms)];
                $femaleRoomOcc[$roomId]++;
                if ($femaleRoomOcc[$roomId] >= 6) {
                    $femaleRoomIdx++;
                }
            }
        }
        
        if ($isBoarding) {
            $boardingInClass++;
        }
        
        $pName = $ho[array_rand($ho)] . ' ' . $demNam[array_rand($demNam)] . ' ' . $tenNam[array_rand($tenNam)];
        $pPhone = '09' . sprintf("%08d", rand(10000000, 99999999));
        $sPhone = '08' . sprintf("%08d", rand(10000000, 99999999));
        $cccd = '025' . sprintf("%09d", rand(100000000, 999999999));
        $town = $hometowns[array_rand($hometowns)];
        
        $studentInsert->execute([$code, $fullName, $dob, $gender, $cId, $isBoarding, $roomId, $pName, $pPhone, $sPhone, $cccd, $town]);
        $sId = $pdo->lastInsertId();
        
        $studentsData[] = [
            'id' => $sId,
            'is_boarding' => $isBoarding,
            'room_id' => $roomId,
            'class_id' => $cId,
            'gender' => $gender,
            'name' => $fullName
        ];
        
        if ($isBoarding && $roomId) {
            $pdo->prepare("INSERT INTO room_assignments (student_id, room_id, academic_year_id) VALUES (?, ?, 1)")
                ->execute([$sId, $roomId]);
        }
        
        $studentGlobalIdx++;
    }
    
    // Update class boarding count
    $pdo->prepare("UPDATE classes SET boarding_students = ? WHERE id = ?")->execute([$boardingInClass, $cId]);
}

// Update room occupancy
foreach ($maleRoomOcc as $rId => $occ) {
    $pdo->prepare("UPDATE dormitory_rooms SET current_occupancy = ? WHERE id = ?")->execute([$occ, $rId]);
}
foreach ($femaleRoomOcc as $rId => $occ) {
    $pdo->prepare("UPDATE dormitory_rooms SET current_occupancy = ? WHERE id = ?")->execute([$occ, $rId]);
}

echo "Inserted " . count($studentsData) . " students total.\n";

// 9. Users & Authentication (6 Roles)
echo "Creating User Accounts for 6 Roles...\n";
$userInsert = $pdo->prepare("INSERT INTO users (username, password_hash, full_name, email, phone, role, status) VALUES (?, ?, ?, ?, ?, ?, 'active')");

// 1. Admin
$userInsert->execute(['admin', $defaultPasswordHash, 'Ban Giám Hiệu - Quản trị viên', 'admin@hungvuong.edu.vn', '0912345678', 'admin']);
$adminId = $pdo->lastInsertId();

// 2. Dorm Manager (Quản sinh)
$userInsert->execute(['quan_sinh', $defaultPasswordHash, 'Thầy Đỗ Văn Thắng (Quản sinh Trưởng)', 'quansinh@hungvuong.edu.vn', '0988776655', 'dorm_manager']);
$dormMgrId = $pdo->lastInsertId();

// 3. Youth Union (Giáo viên Chi đoàn / Đoàn trường)
$userInsert->execute(['chi_doan', $defaultPasswordHash, 'Cô Trần Thị Mai (Bí thư Chi đoàn GV)', 'chidoan@hungvuong.edu.vn', '0977889900', 'youth_union']);
$youthUnionId = $pdo->lastInsertId();

// 4. Floor Leaders (5 Trưởng tầng)
$floorLeaders = [
    2 => ['truong_tang_2', 'Lê Hoàng Nam (Trưởng tầng 2 - Nam)'],
    3 => ['truong_tang_3', 'Vũ Quốc Bảo (Trưởng tầng 3 - Nam)'],
    4 => ['truong_tang_4', 'Nguyễn Tiến Dũng (Trưởng tầng 4)'],
    5 => ['truong_tang_5', 'Phạm Quỳnh Trang (Trưởng tầng 5 - Nữ)'],
    6 => ['truong_tang_6', 'Đặng Thảo Linh (Trưởng tầng 6 - Nữ)']
];
foreach ($floorLeaders as $flNum => $info) {
    $userInsert->execute([$info[0], $defaultPasswordHash, $info[1], $info[0] . '@hungvuong.edu.vn', '0966554433', 'floor_leader']);
    $uId = $pdo->lastInsertId();
    $pdo->prepare("INSERT INTO user_scope_assignments (user_id, scope_type, scope_id) VALUES (?, 'floor', ?)")->execute([$uId, $flNum]);
    $pdo->prepare("UPDATE dormitory_floors SET floor_leader_id = ? WHERE floor_number = ?")->execute([$uId, $flNum]);
}

// 5. Room Leaders (Trưởng phòng tiêu biểu)
$roomLeaderAccounts = [
    ['tp_p201', 'Trần Hữu Long (Trưởng phòng 201)', 1],
    ['tp_p202', 'Nguyễn Anh Tuấn (Trưởng phòng 202)', 2],
    ['tp_p301', 'Hoàng Minh Quân (Trưởng phòng 301)', 25],
    ['tp_p501', 'Vũ Thảo My (Trưởng phòng 501)', 73],
    ['tp_p601', 'Ngô Diệu Anh (Trưởng phòng 601)', 97]
];
foreach ($roomLeaderAccounts as $rla) {
    $userInsert->execute([$rla[0], $defaultPasswordHash, $rla[1], $rla[0] . '@hungvuong.edu.vn', '0933221100', 'room_leader']);
    $uId = $pdo->lastInsertId();
    $pdo->prepare("INSERT INTO user_scope_assignments (user_id, scope_type, scope_id) VALUES (?, 'room', ?)")->execute([$uId, $rla[2]]);
    $pdo->prepare("UPDATE dormitory_rooms SET room_leader_id = ? WHERE id = ?")->execute([$uId, $rla[2]]);
}

// 6. 54 Homeroom Teachers (GVCN Accounts: gvcn_10toan1, etc.)
foreach ($createdClasses as $cId => $cls) {
    $username = 'gvcn_' . strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $cls['code']));
    $userInsert->execute([$username, $defaultPasswordHash, 'GVCN ' . $cls['name'], $username . '@hungvuong.edu.vn', '0911223344', 'homeroom_teacher']);
    $uId = $pdo->lastInsertId();
    $pdo->prepare("INSERT INTO user_scope_assignments (user_id, scope_type, scope_id) VALUES (?, 'class', ?)")->execute([$uId, $cId]);
    // Link to teacher
    $pdo->prepare("UPDATE teachers SET user_id = ? WHERE id = ?")->execute([$uId, $cls['teacher_id']]);
}
echo "Created Users for all 6 roles (Admin, Dorm Manager, Chi đoàn, Floor Leaders, Room Leaders, 54 GVCN).\n";

// 10. Sample Violations & Student KPI Summaries
echo "Generating Sample Violations and KPI records...\n";
$violationInsert = $pdo->prepare("INSERT INTO violation_records (code, student_id, class_id, rule_id, period_id, violation_date, violation_time, location, description, points_deducted, reported_by_user_id, status, approved_by_user_id, approved_at) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, 'approved', ?, NOW())");

$sampleViolations = [
    [1, 1, '07:08:00', 'Cổng trường Tòa A', 'Đến muộn 8 phút sau tiếng trống chào cờ', 1],
    [2, 2, '07:20:00', 'Sân trường', 'Không đeo thẻ học sinh và mặc áo khoác ngoài quy chế', 3],
    [4, 4, '08:45:00', 'Phòng học 10 Toán 1', 'Ăn bánh ngọt trong giờ giải lao để vương vãi ra sàn', 3],
    [5, 5, '09:15:00', 'Phòng học 11 Lý 1', 'Chơi game trên điện thoại trong giờ tự học', 5],
    [7, 7, '06:40:00', 'Phòng KTX P201', 'Không gấp chăn màn trước khi đi học', 3],
    [8, 8, '20:10:00', 'Hành lang Tầng 3', 'Nói chuyện to gây ồn ào giờ tự học tối', 3],
    [3, 3, '07:12:00', 'Nhà xe học sinh', 'Để xe máy điện chắn lối đi chung của giáo viên', 3]
];

$vCount = 1;
$studentDeductions = [];

// Create ~45 realistic violations
for ($v = 0; $v < 45; $v++) {
    $sRandom = $studentsData[array_rand($studentsData)];
    $sId = $sRandom['id'];
    $cId = $sRandom['class_id'];
    $tmpl = $sampleViolations[array_rand($sampleViolations)];
    $ruleId = $tmpl[0];
    $pts = $tmpl[5];
    $code = sprintf("BB-202610-%04d", $vCount++);
    $vDate = date('Y-m-d', strtotime("-" . rand(0, 30) . " days"));
    
    $violationInsert->execute([
        $code, $sId, $cId, $ruleId, $vDate, $tmpl[2], $tmpl[3], $tmpl[4], $pts, $dormMgrId, $adminId
    ]);
    
    if (!isset($studentDeductions[$sId])) {
        $studentDeductions[$sId] = 0;
    }
    $studentDeductions[$sId] += $pts;
}

// Generate student_kpi_summaries for all 1,880 students
$summaryInsert = $pdo->prepare("INSERT INTO student_kpi_summaries (student_id, period_id, baseline_score, total_deducted, final_score, classification) VALUES (?, 1, 100.0, ?, ?, ?)");
foreach ($studentsData as $st) {
    $sId = $st['id'];
    $deducted = isset($studentDeductions[$sId]) ? $studentDeductions[$sId] : 0.0;
    $final = 100.0 - $deducted;
    
    $classification = 'Xuất sắc';
    if ($final < 50) $classification = 'Chưa đạt';
    elseif ($final < 75) $classification = 'Đạt';
    elseif ($final < 90) $classification = 'Tốt';
    
    $summaryInsert->execute([$sId, $deducted, $final, $classification]);
}
echo "Populated KPI summaries for 1,880 students.\n";

// 11. Sample Leave Requests (Đơn xin phép)
$leaveInsert = $pdo->prepare("INSERT INTO leave_requests (code, student_id, request_type, reason, start_time, expected_end_time, actual_return_time, contact_phone, status, approved_by_user_id, approved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
$boardingStudents = array_filter($studentsData, fn($s) => $s['is_boarding'] == 1);
$boardingKeys = array_keys($boardingStudents);

$leaveTypes = [
    ['home', 'Về quê thăm gia đình cuối tuần', '2026-10-16 17:30:00', '2026-10-18 18:00:00', 'approved'],
    ['medical', 'Đi khám mắt tại Bệnh viện Đa khoa Tỉnh Phú Thọ', '2026-10-17 08:00:00', '2026-10-17 11:30:00', 'approved'],
    ['tutoring', 'Học thêm đội tuyển HSG Toán', '2026-10-17 18:30:00', '2026-10-17 21:00:00', 'approved'],
    ['personal', 'Dự đám cưới anh chị họ ở Lâm Thao', '2026-10-17 14:00:00', '2026-10-18 17:00:00', 'pending'],
    ['home', 'Về quê việc gia đình', '2026-10-10 17:30:00', '2026-10-11 18:00:00', 'completed']
];

for ($l = 1; $l <= 25; $l++) {
    $randKey = $boardingKeys[array_rand($boardingKeys)];
    $st = $boardingStudents[$randKey];
    $lData = $leaveTypes[array_rand($leaveTypes)];
    $code = sprintf("NP-2026-%04d", $l);
    $actReturn = ($lData[4] == 'completed') ? $lData[3] : null;
    $approvedAt = ($lData[4] != 'pending') ? '2026-10-16 10:00:00' : null;
    $approver = ($lData[4] != 'pending') ? $dormMgrId : null;
    
    $leaveInsert->execute([
        $code, $st['id'], $lData[0], $lData[1], $lData[2], $lData[3], $actReturn, '0987654321', $lData[4], $approver, $approvedAt
    ]);
}
echo "Created sample leave requests.\n";

// 12. Dormitory Attendance Session for Today (Ca tối 22h00)
$today = date('Y-m-d');
$pdo->prepare("INSERT INTO dormitory_attendance_sessions (session_date, session_type, is_locked, created_by_user_id) VALUES (?, 'evening', 0, ?)")
    ->execute([$today, $dormMgrId]);
$sessionId = $pdo->lastInsertId();

// Mark attendance for all 699 boarding students
$attInsert = $pdo->prepare("INSERT INTO dormitory_attendance_records (session_id, student_id, room_id, status, recorded_by_user_id) VALUES (?, ?, ?, ?, ?)");
foreach ($boardingStudents as $st) {
    // 97% present, 2% excused (home/medical), 1% unexcused
    $rand = rand(1, 100);
    $status = 'present';
    if ($rand > 98) $status = 'unexcused_absence';
    elseif ($rand > 95) $status = 'excused_absence';
    
    $attInsert->execute([$sessionId, $st['id'], $st['room_id'], $status, $dormMgrId]);
}

// 13. Duty Schedules for Building A
$dutyInsert = $pdo->prepare("INSERT INTO duty_schedules (duty_date, shift_name, teacher_id, location, status, notes) VALUES (?, '06:55 - 07:15', ?, 'Tòa nhà A', ?, ?)");
$dutyItemInsert = $pdo->prepare("INSERT INTO duty_checklist_items (schedule_id, step_number, title, is_completed) VALUES (?, ?, ?, ?)");

$dutySteps = [
    1 => 'Kiểm tra bảng và điều kiện phòng học',
    2 => 'Thu gom, quản lý hộp điện thoại trong thời gian 15 phút truy bài',
    3 => 'Ghi nhận tình hình lớp và trao đổi thực tế với học sinh khi cần',
    4 => 'Hoàn thành báo cáo trực ban và ghi nhận các sự việc liên quan KPI'
];

for ($d = -5; $d <= 2; $d++) {
    $dutyDate = date('Y-m-d', strtotime("$d days"));
    $tId = $dutyTeacherIds[array_rand($dutyTeacherIds)];
    $isDone = ($d < 0) ? 'completed' : 'pending';
    $dutyInsert->execute([$dutyDate, $tId, $isDone, 'Trực ban buổi sáng']);
    $schedId = $pdo->lastInsertId();
    
    foreach ($dutySteps as $sNum => $sTitle) {
        $completed = ($isDone == 'completed') ? 1 : 0;
        $dutyItemInsert->execute([$schedId, $sNum, $sTitle, $completed]);
    }
}
echo "Created duty schedules for Building A.\n";

// 14. Initial Audit Log
$pdo->prepare("INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)")
    ->execute([$adminId, 'INITIALIZE_SYSTEM', 'system', 1, 'Khởi tạo dữ liệu hệ thống THPT Chuyên Hùng Vương chuẩn quy mô 1.880 học sinh', '127.0.0.1']);

echo "Database seeding finished successfully!\n";
