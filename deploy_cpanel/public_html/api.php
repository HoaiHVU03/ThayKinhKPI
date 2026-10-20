<?php
// public_html/api.php
// Điểm tiếp nhận API duy nhất của hệ thống trên cPanel TenTen (tương thích LiteSpeed & Apache)

// Tìm file index.php của backend
$possiblePaths = [
    '/home/d0g97w3mqxbj/backend/public/index.php',
    dirname(__DIR__) . '/backend/public/index.php',
    __DIR__ . '/../backend/public/index.php',
    __DIR__ . '/backend/public/index.php'
];

$backendEntry = null;
foreach ($possiblePaths as $p) {
    if (file_exists($p)) {
        $backendEntry = $p;
        break;
    }
}

if (!$backendEntry) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => 'Lỗi máy chủ: Không tìm thấy file backend/public/index.php. Vui lòng kiểm tra lại vị trí thư mục backend trên cPanel.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

require $backendEntry;
