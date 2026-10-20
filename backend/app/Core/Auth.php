<?php
// backend/app/Core/Auth.php

namespace App\Core;

class Auth {
    private static string $secretKey = 'hung_vuong_kpi_system_secret_key_2026_thay_kinh';

    public static function createToken(array $userPayload, int $expiresInSeconds = 86400): string {
        $header = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payloadData = array_merge($userPayload, [
            'iat' => time(),
            'exp' => time() + $expiresInSeconds
        ]);
        $payload = base64_encode(json_encode($payloadData));
        $signature = hash_hmac('sha256', "$header.$payload", self::$secretKey, true);
        $encodedSignature = base64_encode($signature);
        return "$header.$payload.$encodedSignature";
    }

    public static function verifyToken(string $token): ?array {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }
        [$header, $payload, $signature] = $parts;
        $expectedSignature = base64_encode(hash_hmac('sha256', "$header.$payload", self::$secretKey, true));
        if (!hash_equals($expectedSignature, $signature)) {
            return null;
        }
        $data = json_decode(base64_decode($payload), true);
        if (!$data || !isset($data['exp']) || $data['exp'] < time()) {
            return null;
        }
        return $data;
    }

    public static function user(Request $request): ?array {
        $token = $request->getBearerToken();
        if (!$token) {
            $token = $request->get('token');
        }
        if (!$token) {
            return null;
        }
        return self::verifyToken($token);
    }
}
