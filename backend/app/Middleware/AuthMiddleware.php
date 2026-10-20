<?php
// backend/app/Middleware/AuthMiddleware.php

namespace App\Middleware;

use App\Core\Auth;
use App\Core\Request;
use App\Core\Response;

class AuthMiddleware {
    public static ?array $currentUser = null;

    public function handle(Request $request): bool {
        $user = Auth::user($request);
        if (!$user) {
            Response::unauthorized('Phiên làm việc hết hạn hoặc chưa đăng nhập. Vui lòng đăng nhập lại.');
            return false;
        }
        self::$currentUser = $user;
        return true;
    }

    /**
     * Get assigned scope ID for current user (e.g. 'class', 'room', 'floor')
     */
    public static function getUserScope(string $type): ?int {
        if (!self::$currentUser || empty(self::$currentUser['scopes'])) {
            return null;
        }
        foreach (self::$currentUser['scopes'] as $sc) {
            if (($sc['scope_type'] ?? '') === $type) {
                return (int)$sc['scope_id'];
            }
        }
        return null;
    }

    /**
     * Check if current user is Admin (Ban Giám Hiệu / Quản trị viên)
     */
    public static function isAdmin(): bool {
        return (self::$currentUser['role'] ?? '') === 'admin';
    }

    /**
     * Check if current user has any of the given roles. Admin always returns true.
     */
    public static function hasRole(array|string $roles): bool {
        if (!self::$currentUser) return false;
        if (self::isAdmin()) return true; // Admin has highest privileges

        $roleList = is_array($roles) ? $roles : [$roles];
        return in_array(self::$currentUser['role'] ?? '', $roleList, true);
    }

    /**
     * Require one of given roles, otherwise stop and respond with HTTP 403 Forbidden
     */
    public static function requireRole(array|string $roles, string $message = 'Bạn không có quyền thực hiện thao tác này'): bool {
        if (!self::hasRole($roles)) {
            Response::forbidden($message);
            return false;
        }
        return true;
    }

    /**
     * Require Admin role strictly
     */
    public static function requireAdmin(string $message = 'Chỉ Ban Giám Hiệu và Quản trị viên mới có quyền thực hiện thao tác này'): bool {
        if (!self::isAdmin()) {
            Response::forbidden($message);
            return false;
        }
        return true;
    }
}
