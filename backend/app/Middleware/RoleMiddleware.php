<?php
// backend/app/Middleware/RoleMiddleware.php

namespace App\Middleware;

use App\Core\Request;
use App\Core\Response;

class RoleMiddleware {
    protected array $allowedRoles = [];

    public function handle(Request $request): bool {
        $user = AuthMiddleware::$currentUser;
        if (!$user) {
            Response::unauthorized();
            return false;
        }

        if (!empty($this->allowedRoles) && !in_array($user['role'], $this->allowedRoles)) {
            Response::forbidden('Vai trò của bạn (' . $user['role'] . ') không được cấp quyền truy cập tài nguyên này.');
            return false;
        }

        return true;
    }
}
