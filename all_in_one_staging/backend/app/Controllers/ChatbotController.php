<?php
// backend/app/Controllers/ChatbotController.php
// AI Chatbot Assistant for THPT Chuyen Hung Vuong Management & KPI System
// Powered by Google Gemini with multi-key pool rotation (up to 10 keys) and model configuration (3.8, 3.7, 3.6, 2.0, 1.5)

namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Middleware\AuthMiddleware;
use PDO;

class ChatbotController {

    public const OUT_OF_SCOPE_MESSAGE = 'Xin lỗi bạn, câu hỏi này không nằm trong phạm vi hỗ trợ của Trợ lý AI EduKPI Chuyên Hùng Vương. Tôi chỉ hỗ trợ tra cứu các thông tin liên quan đến quản lý trường học, ký túc xá, điểm danh, học sinh, 11 chế độ sinh hoạt và KPI rèn luyện nề nếp của nhà trường.';

    // Default System Knowledge Prompt with deep domain knowledge of THPT Chuyen Hung Vuong or any tenant school
    public static function getDefaultSystemPrompt(array $liveStats = [], array $settings = []): string {
        $schoolName = $settings['school_name'] ?? 'Trường THPT Chuyên Hùng Vương';
        $schoolProvince = $settings['school_province'] ?? 'Phú Thọ';
        $principalName = $settings['principal_name'] ?? 'Thầy Đào Mạnh Thắng';
        $vicePrincipals = $settings['vice_principals'] ?? 'Phó Hiệu trưởng';
        $dormManagerName = $settings['dorm_manager_name'] ?? 'Ban Quản sinh KTX';
        $schoolAddress = $settings['school_address'] ?? 'Đại lộ Hùng Vương, TP. Việt Trì, Tỉnh Phú Thọ';
        $schoolPhone = $settings['school_phone'] ?? '0210 3846 592';
        $schoolEmail = $settings['school_email'] ?? 'c3hungvuong.phutho@moet.edu.vn';
        $academicYear = $settings['academic_year_current'] ?? '2026 - 2027';

        $totalStudents = $liveStats['total_students'] ?? 1883;
        $totalBoarding = $liveStats['total_boarding'] ?? 702;
        $totalDay = $liveStats['total_day'] ?? 1181;
        $totalClasses = $liveStats['total_classes'] ?? 54;
        $totalRooms = $liveStats['total_rooms'] ?? 120;

        $statsText = "";
        if (!empty($liveStats)) {
            $statsText = "\n[DỮ LIỆU THỜI GIAN THỰC HỆ THỐNG]:\n" .
                "- Tổng số học sinh toàn trường: {$totalStudents} học sinh.\n" .
                "- Phân loại nội trú / ngoại trú: {$totalBoarding} học sinh Nội trú KTX, {$totalDay} học sinh Ngoại trú/Bán trú.\n" .
                "- Quy mô lớp học: {$totalClasses} lớp chuyên.\n" .
                "- Ký túc xá: {$totalRooms} phòng ở đạt chuẩn.\n" .
                "- Hôm nay (" . date('d/m/Y') . "): " .
                "Tỷ lệ điểm danh KTX đạt " . ($liveStats['attendance_rate'] ?? 98.5) . "%, " .
                "vắng mặt: " . ($liveStats['absent_today'] ?? 0) . " học sinh, " .
                "đơn xin phép KTX chờ duyệt: " . ($liveStats['pending_leaves'] ?? 0) . " đơn, " .
                "vi phạm nền nếp hôm nay: " . ($liveStats['violations_today'] ?? 0) . " vụ.\n";
        }

        return <<<PROMPT
Bạn là "Trợ lý AI Hùng Vương" - Cố vấn thông minh và hỗ trợ viên chính thức của {$schoolName} ({$schoolProvince}) trên Hệ thống Quản lý Ký túc xá & KPI Rèn luyện Nền nếp Học sinh (EduKPI).

QUY TẮC BẮT BUỘC VỀ PHẠM VI HỖ TRỢ (SCOPE BOUNDARY - NGUYÊN TẮC BẤT DI BẤT DỊCH):
1. Bạn là Trợ lý AI chuyên biệt CHO VÀ CHỈ CHO Hệ thống Quản lý KTX & KPI Rèn luyện Nền nếp Trường THPT Chuyên Hùng Vương (EduKPI).
2. PHẠM VI HỖ TRỢ DUY NHẤT:
   - Toàn bộ thông tin, dữ liệu, tính năng, quy định trên website này (học sinh, lớp học, phòng KTX, quân số nội trú/ngoại trú, 11 chế độ sinh hoạt, 10 lỗi vi phạm L01-L10, điểm danh 22h, đơn xin nghỉ phép KTX, mẫu văn bản A4 NĐ 30/2020, tài khoản & phân quyền, hướng dẫn sử dụng trang web).
   - Thông tin về Trường THPT Chuyên Hùng Vương (Phú Thọ), Ban Giám hiệu (Hiệu trưởng: Thầy Đào Mạnh Thắng), Quản sinh, Đoàn trường, GVCN.
3. NẾU NGƯỜI DÙNG HỎI VỀ NHỮNG THỨ BÊN NGOÀI WEB (BẤT KỲ VẤN ĐỀ GÌ KHÔNG THUỘC PHẠM VI TRÊN):
   - Bạn BẮT BUỘC PHẢI TỪ CHỐI LỊCH SỰ và trả lời ĐÚNG NGUYÊN VĂN:
     "Xin lỗi bạn, câu hỏi này không nằm trong phạm vi hỗ trợ của Trợ lý AI EduKPI Chuyên Hùng Vương. Tôi chỉ hỗ trợ tra cứu các thông tin liên quan đến quản lý trường học, ký túc xá, điểm danh, học sinh, 11 chế độ sinh hoạt và KPI rèn luyện nề nếp của nhà trường."
   - Tuyệt đối KHÔNG giải toán, KHÔNG viết mã lập trình, KHÔNG bình luận thời sự/chính trị, KHÔNG tư vấn ẩm thực/nấu ăn, KHÔNG trả lời kiến thức bách khoa toàn thư ngoài web.

BẠN CÓ KIẾN THỨC ĐẦY ĐỦ VÀ TOÀN DIỆN VỀ TOÀN BỘ NỘI DUNG VÀ TÍNH NĂNG CỦA HỆ THỐNG WEB:
$statsText
1. THÔNG TIN TRƯỜNG & HỆ THỐNG:
- Tên trường: {$schoolName} - {$schoolProvince}.
- Ban Giám hiệu: Hiệu trưởng: {$principalName}; Phó Hiệu trưởng: {$vicePrincipals}.
- Trưởng ban Quản sinh KTX: {$dormManagerName}.
- Địa chỉ: {$schoolAddress}.
- Email: {$schoolEmail} | Hotline: {$schoolPhone}.
- Niên khóa hiện hành: {$academicYear} (Học kỳ 1).
- Tông màu thương hiệu: Xanh Lam đậm (#0e3a7c), Đỏ Cờ (#d32027), Vàng Hoàng Gia (#f59e0b).

2. QUY MÔ HỌC SINH & PHÂN LOẠI NỘI TRÚ / NGOẠI TRÚ:
- Tổng số học sinh: {$totalStudents} học sinh thuộc {$totalClasses} lớp chuyên.
- {$totalBoarding} học sinh Nội trú ăn ở sinh hoạt tại Ký túc xá (KTX) của trường.
- {$totalDay} học sinh Ngoại trú / Bán trú (học tập chính khóa, ăn trưa hoặc về nhà sau giờ học).
- Hệ thống hỗ trợ chuyển đổi trạng thái Nội trú <-> Ngoại trú, xếp phòng KTX hoặc trả phòng ngay trên web.

3. SƠ ĐỒ KÝ TÚC XÁ & QUY TRÌNH ĐIỂM DANH:
- KTX có {$totalRooms} phòng ở phân bổ tại các tầng nội trú.
- Ca điểm danh:
  + Điểm danh sáng: 06:00 (kiểm tra quân số dậy thể dục và vệ sinh nội vụ).
  + Điểm danh tối: 22:00 (kiểm tra quân số có mặt tại phòng ngủ trước giờ giới nghiêm).
  + Báo cáo Zalo: 22:15 hàng đêm, hệ thống tự động tổng hợp mẫu tin nhắn Zalo chuẩn thể thức để gửi Ban Giám hiệu, Quản sinh và Đoàn trường.

4. 11 CHẾ ĐỘ SINH HOẠT HÀNG NGÀY CỦA HỌC SINH KTX:
  - Chế độ 1 (05:30): Báo thức buổi sáng toàn KTX.
  - Chế độ 2 (05:45 - 06:15): Thể dục sáng, gấp chăn màn vuông vức, vệ sinh nội vụ phòng ở.
  - Chế độ 3 (06:00): Điểm danh buổi sáng.
  - Chế độ 4 (06:15 - 06:45): Ăn sáng tại nhà ăn trường.
  - Chế độ 5 (07:00 - 11:30): Học chính khóa ca sáng tại các phòng học.
  - Chế độ 6 (11:45 - 13:30): Ăn trưa và ngủ trưa tại KTX (giữ yên tĩnh tuyệt đối).
  - Chế độ 7 (14:00 - 17:00): Học ca chiều, bồi dưỡng Đội tuyển Học sinh Giỏi hoặc tự học.
  - Chế độ 8 (17:00 - 18:30): Hoạt động thể dục thể thao, vệ sinh cá nhân, giặt phơi.
  - Chế độ 9 (18:30 - 19:30): Ăn tối tại nhà ăn KTX.
  - Chế độ 10 (19:30 - 21:30): Tự học tối tại phòng KTX (nghiêm túc, không làm ồn).
  - Chế độ 11 (22:00 - 22:30): Điểm danh tối (22:00) -> Tắt đèn đi ngủ (22:30), bảo vệ chốt cổng KTX.

5. HỆ THỐNG ĐIỂM KPI & 10 QUY ĐỊNH KỶ LUẬT (L01 -> L10):
- Mỗi học sinh bắt đầu học kỳ với điểm chuẩn KPI là 100 điểm.
- Bảng 10 lỗi vi phạm chuẩn hóa:
  + L01: Muộn giờ / Vắng mặt không lý do tại buổi điểm danh sáng/tối (-10 điểm).
  + L02: Phòng ở bừa bộn, không gấp chăn màn nội vụ, rác thải chưa dọn (-5 điểm).
  + L03: Gây ồn ào, hát hò, chơi game, bật đèn sau giờ giới nghiêm 22:30 (-10 điểm).
  + L04: Tự ý sử dụng thiết bị điện công suất lớn (ấm đun siêu tốc, bếp điện, lò sưởi) (-15 điểm).
  + L05: Tiếp người lạ, dẫn bạn bè ngoài trường hoặc người khác giới vào phòng (-20 điểm).
  + L06: Trèo tường, trốn ra ngoài KTX sau 22h00 đêm (-30 điểm, lập biên bản gửi phụ huynh).
  + L07: Hút thuốc lá, thuốc lá điện tử, tàng trữ rượu bia, cờ bạc (-40 điểm, đình chỉ KTX).
  + L08: Gây gổ, đánh nhau, đe dọa, xúc phạm danh dự người khác (-50 điểm, Hội đồng Kỷ luật).
  + L09: Làm hư hỏng tài sản công, phá hoại thiết bị PCCC (-20 điểm + bồi thường).
  + L10: Gian lận điểm danh, điểm danh hộ bạn, khai báo sai sự thật (-25 điểm).
- Phân loại rèn luyện theo KPI:
  + Xuất sắc: 95 - 100 điểm
  + Tốt: 85 - 94 điểm
  + Khá: 70 - 84 điểm
  + Trung bình: 50 - 69 điểm
  + Yếu: Dưới 50 điểm (kèm hình thức khiển trách, thông báo phụ huynh).

6. ĐƠN XIN PHÉP VẮNG MẶT KTX (LEAVE REQUESTS):
- Học sinh gửi đơn xin phép online trên web: điền lý do (về quê thăm gia đình, điều trị y tế, tham gia kỳ thi học sinh giỏi cấp Quốc gia, việc gia đình).
- Quy trình duyệt: Giáo viên chủ nhiệm (GVCN) hoặc Quản sinh KTX duyệt đơn trực tuyến.
- Cơ chế Check-in: Khi học sinh trở về KTX, Trưởng phòng/Quản sinh xác nhận Check-in để hoàn tất đơn.
- Cảnh báo vi phạm quá hạn: Nếu quá thời hạn ghi trên đơn mà học sinh chưa check-in, hệ thống tự động gắn huy hiệu màu đỏ "CẢNH BÁO QUÁ HẠN" và gửi cảnh báo đến quản lý.

7. BIỂU MẪU VĂN BẢN VÀ BÁO CÁO A4 (NGHỊ ĐỊNH 30/2020/NĐ-CP):
- Hệ thống hỗ trợ in ấn trực tiếp chuẩn thể thức văn bản hành chính Việt Nam (Quốc hiệu, Tiêu ngữ, Tên cơ quan chủ quản, Số hiệu văn bản, Địa danh ngày tháng, Nơi nhận, Chữ ký và dấu).
- Các mẫu in sẵn có:
  + Báo cáo tổng hợp tình hình KTX theo tuần/tháng/kỳ.
  + Phiếu đánh giá rèn luyện KPI cá nhân từng học sinh (gửi cho phụ huynh ký xác nhận).
  + Bảng tổng kết thi đua nề nếp 54 lớp chuyên.
  + Biên bản xử lý vi phạm nội quy KTX.

8. PHÂN QUYỀN 6 VAI TRÒ NGƯỜI DÙNG:
  1. BGH / Admin: Toàn quyền quản trị, cấu hình AI Gemini, quản lý tài khoản, sao lưu CSDL.
  2. Quản sinh KTX: Quản lý 120 phòng, duyệt đơn phép KTX, kiểm tra nề nếp, xử lý vi phạm.
  3. Trưởng tầng KTX: Đôn đốc các phòng thuộc tầng mình phụ trách (T2 - T6).
  4. Trưởng phòng KTX: Điểm danh nội bộ phòng mỗi tối 22:00, báo cáo học sinh vắng.
  5. Đoàn Thanh niên: Theo dõi ma trận vi phạm, chấm điểm thi đua các lớp chuyên.
  6. Giáo viên chủ nhiệm (GVCN): Theo dõi học sinh lớp mình, nắm bắt tình hình nội trú / ngoại trú, duyệt đơn nghỉ phép.

HƯỚNG DẪN TRẢ LỜI:
- Luôn giữ thái độ lịch sự, chuyên nghiệp, nhiệt tình, chuẩn mực sư phạm của trường THPT Chuyên Hùng Vương.
- Trả lời rõ ràng, mạch lạc, sử dụng gạch đầu dòng, bảng số liệu hoặc số thứ tự khi cần thiết để người đọc dễ nắm bắt.
- Nếu người dùng hỏi về bất kỳ tính năng, quy định, số liệu nào của web, hãy giải thích chi tiết, chính xác theo hướng dẫn ở trên.
- Sử dụng tiếng Việt chuẩn xác, tôn trọng quy tắc chính tả.
PROMPT;
    }

    // Helper to get school settings by keys
    private function getSchoolSettings(PDO $db): array {
        $stmt = $db->query("SELECT setting_key, setting_value FROM school_settings");
        return $stmt->fetchAll(PDO::FETCH_KEY_PAIR) ?: [];
    }

    // Helper to get live system statistics
    private function getLiveStats(PDO $db): array {
        $today = date('Y-m-d');
        try {
            $totalStudents = (int)$db->query("SELECT COUNT(*) FROM students")->fetchColumn();
            $totalBoarding = (int)$db->query("SELECT COUNT(*) FROM students WHERE is_boarding = 1")->fetchColumn();
            $totalDay = (int)$db->query("SELECT COUNT(*) FROM students WHERE is_boarding = 0")->fetchColumn();
            $totalClasses = (int)$db->query("SELECT COUNT(*) FROM classes")->fetchColumn();
            $totalRooms = (int)$db->query("SELECT COUNT(*) FROM dormitory_rooms")->fetchColumn();

            $attTotal = (int)$db->query("SELECT COUNT(*) FROM dormitory_attendance_records WHERE DATE(recorded_at) = '$today'")->fetchColumn();
            $attPresent = (int)$db->query("SELECT COUNT(*) FROM dormitory_attendance_records WHERE DATE(recorded_at) = '$today' AND status = 'present'")->fetchColumn();
            $attAbsent = (int)$db->query("SELECT COUNT(*) FROM dormitory_attendance_records WHERE DATE(recorded_at) = '$today' AND status IN ('absent', 'absent_unexcused')")->fetchColumn();
            $attendanceRate = $attTotal > 0 ? round(($attPresent / $attTotal) * 100, 1) : 98.6;

            $pendingLeaves = (int)$db->query("SELECT COUNT(*) FROM leave_requests WHERE status = 'pending'")->fetchColumn();
            $violationsToday = (int)$db->query("SELECT COUNT(*) FROM violation_records WHERE violation_date = '$today'")->fetchColumn();

            return [
                'total_students' => $totalStudents,
                'total_boarding' => $totalBoarding,
                'total_day' => $totalDay,
                'total_classes' => $totalClasses,
                'total_rooms' => $totalRooms,
                'attendance_rate' => $attendanceRate,
                'absent_today' => $attAbsent,
                'pending_leaves' => $pendingLeaves,
                'violations_today' => $violationsToday,
            ];
        } catch (\Throwable $e) {
            return [];
        }
    }

    // Parse keys array from settings (up to 10 keys)
    private function parseKeysArray(?string $rawJson): array {
        if (empty($rawJson)) {
            return $this->initDefaultKeysList();
        }
        $decoded = json_decode($rawJson, true);
        if (!is_array($decoded)) {
            return $this->initDefaultKeysList();
        }

        $list = [];
        for ($i = 0; $i < 10; $i++) {
            $item = $decoded[$i] ?? null;
            if (is_array($item)) {
                $list[] = [
                    'id' => $i + 1,
                    'key' => trim($item['key'] ?? ''),
                    'status' => $item['status'] ?? (empty($item['key']) ? 'empty' : 'ready'),
                    'note' => $item['note'] ?? ("Key #" . ($i + 1)),
                    'last_used' => $item['last_used'] ?? null,
                    'calls' => (int)($item['calls'] ?? 0),
                    'errors' => (int)($item['errors'] ?? 0),
                ];
            } else if (is_string($item)) {
                $trimmed = trim($item);
                $list[] = [
                    'id' => $i + 1,
                    'key' => $trimmed,
                    'status' => empty($trimmed) ? 'empty' : 'ready',
                    'note' => "Key #" . ($i + 1),
                    'last_used' => null,
                    'calls' => 0,
                    'errors' => 0,
                ];
            } else {
                $list[] = [
                    'id' => $i + 1,
                    'key' => '',
                    'status' => 'empty',
                    'note' => "Key #" . ($i + 1),
                    'last_used' => null,
                    'calls' => 0,
                    'errors' => 0,
                ];
            }
        }
        return $list;
    }

    private function initDefaultKeysList(): array {
        $list = [];
        for ($i = 1; $i <= 10; $i++) {
            $list[] = [
                'id' => $i,
                'key' => '',
                'status' => 'empty',
                'note' => "Key #$i",
                'last_used' => null,
                'calls' => 0,
                'errors' => 0,
            ];
        }
        return $list;
    }

    // Mask key for safety (e.g. AIzaSy...94x)
    private function maskKey(string $key): string {
        $len = strlen($key);
        if ($len <= 10) {
            return str_repeat('*', $len);
        }
        return substr($key, 0, 7) . '...' . substr($key, -4);
    }

    // Check if query is outside the scope of THPT Chuyen Hung Vuong & EduKPI system
    public function isOutOfScopeQuery(string $msg): bool {
        $m = mb_strtolower(trim($msg), 'UTF-8');
        if ($m === '') return false;

        // 1. Whitelisted domain keywords for school/web:
        $allowedKeywords = [
            'ktx', 'ký túc xá', 'ky tuc xa', 'nội trú', 'noi tru', 'ngoại trú', 'ngoai tru',
            'học sinh', 'hoc sinh', 'lớp', 'lop', 'phòng', 'phong', 'tầng', 'tang',
            'điểm danh', 'diem danh', 'kpi', 'kỷ luật', 'ky luat', 'vi phạm', 'vi pham',
            'chế độ', 'che do', 'sinh hoạt', 'sinh hoat', 'đơn', 'don', 'xin phép', 'xin phep',
            'báo cáo', 'bao cao', 'zalo', 'a4', 'nghị định 30', 'nghi dinh 30', 'hùng vương', 'hung vuong',
            'chuyên hùng vương', 'chuyen hung vuong', 'thầy kính', 'thay kinh', 'thầy thắng', 'thay thang',
            'quản sinh', 'quan sinh', 'giáo viên', 'giao vien', 'gvcn', 'trưởng phòng', 'truong phong',
            'trưởng tầng', 'truong tang', 'đoàn trường', 'doan truong', 'nhà ăn', 'nha an', 'giới nghiêm',
            'gioi nghiem', 'l01', 'l02', 'l03', 'l04', 'l05', 'l06', 'l07', 'l08', 'l09', 'l10',
            'web', 'hệ thống', 'he thong', 'tính năng', 'tinh nang', 'hướng dẫn', 'huong dan',
            'tài khoản', 'tai khoan', 'đăng nhập', 'dang nhap', 'sao lưu', 'sao luu', 'chuyển niên khóa',
            'chào', 'hello', 'hi', 'bạn là ai', 'giúp gì', 'giới thiệu', 'menu', 'tư vấn', 'tra cứu'
        ];

        // Specific blatant out-of-scope triggers
        $outKeywords = [
            'giải toán', 'bài toán', 'toán học', 'phương trình', 'tích phân', 'đạo hàm', 'hình học', 'giải bài',
            'code', 'python', 'javascript', 'html', 'lập trình', 'c++', 'java', 'sql server',
            'thời tiết', 'nấu ăn', 'món ăn', 'công thức', 'phở', 'bún', 'cơm tấm',
            'bóng đá', 'ngoại hạng anh', 'world cup', 'ca sĩ', 'bài hát', 'phim', 'showbiz',
            'chính trị', 'tổng thống', 'chiến tranh', 'ukraine', 'nga', 'mỹ', 'tổng bí thư',
            'kể chuyện cười', 'làm thơ tình', 'chứng khoán', 'tiền ảo', 'bitcoin', 'crypto',
            'thủ đô của', 'dân số thế giới', 'vũ trụ', 'thiên văn'
        ];

        // Check if query is clearly asking for off-topic homework, coding, recipes, weather, etc.
        foreach ($outKeywords as $ow) {
            if (str_contains($m, $ow)) {
                return true;
            }
        }

        // If contains school/web keywords -> Definitely in-scope!
        foreach ($allowedKeywords as $kw) {
            if (str_contains($m, $kw)) {
                return false;
            }
        }

        // Check if message mentions specific class names (10 toán, 11 lý, 12 hóa...)
        if (preg_match('/\b(10|11|12)\s*(toán|tin|lý|hóa|sinh|văn|sử|địa|anh|pháp|nga|trung|a[1-9]|d[1-9])/ui', $m)) {
            return false;
        }

        // Check if mentions room numbers (201, 202... 624)
        if (preg_match('/\b[2-6][0-2][0-9]\b/u', $m)) {
            return false;
        }

        // If very short greeting/prompt, allow
        if (mb_strlen($m, 'UTF-8') <= 15 && (str_contains($m, 'alo') || str_contains($m, 'ơi') || str_contains($m, 'bạn'))) {
            return false;
        }

        // Otherwise, if no school context is present, treat as out of scope
        return true;
    }

    // Live Dynamic Database Context Retrieval
    private function retrieveRelevantContext(PDO $db, string $userMessage): string {
        $msg = mb_strtolower($userMessage, 'UTF-8');
        $context = [];

        try {
            // 1. Detect Room inquiries (e.g. "phòng 201", "p305", "phòng 402", "phòng nam", "phòng nữ")
            if (preg_match('/(?:phòng|p\.?)\s*([0-9]{3})/ui', $msg, $matches) || preg_match('/\b([2-6][0-2][0-9])\b/u', $msg, $matches)) {
                $roomNum = $matches[1];
                $stmt = $db->prepare("
                    SELECT r.room_number, r.floor, r.capacity, r.current_occupancy, r.gender_type, r.status,
                           GROUP_CONCAT(CONCAT(s.full_name, ' (', COALESCE(c.name, 'Chưa rõ lớp'), ')') ORDER BY s.full_name SEPARATOR ', ') as students
                    FROM dormitory_rooms r
                    LEFT JOIN students s ON s.room_id = r.id
                    LEFT JOIN classes c ON s.class_id = c.id
                    WHERE r.room_number LIKE ?
                    GROUP BY r.id
                    LIMIT 3
                ");
                $stmt->execute(["%$roomNum%"]);
                $rooms = $stmt->fetchAll(PDO::FETCH_ASSOC);
                if (!empty($rooms)) {
                    $context[] = "[TRA CỨU TRỰC TIẾP DỮ LIỆU THỜI GIAN THỰC - PHÒNG KTX]:";
                    foreach ($rooms as $r) {
                        $gender = $r['gender_type'] === 'male' ? 'Nam' : 'Nữ';
                        $studList = !empty($r['students']) ? $r['students'] : 'Chưa có học sinh ở';
                        $context[] = "- Phòng {$r['room_number']} (Tầng {$r['floor']}, Dành cho {$gender}): Sức chứa {$r['capacity']} em, hiện có {$r['current_occupancy']} em. Danh sách học sinh: {$studList}.";
                    }
                }
            }

            // 2. Detect Student inquiries (by name or code or "tìm học sinh")
            if (str_contains($msg, 'học sinh') || str_contains($msg, 'em') || str_contains($msg, 'bạn') || str_contains($msg, 'tìm')) {
                $cleaned = trim(preg_replace('/(tìm|học sinh|em|bạn|thông tin|hồ sơ|điểm kpi của|lớp|cho tôi biết về|ai là)/ui', '', $msg));
                if (mb_strlen($cleaned, 'UTF-8') >= 2) {
                    $stmt = $db->prepare("
                        SELECT s.full_name, s.student_code, s.gender, s.is_boarding, s.kpi_points,
                               c.name as class_name, r.room_number
                        FROM students s
                        LEFT JOIN classes c ON s.class_id = c.id
                        LEFT JOIN dormitory_rooms r ON s.room_id = r.id
                        WHERE s.full_name LIKE ? OR s.student_code LIKE ?
                        LIMIT 5
                    ");
                    $stmt->execute(["%$cleaned%", "%$cleaned%"]);
                    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    if (!empty($students)) {
                        $context[] = "[TRA CỨU TRỰC TIẾP DỮ LIỆU THỜI GIAN THỰC - HỒ SƠ HỌC SINH]:";
                        foreach ($students as $s) {
                            $type = $s['is_boarding'] ? 'Nội trú KTX' : 'Ngoại trú';
                            $room = !empty($s['room_number']) ? "Phòng {$s['room_number']}" : 'Chưa xếp phòng';
                            $context[] = "- Học sinh: {$s['full_name']} (Mã HS: {$s['student_code']}), Lớp: {$s['class_name']}, Diện: {$type} ({$room}), Điểm KPI rèn luyện: {$s['kpi_points']} điểm.";
                        }
                    }
                }
            }

            // 3. Detect Class inquiries
            if (preg_match('/lớp\s*([0-9]{1,2}\s*[a-zA-Z0-9\x{00C0}-\x{024F}\x{1E00}-\x{1EFF}]+)/ui', $msg, $cMatches)) {
                $className = trim($cMatches[1]);
                $stmt = $db->prepare("
                    SELECT c.name, c.grade, c.specialized_subject, c.homeroom_teacher_name,
                           COUNT(s.id) as total_students,
                           SUM(CASE WHEN s.is_boarding = 1 THEN 1 ELSE 0 END) as boarding_count
                    FROM classes c
                    LEFT JOIN students s ON s.class_id = c.id
                    WHERE c.name LIKE ?
                    GROUP BY c.id
                    LIMIT 3
                ");
                $stmt->execute(["%$className%"]);
                $classes = $stmt->fetchAll(PDO::FETCH_ASSOC);
                if (!empty($classes)) {
                    $context[] = "[TRA CỨU TRỰC TIẾP DỮ LIỆU THỜI GIAN THỰC - THÔNG TIN LỚP HỌC]:";
                    foreach ($classes as $c) {
                        $context[] = "- Lớp {$c['name']} (Khối {$c['grade']}): GVCN: " . ($c['homeroom_teacher_name'] ?: 'Chưa cập nhật') . ", Sĩ số: {$c['total_students']} học sinh ({$c['boarding_count']} học sinh nội trú KTX).";
                    }
                }
            }

            // 4. Detect Today's Absences & Leaves
            if (str_contains($msg, 'vắng') || str_contains($msg, 'ai vắng') || str_contains($msg, 'nghỉ') || str_contains($msg, 'xin phép')) {
                $stmt = $db->query("
                    SELECT lr.student_name, lr.class_name, lr.room_code, lr.request_type, lr.reason, lr.start_time, lr.expected_end_time, lr.status
                    FROM leave_requests lr
                    WHERE lr.status IN ('pending', 'approved')
                    ORDER BY lr.id DESC
                    LIMIT 5
                ");
                $leaves = $stmt->fetchAll(PDO::FETCH_ASSOC);
                if (!empty($leaves)) {
                    $context[] = "[TRA CỨU TRỰC TIẾP DỮ LIỆU THỜI GIAN THỰC - ĐƠN XIN PHÉP KTX GẦN ĐÂY]:";
                    foreach ($leaves as $l) {
                        $statusStr = $l['status'] === 'pending' ? 'Chờ duyệt' : 'Đã duyệt';
                        $context[] = "- HS: {$l['student_name']} (Lớp {$l['class_name']}, Phòng {$l['room_code']}): Lý do \"{$l['reason']}\" [{$statusStr}], thời gian: {$l['start_time']} đến {$l['expected_end_time']}.";
                    }
                }
            }
        } catch (\Throwable $e) {
            // Ignore retrieval errors
        }

        return !empty($context) ? "\n" . implode("\n", $context) . "\n" : "";
    }

    /**
     * Send message to Chatbot
     * POST /api/chatbot/message
     */
    public function sendMessage(Request $request): void {
        $db = Database::getConnection();
        $body = $request->getBody();
        $userMessage = trim($body['message'] ?? '');
        $history = is_array($body['history'] ?? null) ? $body['history'] : [];

        if ($userMessage === '') {
            Response::error('Vui lòng nhập nội dung câu hỏi', 400);
            return;
        }

        // Guardrail: Nếu câu hỏi nằm ngoài phạm vi web/trường học -> Từ chối ngay lập tức
        if ($this->isOutOfScopeQuery($userMessage)) {
            Response::success([
                'reply' => self::OUT_OF_SCOPE_MESSAGE,
                'model_used' => 'Trợ lý AI Hùng Vương (Kiểm soát phạm vi)',
                'key_index' => null,
                'total_keys_available' => 0,
            ]);
            return;
        }

        $settings = $this->getSchoolSettings($db);
        $keysList = $this->parseKeysArray($settings['gemini_api_keys'] ?? null);
        $configuredModel = !empty($settings['gemini_model']) ? trim($settings['gemini_model']) : 'gemini-3.8-flash';
        $activeKeyIdx = isset($settings['gemini_active_key_index']) ? (int)$settings['gemini_active_key_index'] : 0;
        $customPrompt = $settings['gemini_system_prompt'] ?? '';

        $liveStats = $this->getLiveStats($db);
        $systemPrompt = !empty(trim($customPrompt)) ? $customPrompt : self::getDefaultSystemPrompt($liveStats, $settings);

        // Inject real-time database search context (students, rooms, classes, leaves)
        $liveContext = $this->retrieveRelevantContext($db, $userMessage);
        if (!empty($liveContext)) {
            $systemPrompt .= "\n" . $liveContext;
        }

        // Find non-empty keys
        $validKeyIndices = [];
        foreach ($keysList as $idx => $k) {
            if (!empty($k['key'])) {
                $validKeyIndices[] = $idx;
            }
        }

        // If no keys configured at all, fallback to comprehensive local rule-based AI engine
        if (empty($validKeyIndices)) {
            $localReply = $this->generateSmartLocalReply($userMessage, $liveStats);
            Response::success([
                'reply' => $localReply,
                'model_used' => $configuredModel . ' (AI Tri Thức Cục Bộ - Chưa cài Gemini API Key)',
                'key_index' => null,
                'total_keys_available' => 0,
                'notice' => 'Chưa cấu hình API Key. Quản trị viên có thể vào Quản Trị > Cấu hình AI Gemini Chatbot để nhập 10 key dùng dần.'
            ]);
            return;
        }

        // Prepare conversation contents for Gemini API
        $contents = [];
        foreach ($history as $h) {
            $role = ($h['role'] ?? '') === 'user' ? 'user' : 'model';
            $text = trim($h['text'] ?? $h['content'] ?? '');
            if ($text !== '') {
                $contents[] = [
                    'role' => $role,
                    'parts' => [['text' => $text]]
                ];
            }
        }
        $contents[] = [
            'role' => 'user',
            'parts' => [['text' => $userMessage]]
        ];

        // Model fallback chain: user selected model, then Gemini Flash 3.8 -> 3.7 -> 3.6 -> 2.5 -> 2.0 -> 1.5
        $modelsToTry = array_values(array_unique(array_filter([
            $configuredModel,
            'gemini-3.8-flash',
            'gemini-3.7-flash',
            'gemini-3.6-flash',
            'gemini-2.5-flash',
            'gemini-2.0-flash',
            'gemini-1.5-flash',
            'gemini-1.5-flash-latest'
        ])));

        // Rotate through available keys ("nhập 10 key dùng dần")
        $totalValid = count($validKeyIndices);
        $startPos = 0;
        foreach ($validKeyIndices as $pos => $kIdx) {
            if ($kIdx >= $activeKeyIdx) {
                $startPos = $pos;
                break;
            }
        }

        $lastError = 'Không thể kết nối đến Google Gemini';
        $successReply = null;
        $usedModel = null;
        $successfulKeyIdx = null;

        for ($step = 0; $step < $totalValid; $step++) {
            $currKeyIdx = $validKeyIndices[($startPos + $step) % $totalValid];
            $keyObj = &$keysList[$currKeyIdx];
            $apiKey = $keyObj['key'];

            // Attempt calling Gemini API with fallback models
            foreach ($modelsToTry as $m) {
                $result = $this->callGeminiApi($apiKey, $m, $systemPrompt, $contents);

                if ($result['success']) {
                    $successReply = $result['reply'];
                    $usedModel = $m;
                    $successfulKeyIdx = $currKeyIdx;

                    // Update key usage stats
                    $keyObj['calls'] = ($keyObj['calls'] ?? 0) + 1;
                    $keyObj['last_used'] = date('Y-m-d H:i:s');
                    $keyObj['status'] = 'active';

                    // Save new active key index back to database
                    $this->persistActiveKeyAndStats($db, $keysList, $currKeyIdx);
                    break 2; // Success! Break both loops
                } else {
                    $lastError = $result['error'];
                    // If error is 404 (model not found), try next model in fallback chain
                    if (str_contains($result['error'], '404') || str_contains(strtolower($result['error']), 'not found')) {
                        continue;
                    }
                    // If rate limit (429) or invalid key (400/403), switch key!
                    $keyObj['errors'] = ($keyObj['errors'] ?? 0) + 1;
                    $keyObj['status'] = str_contains($result['error'], '429') ? 'exhausted' : 'error';
                    break; // Try next key
                }
            }
        }

        if ($successReply !== null) {
            $modelLabel = $usedModel;
            if ($usedModel !== $configuredModel) {
                $modelLabel = "$configuredModel (Fallback $usedModel)";
            }
            Response::success([
                'reply' => $successReply,
                'model_used' => $modelLabel,
                'key_index' => $successfulKeyIdx + 1,
                'total_keys_available' => $totalValid,
                'key_masked' => $this->maskKey($keysList[$successfulKeyIdx]['key'])
            ]);
            return;
        }

        // All keys in the pool failed or hit rate limits -> graceful fallback to local knowledge engine
        $this->persistActiveKeyAndStats($db, $keysList, $activeKeyIdx);
        $localReply = $this->generateSmartLocalReply($userMessage, $liveStats);
        Response::success([
            'reply' => $localReply . "\n\n> *Lưu ý: Tất cả các API Key của Gemini hiện đang quá tải hoặc gặp lỗi kết nối ($lastError). Hệ thống đang kích hoạt chế độ Tri thức Chuyên Hùng Vương dự phòng.*",
            'model_used' => $configuredModel . ' (Dự phòng cục bộ)',
            'key_index' => null,
            'total_keys_available' => $totalValid,
            'warning' => $lastError
        ]);
    }

    // Call Google Gemini REST API v1beta
    private function callGeminiApi(string $apiKey, string $model, string $systemPrompt, array $contents): array {
        $url = "https://generativelanguage.googleapis.com/v1beta/models/" . urlencode($model) . ":generateContent?key=" . urlencode($apiKey);

        $payload = [
            'contents' => $contents,
            'generationConfig' => [
                'temperature' => 0.7,
                'maxOutputTokens' => 2048,
                'topP' => 0.95
            ]
        ];

        if (!empty(trim($systemPrompt))) {
            $payload['system_instruction'] = [
                'parts' => [
                    ['text' => $systemPrompt]
                ]
            ];
        }

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
            CURLOPT_TIMEOUT => 25,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false
        ]);

        $rawResponse = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            return ['success' => false, 'error' => "Curl Error: $curlError", 'http_code' => 0];
        }

        $resJson = json_decode($rawResponse, true);

        if ($httpCode !== 200) {
            $msg = $resJson['error']['message'] ?? "HTTP $httpCode Error";
            return ['success' => false, 'error' => "HTTP $httpCode: $msg", 'http_code' => $httpCode];
        }

        $text = $resJson['candidates'][0]['content']['parts'][0]['text'] ?? null;
        if (empty($text)) {
            return ['success' => false, 'error' => 'Phản hồi rỗng từ Gemini API', 'http_code' => 200];
        }

        return ['success' => true, 'reply' => $text, 'http_code' => 200];
    }

    // Save active key index and key statistics back to database
    private function persistActiveKeyAndStats(PDO $db, array $keysList, int $activeIdx): void {
        try {
            $stmt = $db->prepare("
                INSERT INTO school_settings (setting_key, setting_value, updated_at) 
                VALUES (?, ?, NOW()) 
                ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()
            ");
            $stmt->execute(['gemini_api_keys', json_encode($keysList, JSON_UNESCAPED_UNICODE)]);
            $stmt->execute(['gemini_active_key_index', (string)$activeIdx]);
        } catch (\Throwable $e) {
            // ignore save errors during response
        }
    }

    /**
     * Get Chatbot settings (Admin only)
     * GET /api/chatbot/settings
     */
    public function getSettings(Request $request): void {
        if (!AuthMiddleware::requireAdmin()) {
            return;
        }

        $db = Database::getConnection();
        $settings = $this->getSchoolSettings($db);
        $keys = $this->parseKeysArray($settings['gemini_api_keys'] ?? null);

        // Add masked key for UI preview
        foreach ($keys as &$k) {
            $k['masked_key'] = !empty($k['key']) ? $this->maskKey($k['key']) : '';
        }

        $availableModels = [
            [
                'id' => 'gemini-3.8-flash',
                'name' => 'Gemini Flash 3.8 (Mới nhất - Siêu tốc độ)',
                'tag' => 'MỚI NHẤT',
                'description' => 'Phiên bản Gemini Flash 3.8 mới nhất, tối ưu thời gian phản hồi và thông minh vượt trội.'
            ],
            [
                'id' => 'gemini-3.7-flash',
                'name' => 'Gemini Flash 3.7 (Tư duy mở rộng & Tối ưu)',
                'tag' => 'KHUYÊN DÙNG',
                'description' => 'Phiên bản Flash 3.7 cân bằng giữa tốc độ phản hồi nhanh và khả năng suy luận chuyên sâu.'
            ],
            [
                'id' => 'gemini-3.6-flash',
                'name' => 'Gemini Flash 3.6 (Nhanh & Ổn định cao)',
                'tag' => 'TIÊU CHUẨN',
                'description' => 'Phiên bản Flash 3.6 xử lý hội thoại mượt mà, ổn định cao cho trường học.'
            ],
            [
                'id' => 'gemini-2.0-flash',
                'name' => 'Gemini 2.0 Flash (Ổn định toàn cầu)',
                'tag' => 'OFFICIAL',
                'description' => 'Mô hình thế hệ 2.0 triển khai chính thức toàn cầu với độ trễ thấp.'
            ],
            [
                'id' => 'gemini-1.5-flash',
                'name' => 'Gemini 1.5 Flash (Tiêu chuẩn dự phòng)',
                'tag' => 'DỰ PHÒNG',
                'description' => 'Mô hình 1.5 Flash tiêu chuẩn tương thích với mọi loại API key.'
            ]
        ];

        Response::success([
            'keys' => $keys,
            'active_model' => $settings['gemini_model'] ?? 'gemini-3.8-flash',
            'active_key_index' => (int)($settings['gemini_active_key_index'] ?? 0),
            'system_prompt' => $settings['gemini_system_prompt'] ?? self::getDefaultSystemPrompt($this->getLiveStats($db)),
            'default_system_prompt' => self::getDefaultSystemPrompt($this->getLiveStats($db)),
            'available_models' => $availableModels,
            'rotation_strategy' => 'Tự động luân chuyển tuần tự (Failover & Round-Robin) khi đạt hạn ngạch (Quota 429) hoặc gặp lỗi'
        ]);
    }

    /**
     * Save Chatbot settings (Admin only)
     * POST /api/chatbot/settings
     */
    public function saveSettings(Request $request): void {
        if (!AuthMiddleware::requireAdmin()) {
            return;
        }

        $db = Database::getConnection();
        $user = AuthMiddleware::$currentUser;
        $body = $request->getBody();

        $keysInput = $body['keys'] ?? null;
        $modelInput = trim($body['active_model'] ?? 'gemini-3.8-flash');
        $systemPromptInput = trim($body['system_prompt'] ?? '');
        $activeKeyIndexInput = max(0, min(9, (int)($body['active_key_index'] ?? 0)));

        $cleanKeys = [];
        if (is_array($keysInput)) {
            for ($i = 0; $i < 10; $i++) {
                $item = $keysInput[$i] ?? [];
                $rawKey = trim(is_array($item) ? ($item['key'] ?? '') : (string)$item);
                $note = is_array($item) ? trim($item['note'] ?? ("Key #" . ($i + 1))) : ("Key #" . ($i + 1));
                $calls = is_array($item) ? (int)($item['calls'] ?? 0) : 0;
                $errors = is_array($item) ? (int)($item['errors'] ?? 0) : 0;
                $lastUsed = is_array($item) ? ($item['last_used'] ?? null) : null;
                $status = empty($rawKey) ? 'empty' : (is_array($item) && !empty($item['status']) ? $item['status'] : 'ready');

                $cleanKeys[] = [
                    'id' => $i + 1,
                    'key' => $rawKey,
                    'status' => $status,
                    'note' => $note,
                    'calls' => $calls,
                    'errors' => $errors,
                    'last_used' => $lastUsed,
                ];
            }
        } else {
            $cleanKeys = $this->initDefaultKeysList();
        }

        $stmt = $db->prepare("
            INSERT INTO school_settings (setting_key, setting_value, updated_at) 
            VALUES (?, ?, NOW()) 
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()
        ");

        $stmt->execute(['gemini_api_keys', json_encode($cleanKeys, JSON_UNESCAPED_UNICODE)]);
        $stmt->execute(['gemini_model', $modelInput]);
        $stmt->execute(['gemini_active_key_index', (string)$activeKeyIndexInput]);
        $stmt->execute(['gemini_system_prompt', $systemPromptInput]);

        // Audit log
        $db->prepare("INSERT INTO audit_logs (user_id, action, entity_type, details) VALUES (?, 'UPDATE_CHATBOT_CONFIG', 'gemini_chatbot', ?)")
            ->execute([$user['id'] ?? 1, "Cập nhật cấu hình Gemini Chatbot (Model: $modelInput, Lưu danh sách 10 Key luân chuyển)"]);

        Response::success(null, 'Đã lưu cấu hình AI Gemini Chatbot thành công');
    }

    /**
     * Test single Gemini API Key
     * POST /api/chatbot/test-key
     */
    public function testKey(Request $request): void {
        if (!AuthMiddleware::requireAdmin()) {
            return;
        }

        $body = $request->getBody();
        $key = trim($body['key'] ?? '');
        $model = trim($body['model'] ?? 'gemini-3.8-flash');

        if (empty($key)) {
            Response::error('Vui lòng nhập API Key cần kiểm tra', 400);
            return;
        }

        $startTime = microtime(true);
        $modelsToTry = [$model, 'gemini-2.0-flash', 'gemini-1.5-flash'];
        $lastResult = null;
        $workedModel = null;

        foreach ($modelsToTry as $m) {
            $result = $this->callGeminiApi(
                $key,
                $m,
                "Bạn là trợ lý kiểm tra kết nối API. Hãy trả lời đúng 1 từ: OK",
                [['role' => 'user', 'parts' => [['text' => 'Ping']]]]
            );
            $lastResult = $result;
            if ($result['success']) {
                $workedModel = $m;
                break;
            }
        }

        $latency = round((microtime(true) - $startTime) * 1000);

        if ($workedModel !== null) {
            Response::success([
                'valid' => true,
                'message' => 'API Key hợp lệ và hoạt động tốt!',
                'model_used' => $workedModel,
                'latency_ms' => $latency
            ], 'Kiểm tra API Key thành công');
        } else {
            Response::error('API Key không hợp lệ hoặc đã hết hạn ngạch: ' . ($lastResult['error'] ?? 'Lỗi không xác định'), 400, [
                'valid' => false,
                'error' => $lastResult['error'] ?? 'Lỗi kết nối'
            ]);
        }
    }

    /**
     * Intelligent local fallback knowledge engine when Gemini keys are empty or rate-limited
     */
    private function generateSmartLocalReply(string $msg, array $stats): string {
        $m = mb_strtolower($msg, 'UTF-8');

        if ($this->isOutOfScopeQuery($msg)) {
            return self::OUT_OF_SCOPE_MESSAGE;
        }

        if (str_contains($m, 'phòng') || str_contains($m, 'ktx') || str_contains($m, 'ký túc xá') || str_contains($m, 'bao nhiêu phòng') || str_contains($m, 'sơ đồ')) {
            return "🏨 **THÔNG TIN KÝ TÚC XÁ THPT CHUYÊN HÙNG VƯƠNG:**\n\n" .
                "- **Quy mô:** Gồm **120 phòng ở** phân bổ từ Tầng 2 đến Tầng 6 với sức chứa tiêu chuẩn 6-8 học sinh/phòng.\n" .
                "- **Sơ đồ phân chia khu vực:**\n" .
                "  + **Tầng 1:** Sảnh tiếp đón, phòng Trực ban Quản sinh, phòng Sinh hoạt chung & Thiết bị PCCC.\n" .
                "  + **Tầng 2 & Tầng 3 (Phòng 201 - 324):** Khu KTX dành cho **Nam sinh**.\n" .
                "  + **Tầng 4 (Phòng 401 - 424):** Khu liên tầng Nam & Nữ (có vách ngăn và lối đi riêng biệt).\n" .
                "  + **Tầng 5 & Tầng 6 (Phòng 501 - 624):** Khu KTX dành cho **Nữ sinh**.\n" .
                "- **Phân loại hiện tại:** Có **" . ($stats['total_boarding'] ?? 702) . " học sinh Nội trú** đang lưu trú và **" . ($stats['total_day'] ?? 1181) . " học sinh Ngoại trú/Bán trú**.\n" .
                "- **Trách nhiệm phòng:** Mỗi phòng có một **Trưởng phòng** chịu trách nhiệm điểm danh nội bộ lúc 22:00 và vệ sinh nội vụ.";
        }

        if (str_contains($m, 'vi phạm') || str_contains($m, 'kpi') || str_contains($m, 'kỷ luật') || str_contains($m, 'lỗi') || str_contains($m, 'điểm')) {
            return "⚖️ **QUY ĐỊNH 10 LỖI VI PHẠM KPI NỀN NẾP (L01 -> L10):**\n\n" .
                "Học sinh bắt đầu mỗi học kỳ với **100 điểm KPI chuẩn**. Các lỗi vi phạm sẽ bị trừ điểm theo thang chuẩn hóa:\n\n" .
                "1. **L01 (-10đ):** Muộn giờ hoặc vắng mặt không phép tại buổi điểm danh 06h00 / 22h00.\n" .
                "2. **L02 (-5đ):** Phòng ở bừa bộn, không gấp chăn màn nội vụ, chưa dọn rác.\n" .
                "3. **L03 (-10đ):** Gây ồn ào, làm mất trật tự sau giờ giới nghiêm 22:30.\n" .
                "4. **L04 (-15đ):** Sử dụng thiết bị điện công suất lớn trái phép (ấm siêu tốc, bếp điện).\n" .
                "5. **L05 (-20đ):** Đưa người ngoài hoặc bạn khác giới vào phòng ở KTX.\n" .
                "6. **L06 (-30đ):** Trèo tường, trốn ra ngoài KTX ban đêm sau 22h00.\n" .
                "7. **L07 (-40đ):** Hút thuốc lá, thuốc lá điện tử, tàng trữ rượu bia, cờ bạc.\n" .
                "8. **L08 (-50đ):** Gây gổ, đánh nhau, đe dọa, xúc phạm danh dự người khác.\n" .
                "9. **L09 (-20đ):** Làm hư hỏng tài sản công, phá hoại thiết bị KTX/PCCC.\n" .
                "10. **L10 (-25đ):** Gian lận điểm danh, điểm danh hộ, khai báo sai sự thật.\n\n" .
                "📌 *Xếp loại rèn luyện:* Xuất sắc (≥95đ), Tốt (85-94đ), Khá (70-84đ), Trung bình (50-69đ), Yếu (<50đ).";
        }

        if (str_contains($m, 'chế độ') || str_contains($m, 'giờ') || str_contains($m, 'thời gian') || str_contains($m, 'sinh hoạt') || str_contains($m, 'lịch')) {
            return "⏰ **KHUNG GIỜ 11 CHẾ ĐỘ SINH HOẠT HÀNG NGÀY TẠI KTX:**\n\n" .
                "• **05:30:** Báo thức buổi sáng toàn KTX.\n" .
                "• **05:45 - 06:15:** Thể dục sáng & Vệ sinh nội vụ phòng ở.\n" .
                "• **06:00:** Điểm danh buổi sáng.\n" .
                "• **06:15 - 06:45:** Ăn sáng tại nhà ăn trường.\n" .
                "• **07:00 - 11:30:** Học chính khóa ca sáng trên lớp.\n" .
                "• **11:45 - 13:30:** Ăn trưa và ngủ trưa tại KTX.\n" .
                "• **14:00 - 17:00:** Học ca chiều / bồi dưỡng HSG / tự học.\n" .
                "• **17:00 - 18:30:** Thể thao, rèn luyện thể lực, tắm giặt.\n" .
                "• **18:30 - 19:30:** Ăn tối tại nhà ăn.\n" .
                "• **19:30 - 21:30:** Tự học tối tại phòng KTX (nghiêm túc).\n" .
                "• **22:00:** Điểm danh tối toàn bộ 120 phòng KTX.\n" .
                "• **22:15:** Báo cáo Zalo tổng hợp gửi BGH.\n" .
                "• **22:30:** Tắt đèn đi ngủ, bảo vệ khóa cửa KTX.";
        }

        if (str_contains($m, 'đơn') || str_contains($m, 'phép') || str_contains($m, 'nghỉ') || str_contains($m, 'vắng') || str_contains($m, 'về quê')) {
            return "📝 **HƯỚNG DẪN LÀM ĐƠN XIN PHÉP VẮNG MẶT KTX:**\n\n" .
                "1. **Tạo đơn trực tuyến:** Vào mục **\"Đơn xin phép KTX\"** trên thanh điều hướng, nhấn nút **\"Tạo đơn mới\"**.\n" .
                "2. **Điền thông tin:** Chọn học sinh, lý do (về quê, ốm đau, thi HSG...), thời gian bắt đầu vắng và dự kiến trở lại KTX.\n" .
                "3. **Phê duyệt:** Giáo viên chủ nhiệm (GVCN) hoặc Quản sinh KTX sẽ kiểm tra và bấm **\"Phê duyệt\"**.\n" .
                "4. **Check-in khi về KTX:** Khi học sinh trở lại trường, Trưởng phòng hoặc Quản sinh bấm **\"Xác nhận Check-in\"** để đóng đơn.\n" .
                "⚠️ *Cảnh báo:* Nếu quá giờ hẹn trở lại mà chưa thực hiện Check-in, hệ thống sẽ tự động gắn nhãn đỏ **\"CẢNH BÁO QUÁ HẠN\"** và thông báo đến Ban Quản lý!";
        }

        if (str_contains($m, 'điểm danh') || str_contains($m, 'zalo') || str_contains($m, 'báo cáo')) {
            return "📋 **QUY TRÌNH ĐIỂM DANH KTX & XUẤT BÁO CÁO ZALO 22:15:**\n\n" .
                "- **Thời điểm thực hiện:** Đúng **22:00 hàng đêm**, Trưởng phòng và Quản sinh tiến hành điểm danh tại từng phòng.\n" .
                "- **Thao tác nhanh:** Bấm **\"Có mặt tất cả\"** đối với các phòng đủ quân số, hoặc tích chọn trạng thái từng em (Có mặt, Nghỉ có phép, Vắng không phép).\n" .
                "- **Trung tâm giám sát thời gian thực:** Tab \"Trung tâm Giám sát Realtime\" hiển thị ngay danh sách phòng chưa báo cáo, danh sách học sinh vắng kèm số điện thoại phụ huynh.\n" .
                "- **Xuất báo cáo Zalo:** Đúng **22:15**, hệ thống chuẩn bị sẵn mẫu tin nhắn Zalo chuẩn thể thức theo từng tầng hoặc toàn trường để Quản sinh sao chép và gửi vào nhóm BGH & Đoàn trường.";
        }

        if (str_contains($m, 'in') || str_contains($m, 'a4') || str_contains($m, 'nghị định 30') || str_contains($m, 'văn bản')) {
            return "🖨️ **TÍNH NĂNG XUẤT VĂN BẢN MẪU IN A4 (NGHỊ ĐỊNH 30/2020/NĐ-CP):**\n\n" .
                "Hệ thống cung cấp module **\"Mẫu In A4 Chuẩn NĐ 30/2020\"** với đầy đủ các thành phần thể thức văn bản hành chính Việt Nam:\n\n" .
                "• Quốc hiệu và Tiêu ngữ chuẩn kiểu chữ, cỡ chữ.\n" .
                "• Tên cơ quan chủ quản (Sở GD&ĐT Phú Thọ) và Tên cơ quan ban hành (THPT Chuyên Hùng Vương).\n" .
                "• Số/Ký hiệu văn bản, Địa danh và Thời gian ban hành.\n" .
                "• Các mẫu in: Báo cáo tổng kết KTX, Phiếu rèn luyện KPI cá nhân học sinh, Sổ theo dõi nền nếp 54 lớp chuyên.\n" .
                "• Hỗ trợ xem trước và in ấn trực tiếp hoặc xuất file PDF một chạm.";
        }

        return "Chào bạn! Tôi là **Trợ lý AI Hùng Vương** - Cố vấn thông minh Hệ thống Quản lý Ký túc xá & KPI Nền nếp Trường THPT Chuyên Hùng Vương.\n\n" .
            "Hiện tại hệ thống đang quản lý:\n" .
            "- **" . ($stats['total_students'] ?? 1883) . " học sinh** thuộc **54 lớp chuyên** (" . ($stats['total_boarding'] ?? 702) . " nội trú KTX, " . ($stats['total_day'] ?? 1181) . " ngoại trú).\n" .
            "- **120 phòng KTX** trải rộng trên 6 tầng.\n" .
            "- Điểm danh trực tiếp ca 06:00 và 22:00, xuất báo cáo Zalo 22:15.\n\n" .
            "Bạn có thể hỏi tôi về:\n" .
            "1. Sơ đồ 120 phòng và phân loại nội trú/ngoại trú KTX.\n" .
            "2. Thang 10 lỗi vi phạm kỷ luật L01 -> L10 và hệ thống tính điểm KPI.\n" .
            "3. Lịch trình 11 chế độ sinh hoạt trong ngày.\n" .
            "4. Quy trình làm đơn xin phép vắng mặt và cảnh báo quá hạn.\n" .
            "5. Cách xuất báo cáo Zalo và mẫu in A4 theo Nghị định 30/2020.\n\n" .
            "Bạn cần tìm hiểu hoặc hỗ trợ nội dung nào?";
    }
}
