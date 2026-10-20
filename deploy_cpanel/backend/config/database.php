<?php
// backend/config/database.php

$envConfig = [];
if (file_exists(__DIR__ . '/env.php')) {
    $envConfig = require __DIR__ . '/env.php';
}

$defaultDb = $envConfig['DB_NAME'] ?? (getenv('DB_NAME') ?: 'chuyenhungvuong_kpi');
$dbHost    = $envConfig['DB_HOST'] ?? (getenv('DB_HOST') ?: '127.0.0.1');
$dbPort    = $envConfig['DB_PORT'] ?? (getenv('DB_PORT') ?: '3306');
$dbUser    = $envConfig['DB_USER'] ?? (getenv('DB_USER') ?: 'root');
$dbPass    = $envConfig['DB_PASS'] ?? (getenv('DB_PASS') ?: '');

// Multi-tenant Dynamic Database Resolution:
// 1. Check HTTP header X-School-Code (e.g. from Frontend or API client)
// 2. Check query parameter ?school=xxx or cookie 'school_code'
// 3. Check Subdomain from HTTP_HOST (e.g. phuninh.webkpi.vn -> 'phuninh')
$tenantCode = null;
if (!empty($_SERVER['HTTP_X_SCHOOL_CODE'])) {
    $tenantCode = preg_replace('/[^a-zA-Z0-9_]/', '', strtolower($_SERVER['HTTP_X_SCHOOL_CODE']));
} elseif (!empty($_GET['school'])) {
    $tenantCode = preg_replace('/[^a-zA-Z0-9_]/', '', strtolower($_GET['school']));
} elseif (!empty($_COOKIE['school_code'])) {
    $tenantCode = preg_replace('/[^a-zA-Z0-9_]/', '', strtolower($_COOKIE['school_code']));
} elseif (!empty($_SERVER['HTTP_HOST'])) {
    $host = explode(':', $_SERVER['HTTP_HOST'])[0];
    if (!filter_var($host, FILTER_VALIDATE_IP) && $host !== 'localhost') {
        $hostParts = explode('.', $host);
        if (count($hostParts) >= 3 && $hostParts[0] !== 'www' && $hostParts[0] !== 'api') {
            $candidate = preg_replace('/[^a-zA-Z0-9_]/', '', strtolower($hostParts[0]));
            if ($candidate && $candidate !== 'webkpi') {
                $tenantCode = $candidate;
            }
        }
    }
}

$dbName = $defaultDb;
if ($tenantCode) {
    if ($tenantCode === 'chuyenhungvuong' || $tenantCode === 'hungvuong' || $tenantCode === 'default') {
        $dbName = 'chuyenhungvuong_kpi';
    } else {
        $dbName = 'kpi_' . $tenantCode;
    }
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
