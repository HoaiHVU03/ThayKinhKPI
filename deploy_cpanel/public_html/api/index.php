<?php
// public_html/api/index.php
// Cầu nối chuyển tiếp các API requests tới Backend PHP trên cPanel TenTen

// Tự động tìm thư mục backend dù bạn đặt ở ngoài public_html hay trong public_html
$possiblePaths = [
    __DIR__ . '/../../backend/public/index.php',  // Trường hợp chuẩn: backend đặt tại /home/username/backend
    __DIR__ . '/../backend/public/index.php',     // Trường hợp backend đặt trong public_html/backend
    dirname(__DIR__, 2) . '/backend/public/index.php',
    dirname(__DIR__) . '/backend/public/index.php',
    '/home/d0g97w3mqxbj/backend/public/index.php'
];

$backendEntry = null;
foreach ($possiblePaths as $path) {
    if (file_exists($path)) {
        $backendEntry = realpath($path);
        break;
    }
}

if (!$backendEntry) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => 'Lỗi máy chủ: Không tìm thấy thư mục backend. Vui lòng kiểm tra lại vị trí thư mục backend trên cPanel.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

require $backendEntry;
