<?php
// backend/app/Core/Database.php

namespace App\Core;

use PDO;
use PDOException;

if (!date_default_timezone_get() || date_default_timezone_get() === 'UTC') {
    date_default_timezone_set('Asia/Ho_Chi_Minh');
}

class Database {
    private static array $instances = [];

    private static function loadConfig(): array {
        $paths = [
            __DIR__ . '/../../config/database.php',
            __DIR__ . '/../config/database.php',
            __DIR__ . '/../../../config/database.php',
            dirname(__DIR__, 2) . '/config/database.php',
            dirname(__DIR__, 3) . '/config/database.php',
        ];
        foreach ($paths as $p) {
            if (file_exists($p)) return require $p;
        }
        return require __DIR__ . '/../../config/database.php';
    }

    public static function getConnection(): PDO {
        $config = self::loadConfig();
        $dbKey = $config['database'];

        if (!isset(self::$instances[$dbKey])) {
            $dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['database']};charset={$config['charset']}";
            try {
                $pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
                @$pdo->exec("SET time_zone = '+07:00'");
                self::$instances[$dbKey] = $pdo;
            } catch (PDOException $e) {
                http_response_code(500);
                header('Content-Type: application/json; charset=UTF-8');
                echo json_encode([
                    'success' => false,
                    'message' => 'Lỗi kết nối cơ sở dữ liệu MySQL (' . $config['database'] . '): ' . $e->getMessage()
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }
        }
        return self::$instances[$dbKey];
    }

    public static function getServerConnection(): PDO {
        $config = self::loadConfig();
        $dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['database']};charset={$config['charset']}";
        return new PDO($dsn, $config['username'], $config['password'], $config['options']);
    }
}
