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

    public const OUT_OF_SCOPE_MESSAGE = 'Xin lỗi bạn, câu hỏi này không nằm trong phạm vi hỗ trợ của Trợ lý AI Hệ thống đánh giá KPI nền nếp học sinh trường THPT chuyên Hùng Vương Phú Thọ. Tôi chỉ hỗ trợ tra cứu các thông tin liên quan đến quản lý trường học, ký túc xá, điểm danh, học sinh, 11 chế độ sinh hoạt và KPI rèn luyện nề nếp của nhà trường.';

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
Bạn là "Trợ lý AI Hùng Vương" - Cố vấn thông minh và hỗ trợ viên chính thức của {$schoolName} ({$schoolProvince}) trên Hệ thống đánh giá KPI nền nếp học sinh trường THPT chuyên Hùng Vương Phú Thọ (EduKPI).

QUY TẮC BẮT BUỘC VỀ PHẠM VI HỖ TRỢ (SCOPE BOUNDARY - NGUYÊN TẮC BẤT DI BẤT DỊCH):
1. Bạn là Trợ lý AI chuyên biệt CHO VÀ CHỈ CHO Hệ thống đánh giá KPI nền nếp học sinh trường THPT chuyên Hùng Vương Phú Thọ.
2. PHẠM VI HỖ TRỢ DUY NHẤT:
   - Toàn bộ thông tin, dữ liệu, tính năng, quy định trên website này (học sinh, lớp học, phòng KTX, quân số nội trú/ngoại trú, 11 chế độ sinh hoạt, 10 lỗi vi phạm L01-L10, điểm danh 22h, đơn xin nghỉ phép KTX, mẫu văn bản A4 NĐ 30/2020, tài khoản & phân quyền, hướng dẫn sử dụng trang web).
   - Thông tin về Trường THPT Chuyên Hùng Vương (Phú Thọ), Ban Giám hiệu (Hiệu trưởng: Thầy Đào Mạnh Thắng), Quản sinh, Đoàn trường, GVCN.
