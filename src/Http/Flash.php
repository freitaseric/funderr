<?php

declare(strict_types=1);

namespace Funderr\Http;

final class Flash
{
    public static function success(string $message): void
    {
        $_SESSION['_flash_success'] = $message;
    }

    public static function error(string $message): void
    {
        $_SESSION['_flash_error'] = $message;
    }

    public static function take(string $type): ?string
    {
        $key = '_flash_' . $type;
        $message = $_SESSION[$key] ?? null;
        unset($_SESSION[$key]);

        return is_string($message) ? $message : null;
    }
}
