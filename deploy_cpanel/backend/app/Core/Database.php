<?php
// backend/app/Core/Database.php

namespace App\Core;

use PDO;
use PDOException;

class Database {
    private static array $instances = [];

    public static function getConnection(): PDO {
        $config = require __DIR__ . '/../../config/database.php';
        $dbKey = $config['database'];

        if (!isset(self::$instances[$dbKey])) {
            $dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['database']};charset={$config['charset']}";
            try {
                self::$instances[$dbKey] = new PDO($dsn, $config['username'], $config['password'], $config['options']);
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
        $config = require __DIR__ . '/../../config/database.php';
        $dsn = "mysql:host={$config['host']};port={$config['port']};charset={$config['charset']}";
        return new PDO($dsn, $config['username'], $config['password'], $config['options']);
    }
}
