<?php

declare(strict_types=1);

namespace Funderr\Http;

final class Csrf
{
    public static function token(): string
    {
        if (!isset($_SESSION['_csrf'])) {
            $_SESSION['_csrf'] = bin2hex(random_bytes(32));
        }

        return $_SESSION['_csrf'];
    }

    public static function field(): string
    {
        return '<input type="hidden" name="_token" value="' . View::escape(self::token()) . '">';
    }

    public static function validate(mixed $token): bool
    {
        return is_string($token)
            && isset($_SESSION['_csrf'])
            && hash_equals($_SESSION['_csrf'], $token);
    }
}
