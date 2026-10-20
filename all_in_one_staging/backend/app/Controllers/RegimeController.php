<?php
// backend/app/Controllers/RegimeController.php

namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Middleware\AuthMiddleware;
use DateTime;
use DateTimeZone;
use PDO;

class RegimeController {
    public function index(Request $request): void {
        $db = Database::getConnection();
        $today = date('Y-m-d');

        $regimes = $db->query("
            SELECT r.*, 
                   COALESCE(e.status, 'pending') AS execution_status,
                   e.completed_at, u.full_name AS completed_by_name
            FROM daily_regimes r
            LEFT JOIN regime_execution_records e ON r.id = e.regime_id AND e.execution_date = '$today'
            LEFT JOIN users u ON e.completed_by_user_id = u.id
            ORDER BY r.order_num ASC
        ")->fetchAll();

        foreach ($regimes as &$reg) {
            $itemsStmt = $db->prepare("SELECT * FROM regime_checklist_items WHERE regime_id = ? ORDER BY order_num ASC");
            $itemsStmt->execute([$reg['id']]);
            $reg['checklist'] = $itemsStmt->fetchAll();
        }

        Response::success($regimes);
    }

    public function current(Request $request): void {
        $db = Database::getConnection();
        $tz = new DateTimeZone('Asia/Ho_Chi_Minh');
        $now = new DateTime('now', $tz);
        $currentTimeStr = $now->format('H:i');
        $currentMinutes = (int)$now->format('H') * 60 + (int)$now->format('i');

        $regimes = $db->query("SELECT * FROM daily_regimes ORDER BY order_num ASC")->fetchAll();

        $activeRegime = null;
        $nextRegime = null;
        $remainingMinutes = 0;

        foreach ($regimes as $idx => $r) {
            [$sH, $sM] = explode(':', $r['time_start']);
            [$eH, $eM] = explode(':', $r['time_end']);
            $startMin = (int)$sH * 60 + (int)$sM;
            $endMin = (int)$eH * 60 + (int)$eM;

            if ($currentMinutes >= $startMin && $currentMinutes <= $endMin) {
                $activeRegime = $r;
                $remainingMinutes = $endMin - $currentMinutes;
                $nextRegime = $regimes[($idx + 1) % count($regimes)];
                break;
            } elseif ($currentMinutes < $startMin && !$nextRegime) {
                $nextRegime = $r;
                $remainingMinutes = $startMin - $currentMinutes;
            }
        }

        if (!$activeRegime && !empty($regimes)) {
            $activeRegime = [
                'id' => 0,
                'order_num' => 0,
                'name' => 'Thời gian tự do / Nghỉ ngơi',
                'description' => 'Học sinh tuân thủ nội quy chung của ký túc xá',
                'time_start' => '--:--',
                'time_end' => '--:--',
                'responsible_role' => 'Ban Tự quản'
            ];
            if (!$nextRegime) {
                $nextRegime = $regimes[0];
            }
        }

        // Critical alerts checks
        $criticalAlert = null;
        if ($currentTimeStr >= '07:10' && $currentTimeStr <= '07:20') {
            $criticalAlert = 'CẢNH BÁO MỐC 07h15: Niêm phong toàn bộ KTX và di chuyển sang Tòa nhà A học chính khóa!';
        } elseif ($currentTimeStr >= '17:50' && $currentTimeStr <= '18:05') {
            $criticalAlert = 'CẢNH BÁO MỐC 18h00: Chốt cổng trường KTX. Học sinh phải có mặt đầy đủ trong khuôn viên.';
        } elseif ($currentTimeStr >= '21:50' && $currentTimeStr <= '22:15') {
            $criticalAlert = 'CẢNH BÁO MỐC 22h00: Bắt đầu ca điểm danh tối toàn KTX và gửi báo cáo Zalo 22h15.';
        } elseif ($currentTimeStr >= '22:25' && $currentTimeStr <= '22:40') {
            $criticalAlert = 'CẢNH BÁO MỐC 22h30: Giờ giới nghiêm! Tắt toàn bộ đèn sinh hoạt và khóa cửa các phòng.';
        }

        Response::success([
            'server_time' => $now->format('H:i:s d/m/Y'),
            'current_time_str' => $currentTimeStr,
            'active_regime' => $activeRegime,
            'next_regime' => $nextRegime,
            'remaining_minutes' => max(0, $remainingMinutes),
            'critical_alert' => $criticalAlert
        ]);
    }

    public function complete(Request $request, string $id): void {
        $db = Database::getConnection();
        $user = AuthMiddleware::$currentUser;
        $today = date('Y-m-d');
        $note = trim($request->input('note', 'Đã hoàn thành kiểm tra chế độ'));

        $stmt = $db->prepare("
            INSERT INTO regime_execution_records (regime_id, execution_date, status, completed_by_user_id, completed_at, note)
            VALUES (?, ?, 'completed', ?, NOW(), ?)
            ON DUPLICATE KEY UPDATE status = 'completed', completed_by_user_id = VALUES(completed_by_user_id), completed_at = NOW(), note = VALUES(note)
        ");
        $stmt->execute([(int)$id, $today, $user['id'] ?? null, $note]);

        Response::success(null, 'Đã xác nhận hoàn thành chế độ sinh hoạt');
    }

    public function store(Request $request): void {
        $db = Database::getConnection();
        $orderNum = (int)$request->input('order_num', 12);
        $name = trim($request->input('name', ''));
        $timeStart = trim($request->input('time_start', ''));
        $timeEnd = trim($request->input('time_end', ''));
        $description = trim($request->input('description', ''));
        $responsibleRole = trim($request->input('responsible_role', 'Ban Quản sinh & GV Trực'));

        if (!$name || !$timeStart || !$timeEnd) {
            Response::error('Tên chế độ, giờ bắt đầu và kết thúc là bắt buộc', 422);
            return;
        }

        $stmt = $db->prepare("INSERT INTO daily_regimes (order_num, name, time_start, time_end, description, responsible_role) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$orderNum, $name, $timeStart, $timeEnd, $description, $responsibleRole]);

        Response::success(['id' => $db->lastInsertId()], 'Tạo chế độ sinh hoạt mới thành công', 201);
    }

    public function update(Request $request, string $id): void {
        $db = Database::getConnection();
        $orderNum = (int)$request->input('order_num');
        $name = trim($request->input('name', ''));
        $timeStart = trim($request->input('time_start', ''));
        $timeEnd = trim($request->input('time_end', ''));
        $description = trim($request->input('description', ''));
        $responsibleRole = trim($request->input('responsible_role', ''));

        $reg = $db->query("SELECT * FROM daily_regimes WHERE id = " . (int)$id)->fetch();
        if (!$reg) {
            Response::notFound('Chế độ sinh hoạt không tồn tại');
            return;
        }

        $stmt = $db->prepare("UPDATE daily_regimes SET order_num = ?, name = ?, time_start = ?, time_end = ?, description = ?, responsible_role = ? WHERE id = ?");
        $stmt->execute([
            $orderNum ?: $reg['order_num'],
            $name ?: $reg['name'],
            $timeStart ?: $reg['time_start'],
            $timeEnd ?: $reg['time_end'],
            $description ?: $reg['description'],
            $responsibleRole ?: $reg['responsible_role'],
            (int)$id
        ]);

        Response::success(null, 'Cập nhật chế độ sinh hoạt thành công');
    }

    public function destroy(Request $request, string $id): void {
        $db = Database::getConnection();
        $db->prepare("DELETE FROM regime_checklist_items WHERE regime_id = ?")->execute([(int)$id]);
        $db->prepare("DELETE FROM regime_execution_records WHERE regime_id = ?")->execute([(int)$id]);
        $db->prepare("DELETE FROM daily_regimes WHERE id = ?")->execute([(int)$id]);

        Response::success(null, 'Đã xóa chế độ sinh hoạt thành công');
    }
}