3. NẾU NGƯỜI DÙNG HỎI VỀ NHỮNG THỨ BÊN NGOÀI WEB (BẤT KỲ VẤN ĐỀ GÌ KHÔNG THUỘC PHẠM VI TRÊN):
   - Bạn BẮT BUỘC PHẢI TỪ CHỐI LỊCH SỰ và trả lời ĐÚNG NGUYÊN VĂN:
     "Xin lỗi bạn, câu hỏi này không nằm trong phạm vi hỗ trợ của Trợ lý AI Hệ thống đánh giá KPI nền nếp học sinh trường THPT chuyên Hùng Vương Phú Thọ. Tôi chỉ hỗ trợ tra cứu các thông tin liên quan đến quản lý trường học, ký túc xá, điểm danh, học sinh, 11 chế độ sinh hoạt và KPI rèn luyện nề nếp của nhà trường."
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

    // Helper to query classes matching query text (e.g. "lớp Toán", "khối 10", "11 Tin", etc.)
    private function queryClassesFromDb(PDO $db, string $msg): array {
        $m = mb_strtolower($msg, 'UTF-8');
        
        $subjects = [
            'toán' => '%toán%',
            'toan' => '%toán%',
            'tin' => '%tin%',
            'lý' => '%lý%',
            'ly' => '%lý%',
            'vật lý' => '%lý%',
            'hóa' => '%hóa%',
            'hoa' => '%hóa%',
            'hóa học' => '%hóa%',
            'sinh' => '%sinh%',
            'sinh học' => '%sinh%',
            'văn' => '%văn%',
            'van' => '%văn%',
            'ngữ văn' => '%văn%',
            'sử' => '%sử%',
            'su' => '%sử%',
            'lịch sử' => '%sử%',
            'địa' => '%địa%',
            'dia' => '%địa%',
            'địa lý' => '%địa%',
            'anh' => '%anh%',
            'tiếng anh' => '%anh%',
            'pháp' => '%pháp%',
            'phap' => '%pháp%',
            'nga' => '%nga%',
            'trung' => '%trung%'
        ];

        $matchedSubject = null;
        foreach ($subjects as $k => $pattern) {
            if (str_contains($m, $k)) {
                $matchedSubject = $pattern;
                break;
            }
        }

        $matchedGrade = null;
        if (preg_match('/khối\s*(10|11|12)/ui', $m, $gMatches)) {
            $matchedGrade = (int)$gMatches[1];
        } elseif (preg_match('/\b(10|11|12)\b/u', $m, $gMatches) && (str_contains($m, 'lớp') || str_contains($m, 'khối'))) {
            $matchedGrade = (int)$gMatches[1];
        }

        $where = ['1=1'];
        $params = [];

        if ($matchedSubject !== null) {
            $where[] = "(c.name LIKE ? OR c.code LIKE ?)";
            $params[] = $matchedSubject;
            $params[] = $matchedSubject;
        }

        if ($matchedGrade !== null) {
            $where[] = "c.grade_level = ?";
            $params[] = $matchedGrade;
        }

        $sql = "
            SELECT c.id, c.code, c.name, c.grade_level, c.total_students, c.boarding_students, c.room_location,
                   t.full_name AS teacher_name, t.phone AS teacher_phone
            FROM classes c
            LEFT JOIN teachers t ON c.homeroom_teacher_id = t.id
            WHERE " . implode(' AND ', $where) . "
            ORDER BY c.grade_level ASC, c.name ASC
            LIMIT 30
        ";

        try {
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\Throwable $e) {
            return [];
        }
    }

    // Live Dynamic Database Context Retrieval
    private function retrieveRelevantContext(PDO $db, string $userMessage): string {
        $msg = mb_strtolower($userMessage, 'UTF-8');
        $context = [];

        try {
            // 1. Detect Room inquiries
            if (preg_match('/(?:phòng|p\.?)\s*([0-9]{3})/ui', $msg, $matches) || preg_match('/\b([2-6][0-2][0-9])\b/u', $msg, $matches)) {
                $roomNum = $matches[1];
                $stmt = $db->prepare("
                    SELECT dr.code as room_number, dr.floor_number as floor, dr.capacity, dr.current_occupancy, dr.gender, dr.status,
                           GROUP_CONCAT(CONCAT(s.full_name, ' (', COALESCE(c.name, 'Chưa rõ lớp'), ')') ORDER BY s.full_name SEPARATOR ', ') as students
                    FROM dormitory_rooms dr
                    LEFT JOIN students s ON s.dorm_room_id = dr.id
                    LEFT JOIN classes c ON s.class_id = c.id
                    WHERE dr.code LIKE ?
                    GROUP BY dr.id
                    LIMIT 3
                ");
                $stmt->execute(["%$roomNum%"]);
                $rooms = $stmt->fetchAll(PDO::FETCH_ASSOC);
                if (!empty($rooms)) {
                    $context[] = "[TRA CỨU TRỰC TIẾP DỮ LIỆU THỜI GIAN THỰC - PHÒNG KTX]:";
                    foreach ($rooms as $r) {
                        $gender = $r['gender'] === 'female' ? 'Nữ sinh' : 'Nam sinh';
                        $studList = !empty($r['students']) ? $r['students'] : 'Chưa có học sinh ở';
                        $context[] = "- Phòng {$r['room_number']} (Tầng {$r['floor']}, Khu {$gender}): Sức chứa {$r['capacity']} em, hiện có {$r['current_occupancy']} em. Danh sách học sinh: {$studList}.";
                    }
                }
            }

            // 2. Detect Student inquiries
            if (str_contains($msg, 'học sinh') || str_contains($msg, 'em') || str_contains($msg, 'bạn') || str_contains($msg, 'tìm')) {
                $cleaned = trim(preg_replace('/(tìm|học sinh|em|bạn|thông tin|hồ sơ|điểm kpi của|lớp|cho tôi biết về|ai là)/ui', '', $msg));
                if (mb_strlen($cleaned, 'UTF-8') >= 2) {
                    $stmt = $db->prepare("
                        SELECT s.full_name, s.code, s.gender, s.is_boarding,
                               c.name as class_name, dr.code as room_number,
                               ROUND(COALESCE(sks.final_score, 100.0), 1) as kpi_points
                        FROM students s
                        LEFT JOIN classes c ON s.class_id = c.id
                        LEFT JOIN dormitory_rooms dr ON s.dorm_room_id = dr.id
                        LEFT JOIN student_kpi_summaries sks ON s.id = sks.student_id
                        WHERE s.full_name LIKE ? OR s.code LIKE ?
                        LIMIT 5
                    ");
                    $stmt->execute(["%$cleaned%", "%$cleaned%"]);
                    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    if (!empty($students)) {
                        $context[] = "[TRA CỨU TRỰC TIẾP DỮ LIỆU THỜI GIAN THỰC - HỒ SƠ HỌC SINH]:";
                        foreach ($students as $s) {
                            $type = $s['is_boarding'] ? 'Nội trú KTX' : 'Ngoại trú';
                            $room = !empty($s['room_number']) ? "Phòng {$s['room_number']}" : 'Chưa xếp phòng';
                            $context[] = "- Học sinh: {$s['full_name']} (Mã HS: {$s['code']}), Lớp: {$s['class_name']}, Diện: {$type} ({$room}), Điểm KPI rèn luyện: {$s['kpi_points']} điểm.";
                        }
                    }
                }
            }

            // 3. Detect Class inquiries (e.g. "có những lớp Toán nào", "lớp 10 Toán 1", "khối 11")
            if (str_contains($msg, 'lớp') || str_contains($msg, 'toán') || str_contains($msg, 'tin') || str_contains($msg, 'lý') || str_contains($msg, 'hóa') || str_contains($msg, 'văn') || str_contains($msg, 'anh') || str_contains($msg, 'gvcn') || str_contains($msg, 'chủ nhiệm')) {
                $classes = $this->queryClassesFromDb($db, $msg);
                if (!empty($classes)) {
                    $context[] = "[TRA CỨU TRỰC TIẾP DỮ LIỆU THỜI GIAN THỰC - THÔNG TIN LỚP HỌC]:";
                    foreach ($classes as $c) {
                        $gvcn = !empty($c['teacher_name']) ? "GVCN: {$c['teacher_name']}" . (!empty($c['teacher_phone']) ? " (SĐT: {$c['teacher_phone']})" : "") : "GVCN: Chưa cập nhật";
                        $context[] = "- Lớp {$c['name']} (Khối {$c['grade_level']}): {$gvcn}, Sĩ số: {$c['total_students']} học sinh ({$c['boarding_students']} học sinh nội trú KTX).";
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
            $localReply = $this->generateSmartLocalReply($userMessage, $liveStats, $db);
            Response::success([
                'reply' => $localReply . "\n\n> 💡 *Ghi chú: Quản trị viên chưa cấu hình API Key cho Google Gemini (vào mục Quản Trị > Cấu hình AI Gemini Chatbot để kích hoạt 10 key). Hiện tại câu trả lời đang được trích xuất trực tiếp từ Cơ sở dữ liệu nhà trường.*",
                'model_used' => 'Tra cứu CSDL nội bộ (Chưa kích hoạt Gemini API)',
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

        // Model fallback chain: user selected model, then Gemini 2.0 -> 2.5 -> 3.x Flash
        $cleanConfigured = ltrim(str_replace('models/', '', $configuredModel), '/');
        $modelsToTry = array_values(array_unique(array_filter([
            $cleanConfigured,
            'gemini-2.0-flash',
            'gemini-2.5-flash',
            'gemini-3.8-flash',
            'gemini-3.7-flash',
            'gemini-3.6-flash',
            'gemini-2.0-flash-lite',
            'gemini-1.5-flash-latest',
            'gemini-1.5-flash'
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
        $localReply = $this->generateSmartLocalReply($userMessage, $liveStats, $db);
        Response::success([
            'reply' => $localReply,
            'model_used' => $configuredModel . ' (Dự phòng cục bộ)',
            'key_index' => null,
            'total_keys_available' => $totalValid,
            'warning' => $lastError
        ]);
    }

    // Call Google Gemini REST API v1beta
    private function callGeminiApi(string $apiKey, string $model, string $systemPrompt, array $contents): array {
        $cleanModel = ltrim(str_replace('models/', '', $model), '/');
        $url = "https://generativelanguage.googleapis.com/v1beta/models/" . urlencode($cleanModel) . ":generateContent?key=" . urlencode($apiKey);

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
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'x-goog-api-key: ' . $apiKey
            ],
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

    // Query Google Gemini ListModels API to discover exact supported models for this API key
    private function fetchAvailableModels(string $apiKey): array {
        $url = "https://generativelanguage.googleapis.com/v1beta/models?key=" . urlencode($apiKey);
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 12,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'x-goog-api-key: ' . $apiKey
            ]
        ]);
        $rawResponse = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            return ['success' => false, 'error' => "Curl Error: $curlError", 'models' => []];
        }

        $resJson = json_decode($rawResponse, true);

        if ($httpCode !== 200) {
            $msg = $resJson['error']['message'] ?? "HTTP $httpCode Error";
            return ['success' => false, 'error' => "HTTP $httpCode: $msg", 'models' => []];
        }

        $available = [];
        if (!empty($resJson['models']) && is_array($resJson['models'])) {
            foreach ($resJson['models'] as $m) {
                $methods = $m['supportedGenerationMethods'] ?? [];
                if (in_array('generateContent', $methods, true)) {
                    $available[] = str_replace('models/', '', $m['name']);
                }
            }
        }

        return ['success' => true, 'models' => $available];
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
        $requestedModel = trim($body['model'] ?? 'gemini-2.0-flash');

        if (empty($key)) {
            Response::error('Vui lòng nhập API Key cần kiểm tra', 400);
            return;
        }

        $startTime = microtime(true);

        // 1. Kiểm tra API Key và truy vấn danh sách model thực tế được cấp phép
        $listResult = $this->fetchAvailableModels($key);
        if (!$listResult['success']) {
            $rawError = $listResult['error'];
            $userMsg = 'API Key không hợp lệ hoặc đã hết hạn ngạch';
            if (str_contains($rawError, '400') || str_contains(strtolower($rawError), 'api key not valid')) {
                $userMsg = 'API Key không hợp lệ (Mã key sai hoặc không tồn tại trên Google AI Studio)';
            } elseif (str_contains($rawError, '403')) {
                $userMsg = 'API Key bị từ chối truy cập (HTTP 403 Forbidden - Hãy kiểm tra quyền hạn tài khoản)';
            } elseif (str_contains($rawError, '429')) {
                $userMsg = 'API Key đã vượt quá hạn ngạch (HTTP 429 Quota Exceeded)';
            }
            Response::error("$userMsg: $rawError", 400, [
                'valid' => false,
                'error' => $rawError
            ]);
            return;
        }

        $availableModels = $listResult['models'];

        // 2. Lập danh sách các model khả dụng ưu tiên để gửi ping test
        $cleanReq = ltrim(str_replace('models/', '', $requestedModel), '/');
        $modelsToTry = [];
        if (in_array($cleanReq, $availableModels, true)) {
            $modelsToTry[] = $cleanReq;
        }

        $preferredOrder = [
            'gemini-2.0-flash',
            'gemini-2.5-flash',
            'gemini-3.8-flash',
            'gemini-3.7-flash',
            'gemini-3.6-flash',
            'gemini-2.0-flash-lite',
            'gemini-2.5-flash-lite',
            'gemini-1.5-flash-latest',
            'gemini-1.5-flash',
            'gemini-1.5-pro'
        ];

        foreach ($preferredOrder as $po) {
            if (in_array($po, $availableModels, true) && !in_array($po, $modelsToTry, true)) {
                $modelsToTry[] = $po;
            }
        }

        foreach ($availableModels as $am) {
            if (!in_array($am, $modelsToTry, true)) {
                $modelsToTry[] = $am;
            }
        }

        if (empty($modelsToTry)) {
            $modelsToTry = [$cleanReq, 'gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-flash-latest'];
        }

        $workedModel = null;
        $lastResult = null;

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
                'message' => "API Key hợp lệ! Hoạt động tốt với mô hình {$workedModel} ({$latency}ms).",
                'model_used' => $workedModel,
                'available_models' => $availableModels,
                'latency_ms' => $latency
            ], 'Kiểm tra API Key thành công');
        } else {
            $errDetail = $lastResult['error'] ?? 'Không nhận được phản hồi tạo nội dung từ Google';
            Response::error("Key hợp lệ nhưng không thể tạo phản hồi: $errDetail", 400, [
                'valid' => false,
                'error' => $errDetail,
                'available_models' => $availableModels
            ]);
        }
    }

    /**
     * Intelligent local fallback knowledge engine when Gemini keys are empty or rate-limited
     * Fully queries live MySQL database for classes, students, rooms, teachers, schedules, and KPI rules
     */
    private function generateSmartLocalReply(string $msg, array $stats, ?PDO $db = null): string {
        if ($db === null) {
            $db = Database::getConnection();
        }
        $m = mb_strtolower($msg, 'UTF-8');

        // Guardrail out-of-scope check
        if ($this->isOutOfScopeQuery($msg)) {
            return self::OUT_OF_SCOPE_MESSAGE;
        }

        // 1. DYNAMIC INQUIRY: Specific Class & Subject Search (e.g. "có những lớp Toán nào", "lớp 10 Tin", "danh sách lớp")
        $isClassQuery = str_contains($m, 'lớp') || str_contains($m, 'khối') || str_contains($m, 'chuyên') ||
                        str_contains($m, 'chủ nhiệm') || str_contains($m, 'gvcn') ||
                        preg_match('/\b(toán|tin|lý|hóa|sinh|văn|sử|địa|anh|pháp|nga|trung)\b/ui', $m);

        if ($isClassQuery) {
            $classes = $this->queryClassesFromDb($db, $msg);
            if (!empty($classes)) {
                $subjectLabel = "DANH SÁCH LỚP HỌC";
                if (str_contains($m, 'toán') || str_contains($m, 'toan')) $subjectLabel = "DANH SÁCH CÁC LỚP CHUYÊN TOÁN";
                elseif (str_contains($m, 'tin')) $subjectLabel = "DANH SÁCH CÁC LỚP CHUYÊN TIN";
                elseif (str_contains($m, 'lý') || str_contains($m, 'ly')) $subjectLabel = "DANH SÁCH CÁC LỚP CHUYÊN VẬT LÝ";
                elseif (str_contains($m, 'hóa') || str_contains($m, 'hoa')) $subjectLabel = "DANH SÁCH CÁC LỚP CHUYÊN HÓA HỌC";
                elseif (str_contains($m, 'sinh')) $subjectLabel = "DANH SÁCH CÁC LỚP CHUYÊN SINH HỌC";
                elseif (str_contains($m, 'văn') || str_contains($m, 'van')) $subjectLabel = "DANH SÁCH CÁC LỚP CHUYÊN NGỮ VĂN";
                elseif (str_contains($m, 'sử') || str_contains($m, 'su')) $subjectLabel = "DANH SÁCH CÁC LỚP CHUYÊN LỊCH SỬ";
                elseif (str_contains($m, 'địa') || str_contains($m, 'dia')) $subjectLabel = "DANH SÁCH CÁC LỚP CHUYÊN ĐỊA LÝ";
                elseif (str_contains($m, 'anh')) $subjectLabel = "DANH SÁCH CÁC LỚP CHUYÊN TIẾNG ANH";
                elseif (str_contains($m, 'pháp') || str_contains($m, 'phap')) $subjectLabel = "DANH SÁCH CÁC LỚP CHUYÊN TIẾNG PHÁP";

                $totalCls = count($classes);
                $sumStudents = array_sum(array_column($classes, 'total_students'));
                $sumBoarding = array_sum(array_column($classes, 'boarding_students'));

                $res = "📚 **{$subjectLabel} (TRƯỜNG THPT CHUYÊN HÙNG VƯƠNG):**\n\n";
                $res .= "Hệ thống ghi nhận **{$totalCls} lớp** với tổng cộng **{$sumStudents} học sinh** ({$sumBoarding} học sinh nội trú KTX):\n\n";

                foreach ($classes as $c) {
                    $teacherInfo = !empty($c['teacher_name']) ? "GVCN: **{$c['teacher_name']}**" . (!empty($c['teacher_phone']) ? " (SĐT: `{$c['teacher_phone']}`)" : "") : "GVCN: *Chưa cập nhật*";
                    $location = !empty($c['room_location']) ? " | Vị trí: {$c['room_location']}" : "";
                    $res .= "• **{$c['name']}** (Mã: `{$c['code']}` - Khối {$c['grade_level']}): Sĩ số **{$c['total_students']}** em ({$c['boarding_students']} KTX) | {$teacherInfo}{$location}\n";
                }
                return $res;
            } elseif (str_contains($m, 'bao nhiêu lớp') || str_contains($m, 'các khối') || str_contains($m, 'tất cả lớp')) {
                return "🏫 **CƠ CẤU 54 LỚP CHUYÊN TẠI THPT CHUYÊN HÙNG VƯƠNG:**\n\n" .
                    "Toàn trường có **54 lớp chuyên** trải đều qua 3 khối lớp với tổng số **" . ($stats['total_students'] ?? 1883) . " học sinh**:\n\n" .
                    "- **Khối 10 (18 lớp):** 10 Chuyên Toán 1-2, 10 Tin, 10 Lý 1-2, 10 Hóa 1-2, 10 Sinh, 10 Văn 1-2, 10 Sử, 10 Địa, 10 Anh 1-2, 10 Pháp, 10 Nga, 10 Trung.\n" .
                    "- **Khối 11 (17 lớp):** 11 Chuyên Toán 1-2, 11 Tin, 11 Lý 1-2, 11 Hóa 1-2, 11 Sinh, 11 Văn 1-2, 11 Sử, 11 Địa, 11 Anh 1-2, 11 Pháp, 11 Nga, 11 Trung.\n" .
                    "- **Khối 12 (19 lớp):** 12 Chuyên Toán 1-2, 12 Tin 1-2, 12 Lý 1-2, 12 Hóa 1-2, 12 Sinh 1-2, 12 Văn 1-2, 12 Sử, 12 Địa, 12 Anh 1-3, 12 Pháp, 12 Nga, 12 Trung.\n\n" .
                    "👉 *Bạn có thể tra cứu nhanh theo môn chuyên, ví dụ: \"có những lớp Toán nào\", \"thông tin lớp 11 Lý 1\", \"danh sách lớp Anh\"...*";
            }
        }

        // 2. DYNAMIC INQUIRY: Specific Dorm Room Search (e.g. "phòng 201", "P305", "402")
        if (preg_match('/(?:phòng|p\.?)\s*([0-9]{3})/ui', $m, $matches) || preg_match('/\b([2-6][0-2][0-9])\b/u', $m, $matches)) {
            $roomNum = $matches[1];
            try {
                $stmt = $db->prepare("
                    SELECT dr.code as room_number, dr.floor_number as floor, dr.capacity, dr.current_occupancy, dr.gender, dr.status,
                           GROUP_CONCAT(CONCAT(s.full_name, ' (', COALESCE(c.name, 'Chưa rõ lớp'), ')') ORDER BY s.full_name SEPARATOR ', ') as students
                    FROM dormitory_rooms dr
                    LEFT JOIN students s ON s.dorm_room_id = dr.id
                    LEFT JOIN classes c ON s.class_id = c.id
                    WHERE dr.code LIKE ?
                    GROUP BY dr.id
                    LIMIT 3
                ");
                $stmt->execute(["%$roomNum%"]);
                $rooms = $stmt->fetchAll(PDO::FETCH_ASSOC);
                if (!empty($rooms)) {
                    $res = "🏨 **THÔNG TIN TRA CỨU PHÒNG KÝ TÚC XÁ:**\n\n";
                    foreach ($rooms as $r) {
                        $gender = $r['gender'] === 'female' ? 'Nữ sinh' : 'Nam sinh';
                        $studList = !empty($r['students']) ? $r['students'] : 'Hiện chưa có học sinh ở phòng này.';
                        $res .= "• **Phòng {$r['room_number']}** (Tầng {$r['floor']}, Khu dành cho {$gender}):\n" .
                            "  - Trạng thái: " . ($r['status'] === 'active' ? 'Đang hoạt động' : $r['status']) . "\n" .
                            "  - Quân số hiện tại: **{$r['current_occupancy']}/{$r['capacity']} em**\n" .
                            "  - Danh sách học sinh: {$studList}\n\n";
                    }
                    return trim($res);
                }
            } catch (\Throwable $e) {}
        }

        // 3. DYNAMIC INQUIRY: Student Lookup (e.g. "học sinh Nguyễn Văn A", "HS1001", "tìm bạn...")
        if (str_contains($m, 'học sinh') || str_contains($m, 'em') || str_contains($m, 'bạn') || str_contains($m, 'tìm') || str_contains($m, 'tra cứu') || preg_match('/hs[0-9]+/ui', $m)) {
            $cleaned = trim(preg_replace('/(tìm|học sinh|em|bạn|thông tin|hồ sơ|điểm kpi của|lớp|cho tôi biết về|ai là|tra cứu|ở phòng nào)/ui', '', $m));
            if (mb_strlen($cleaned, 'UTF-8') >= 2) {
                try {
                    $stmt = $db->prepare("
                        SELECT s.full_name, s.code, s.gender, s.is_boarding, s.phone, s.parent_name, s.parent_phone,
                               c.name as class_name, dr.code as room_number,
                               ROUND(COALESCE(sks.final_score, 100.0), 1) as kpi_points
                        FROM students s
                        LEFT JOIN classes c ON s.class_id = c.id
                        LEFT JOIN dormitory_rooms dr ON s.dorm_room_id = dr.id
                        LEFT JOIN student_kpi_summaries sks ON s.id = sks.student_id
                        WHERE s.full_name LIKE ? OR s.code LIKE ?
                        LIMIT 5
                    ");
                    $stmt->execute(["%$cleaned%", "%$cleaned%"]);
                    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    if (!empty($students)) {
                        $res = "👤 **KẾT QUẢ TRA CỨU HỒ SƠ HỌC SINH:**\n\n";
                        foreach ($students as $s) {
                            $type = $s['is_boarding'] ? "Nội trú KTX (Phòng " . ($s['room_number'] ?: 'chưa xếp') . ")" : "Ngoại trú";
                            $res .= "• **{$s['full_name']}** (Mã: `{$s['code']}`):\n" .
                                "  - Lớp: **{$s['class_name']}**\n" .
                                "  - Diện lưu trú: {$type}\n" .
                                "  - Điểm rèn luyện KPI: **{$s['kpi_points']} điểm**\n";
                            if (!empty($s['phone'])) $res .= "  - SĐT học sinh: `{$s['phone']}`\n";
                            if (!empty($s['parent_name'])) $res .= "  - Phụ huynh: {$s['parent_name']}" . (!empty($s['parent_phone']) ? " (`{$s['parent_phone']}`)" : "") . "\n";
                            $res .= "\n";
                        }
                        return trim($res);
                    }
                } catch (\Throwable $e) {}
            }
        }

        // 4. DYNAMIC INQUIRY: Absences & Leaves (e.g. "ai vắng hôm nay", "đơn xin phép")
        if (str_contains($m, 'vắng') || str_contains($m, 'ai vắng') || str_contains($m, 'nghỉ') || str_contains($m, 'xin phép')) {
            try {
                $stmt = $db->query("
                    SELECT lr.student_name, lr.class_name, lr.room_code, lr.request_type, lr.reason, lr.start_time, lr.expected_end_time, lr.status
                    FROM leave_requests lr
                    WHERE lr.status IN ('pending', 'approved')
                    ORDER BY lr.id DESC
                    LIMIT 6
                ");
                $leaves = $stmt->fetchAll(PDO::FETCH_ASSOC);
                if (!empty($leaves)) {
                    $res = "📝 **DANH SÁCH ĐƠN XIN NGHỈ / VẮNG MẶT KTX GẦN ĐÂY:**\n\n";
                    foreach ($leaves as $l) {
                        $stt = $l['status'] === 'approved' ? '✅ Đã duyệt' : '⏳ Chờ duyệt';
                        $res .= "• **{$l['student_name']}** (Lớp {$l['class_name']}, P.{$l['room_code']}): Lý do *\"{$l['reason']}\"* [{$stt}] | Thời gian: {$l['start_time']} - {$l['expected_end_time']}\n";
                    }
                    $res .= "\n💡 *Để tạo đơn xin phép mới, học sinh/phụ huynh truy cập mục \"Đơn xin phép KTX\" trên thanh điều hướng.*";
                    return $res;
                }
            } catch (\Throwable $e) {}
        }

        // 5. General Dormitory Architecture & Floor Plan
        if (str_contains($m, 'phòng') || str_contains($m, 'ktx') || str_contains($m, 'ký túc xá') || str_contains($m, 'bao nhiêu phòng') || str_contains($m, 'sơ đồ')) {
            return "🏨 **THÔNG TIN KÝ TÚC XÁ THPT CHUYÊN HÙNG VƯƠNG:**\n\n" .
                "- **Quy mô:** Gồm **120 phòng ở** phân bổ từ Tầng 2 đến Tầng 6 với sức chứa tiêu chuẩn 6-8 học sinh/phòng.\n" .
                "- **Sơ đồ phân chia khu vực:**\n" .
                "  + **Tầng 1:** Sảnh tiếp đón, phòng Trực ban Quản sinh, phòng Sinh hoạt chung & Thiết bị PCCC.\n" .
                "  + **Tầng 2 & Tầng 3 (Phòng 201 - 324):** Khu KTX dành cho **Nam sinh**.\n" .
                "  + **Tầng 4 (Phòng 401 - 424):** Khu liên tầng Nam & Nữ (có vách ngăn và lối đi riêng biệt).\n" .
                "  + **Tầng 5 & Tầng 6 (Phòng 501 - 624):** Khu KTX dành cho **Nữ sinh**.\n" .
                "- **Phân loại hiện tại:** Có **" . ($stats['total_boarding'] ?? 702) . " học sinh Nội trú** đang lưu trú và **" . ($stats['total_day'] ?? 1181) . " học sinh Ngoại trú/Bán trú**.\n" .
                "- **Trách nhiệm phòng:** Mỗi phòng có một **Trưởng phòng** chịu trách nhiệm điểm danh nội bộ lúc 22:00 và vệ sinh nội vụ.\n\n" .
                "👉 *Bạn có thể tra cứu cụ thể số phòng bất kỳ (ví dụ: \"phòng 201\", \"phòng 405\").*";
        }

        // 6. Discipline & KPI Grading Rules (L01 -> L10)
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

        // 7. Daily 11 Regimes
        if (str_contains($m, 'chế độ') || str_contains($m, 'giờ') || str_contains($m, 'thời gian') || str_contains($m, 'sinh hoạt') || str_contains($m, 'lịch')) {
            return "⏰ **KHUNG GIỜ 11 CHẾ ĐỘ SINH HOẠT HÀNG NGÀY TẠI KTX:**\n\n" .
                "• **05:15 - 05:30:** Báo thức sáng toàn KTX.\n" .
                "• **05:30 - 06:00:** Thể dục sáng nâng cao thể lực.\n" .
                "• **06:00 - 06:30:** Gấp chăn màn, chỉnh trang nội vụ phòng ở.\n" .
                "• **06:30 - 07:15:** Ăn sáng tại nhà ăn trường THPT Chuyên Hùng Vương.\n" .
                "• **07:15 - 07:30:** Niêm phong KTX, bảo vệ khóa cửa tầng.\n" .
                "• **07:30 - 11:30:** Học chính khóa ca sáng tại Tòa nhà A.\n" .
                "• **11:45 - 13:30:** Ăn trưa và nghỉ trưa tại phòng KTX.\n" .
                "• **16:30 - 17:45:** Thể thao chiều (bóng rổ, cầu lông, bóng bàn).\n" .
                "• **18:00 - 18:15:** Chốt cổng trường KTX, kiểm soát học sinh nội trú trở về.\n" .
                "• **19:30 - 21:45:** Tự học tối nghiêm túc tại phòng KTX.\n" .
                "• **22:00 - 22:30:** Điểm danh tối 120 phòng & Tắt đèn đi ngủ lúc 22:30.";
        }

        // 8. Attendance & Zalo procedures
        if (str_contains($m, 'điểm danh') || str_contains($m, 'zalo') || str_contains($m, 'báo cáo')) {
            return "📋 **QUY TRÌNH ĐIỂM DANH KTX & XUẤT BÁO CÁO ZALO 22:15:**\n\n" .
                "- **Thời điểm thực hiện:** Đúng **22:00 hàng đêm**, Trưởng phòng và Quản sinh tiến hành điểm danh tại từng phòng.\n" .
                "- **Thao tác nhanh:** Bấm **\"Có mặt tất cả\"** đối với các phòng đủ quân số, hoặc tích chọn trạng thái từng em (Có mặt, Nghỉ có phép, Vắng không phép).\n" .
                "- **Trung tâm giám sát thời gian thực:** Tab \"Trung tâm Giám sát Realtime\" hiển thị ngay danh sách phòng chưa báo cáo, danh sách học sinh vắng kèm số điện thoại phụ huynh.\n" .
                "- **Xuất báo cáo Zalo:** Đúng **22:15**, hệ thống chuẩn bị sẵn mẫu tin nhắn Zalo chuẩn thể thức theo từng tầng hoặc toàn trường để Quản sinh sao chép và gửi vào nhóm BGH & Đoàn trường.";
        }

        // 9. Decree 30 A4 Print
        if (str_contains($m, 'in') || str_contains($m, 'a4') || str_contains($m, 'nghị định 30') || str_contains($m, 'văn bản')) {
            return "🖨️ **TÍNH NĂNG XUẤT VĂN BẢN MẪU IN A4 (NGHỊ ĐỊNH 30/2020/NĐ-CP):**\n\n" .
                "Hệ thống cung cấp module **\"Mẫu In A4 Chuẩn NĐ 30/2020\"** với đầy đủ các thành phần thể thức văn bản hành chính Việt Nam:\n\n" .
                "• Quốc hiệu và Tiêu ngữ chuẩn kiểu chữ, cỡ chữ.\n" .
                "• Tên cơ quan chủ quản (Sở GD&ĐT Phú Thọ) và Tên cơ quan ban hành (THPT Chuyên Hùng Vương).\n" .
                "• Số/Ký hiệu văn bản, Địa danh và Thời gian ban hành.\n" .
                "• Các mẫu in: Báo cáo tổng kết KTX, Phiếu rèn luyện KPI cá nhân học sinh, Sổ theo dõi nền nếp 54 lớp chuyên.\n" .
                "• Hỗ trợ xem trước và in ấn trực tiếp hoặc xuất file PDF một chạm.";
        }

        // 10. Default General Welcome (when user says hello or general inquiries)
        return "Chào bạn! Tôi là **Trợ lý AI Hùng Vương** - Cố vấn thông minh **Hệ thống đánh giá KPI nền nếp học sinh trường THPT chuyên Hùng Vương Phú Thọ**.\n\n" .
            "Hiện tại hệ thống đang quản lý:\n" .
            "- **" . ($stats['total_students'] ?? 1883) . " học sinh** thuộc **54 lớp chuyên** (" . ($stats['total_boarding'] ?? 702) . " nội trú KTX, " . ($stats['total_day'] ?? 1181) . " ngoại trú).\n" .
            "- **120 phòng KTX** trải rộng trên 6 tầng.\n" .
            "- Điểm danh trực tiếp ca 06:00 và 22:00, xuất báo cáo Zalo 22:15.\n\n" .
            "Bạn có thể hỏi tôi trực tiếp về:\n" .
            "1. **Danh sách lớp học:** *\"Có những lớp Toán nào?\"*, *\"Danh sách lớp Tin\"*, *\"Lớp 11 Lý 1\"*...\n" .
            "2. **Tra cứu học sinh / phòng ở:** *\"Tìm bạn Nguyễn Văn A\"*, *\"Phòng 201 có những ai?\"*...\n" .
            "3. **Tình hình vắng mặt:** *\"Hôm nay ai có đơn xin nghỉ?\"*, *\"Quy trình làm đơn vắng mặt\"*...\n" .
            "4. **Kỷ luật & KPI:** *\"Thang 10 lỗi vi phạm kỷ luật L01 -> L10\"*, *\"Cách tính điểm KPI\"*...\n" .
            "5. **Thời gian biểu:** *\"11 chế độ sinh hoạt trong ngày của KTX\"*...\n\n" .
            "Bạn muốn tôi tra cứu thông tin gì?";
    }
}
