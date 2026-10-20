<?php
// backend/app/Core/Router.php

namespace App\Core;

class Router {
    private array $routes = [];

    public function add(string $method, string $path, callable|array $handler, array $middlewares = []): void {
        $this->routes[] = [
            'method' => strtoupper($method),
            'pattern' => $this->convertPathToRegex($path),
            'handler' => $handler,
            'middlewares' => $middlewares,
            'originalPath' => $path
        ];
    }

    public function get(string $path, callable|array $handler, array $middlewares = []): void {
        $this->add('GET', $path, $handler, $middlewares);
    }

    public function post(string $path, callable|array $handler, array $middlewares = []): void {
        $this->add('POST', $path, $handler, $middlewares);
    }

    public function put(string $path, callable|array $handler, array $middlewares = []): void {
        $this->add('PUT', $path, $handler, $middlewares);
    }

    public function delete(string $path, callable|array $handler, array $middlewares = []): void {
        $this->add('DELETE', $path, $handler, $middlewares);
    }

    public function dispatch(string $method, string $uri): void {
        // Strip query string
        $path = parse_url($uri, PHP_URL_PATH);
        $method = strtoupper($method);

        // Preflight CORS request
        if ($method === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        $request = new Request();

        foreach ($this->routes as $route) {
            if ($route['method'] === $method && preg_match($route['pattern'], $path, $matches)) {
                array_shift($matches); // Remove full match
                
                // Run middlewares
                foreach ($route['middlewares'] as $middlewareClass) {
                    $mw = new $middlewareClass();
                    $result = $mw->handle($request);
                    if ($result === false) {
                        return; // Stopped by middleware
                    }
                }

                // Call handler
                $handler = $route['handler'];
                if (is_array($handler)) {
                    [$class, $action] = $handler;
                    $controller = new $class();
                    call_user_func_array([$controller, $action], array_merge([$request], $matches));
                } else {
                    call_user_func_array($handler, array_merge([$request], $matches));
                }
                return;
            }
        }

        Response::notFound("Endpoint '$method $path' không tồn tại trên hệ thống");
    }

    private function convertPathToRegex(string $path): string {
        // Replace {param} with named/unnamed regex group
        $pattern = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '([^/]+)', $path);
        return '#^' . $pattern . '$#';
    }
}
