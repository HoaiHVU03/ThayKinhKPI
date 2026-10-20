<?php
// backend/config/database.php

$envConfig = [];
if (file_exists(__DIR__ . '/env.php')) {
    $envConfig = require __DIR__ . '/env.php';
}

$defaultDb = $envConfig['DB_NAME'] ?? (getenv('DB_NAME') ?: 'd0g97w3mqxbj_kpi');
// QUAN TRỌNG: Trên cPanel / Linux hosting, bắt buộc dùng 'localhost' (kết nối qua UNIX Socket)
// Không dùng '127.0.0.1' vì MySQL trên cPanel chỉ phân quyền cho user@localhost
$dbHost    = $envConfig['DB_HOST'] ?? (getenv('DB_HOST') ?: 'localhost');
$dbPort    = $envConfig['DB_PORT'] ?? (getenv('DB_PORT') ?: '3306');
$dbUser    = $envConfig['DB_USER'] ?? (getenv('DB_USER') ?: 'd0g97w3mqxbj_kpiuser');
$dbPass    = $envConfig['DB_PASS'] ?? (getenv('DB_PASS') ?: 'ThayKinhKPI@2026');

// Multi-tenant Dynamic Database Resolution:
// 1. Check HTTP header X-School-Code (e.g. from Frontend or API client)
// 2. Check query parameter ?school=xxx or cookie 'school_code'
// 3. Check Subdomain from HTTP_HOST (e.g. phuninh.edukpi.com.vn -> 'phuninh')
$tenantCode = null;
if (!empty($_SERVER['HTTP_X_SCHOOL_CODE'])) {
    $tenantCode = preg_replace('/[^a-zA-Z0-9_]/', '', strtolower($_SERVER['HTTP_X_SCHOOL_CODE']));
} elseif (!empty($_GET['school'])) {
    $tenantCode = preg_replace('/[^a-zA-Z0-9_]/', '', strtolower($_GET['school']));
} elseif (!empty($_COOKIE['school_code'])) {
    $tenantCode = preg_replace('/[^a-zA-Z0-9_]/', '', strtolower($_COOKIE['school_code']));
} elseif (!empty($_SERVER['HTTP_HOST'])) {
    $cleanHost = explode(':', $_SERVER['HTTP_HOST'])[0];
    if (!filter_var($cleanHost, FILTER_VALIDATE_IP) && $cleanHost !== 'localhost') {
        $hostParts = explode('.', strtolower($cleanHost));
        // Với tên miền 2 đuôi như .com.vn, .edu.vn, .net.vn, .tenten.vn:
        // Cần ít nhất 4 phần (vd: truong1.edukpi.com.vn) mới là có subdomain
        $isTwoPartTld = (count($hostParts) >= 2 && in_array($hostParts[count($hostParts)-2], ['com', 'edu', 'net', 'org', 'gov', 'tenten']));
        $minParts = $isTwoPartTld ? 4 : 3;

        if (count($hostParts) >= $minParts && $hostParts[0] !== 'www' && $hostParts[0] !== 'api') {
            $candidate = preg_replace('/[^a-zA-Z0-9_]/', '', $hostParts[0]);
            if ($candidate && !in_array($candidate, ['webkpi', 'edukpi', 'tenten', 'uo489vla7f', 'localhost', 'mail', 'cpanel'])) {
                $tenantCode = $candidate;
            }
        }
    }
}

// Bỏ qua nếu là mã trường chính hoặc tên miền chính
if (in_array($tenantCode, ['chuyenhungvuong', 'hungvuong', 'default', 'edukpi', 'webkpi', 'main', 'root'], true)) {
    $tenantCode = null;
}

$dbName = $defaultDb;
if ($tenantCode) {
    $prefix = preg_replace('/_kpi.*$/', '', $defaultDb);
    $dbName = ($prefix && $prefix !== $defaultDb) ? ($prefix . '_kpi_' . $tenantCode) : ('d0g97w3mqxbj_kpi_' . $tenantCode);
}

return [
    'host' => $dbHost,
    'port' => $dbPort,
    'database' => $dbName,
    'username' => $dbUser,
    'password' => $dbPass,
    'charset' => 'utf8mb4',
    'options' => [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]
];
