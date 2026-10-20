<?php
// backend/app/Core/Response.php

namespace App\Core;

class Response {
    public static function json(array $data, int $statusCode = 200): void {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function success(mixed $data = null, string $message = 'Thao tác thành công', int $statusCode = 200): void {
        self::json([
            'success' => true,
            'message' => $message,
            'data' => $data
        ], $statusCode);
    }

    public static function error(string $message = 'Đã có lỗi xảy ra', int $statusCode = 400, mixed $errors = null): void {
        self::json([
            'success' => false,
            'message' => $message,
            'errors' => $errors
        ], $statusCode);
    }

    public static function unauthorized(string $message = 'Vui lòng đăng nhập để tiếp tục'): void {
        self::error($message, 401);
    }

    public static function forbidden(string $message = 'Bạn không có quyền thực hiện thao tác này'): void {
        self::error($message, 403);
    }

    public static function notFound(string $message = 'Không tìm thấy dữ liệu yêu cầu'): void {
        self::error($message, 404);
    }
}
