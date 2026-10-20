<?php
// backend/app/Core/Request.php

namespace App\Core;

class Request {
    private array $body;
    private array $query;
    private array $headers;

    public function __construct() {
        $raw = file_get_contents('php://input');
        $this->body = json_decode($raw, true) ?? [];
        if (empty($this->body) && !empty($_POST)) {
            $this->body = $_POST;
        }
        $this->query = $_GET ?? [];
        $this->headers = function_exists('getallheaders') ? (getallheaders() ?: []) : [];
    }

    public function get(string $key, mixed $default = null): mixed {
        return $this->query[$key] ?? $default;
    }

    public function input(string $key, mixed $default = null): mixed {
        return $this->body[$key] ?? $default;
    }

    public function all(): array {
        return array_merge($this->query, $this->body);
    }

    public function getBody(): array {
        return $this->body;
    }

    public function getQuery(): array {
        return $this->query;
    }

    public function getHeader(string $name, mixed $default = null): mixed {
        foreach ($this->headers as $key => $value) {
            if (strcasecmp($key, $name) === 0) {
                return $value;
            }
        }
        return $default;
    }

    public function getBearerToken(): ?string {
        $auth = $this->getHeader('Authorization');
        if ($auth && preg_match('/Bearer\s+(\S+)/i', $auth, $matches)) {
            return $matches[1];
        }
        return null;
    }

    public function ip(): string {
        return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    }
}
