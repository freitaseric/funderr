<?php

declare(strict_types=1);

namespace Funderr\Application\Support;

final class Input
{
    public static function string(array $data, string $key): string
    {
        $value = $data[$key] ?? '';

        return is_scalar($value) ? trim((string) $value) : '';
    }

    public static function int(array $data, string $key): int
    {
        return (int) self::number($data, $key);
    }

    public static function number(array $data, string $key): float
    {
        $value = self::string($data, $key);

        if ($value === '') {
            return 0.0;
        }

        $normalized = str_replace(['.', ','], ['', '.'], $value);

        if (substr_count($value, '.') === 1 && !str_contains($value, ',')) {
            $normalized = $value;
        }

        return is_numeric($normalized) ? (float) $normalized : 0.0;
    }

    public static function bool(array $data, string $key): bool
    {
        return in_array($data[$key] ?? null, [true, 1, '1', 'true', 'on'], true);
    }

    public static function digits(array $data, string $key): string
    {
        return preg_replace('/\D/', '', self::string($data, $key)) ?? '';
    }

    public static function validCpf(string $cpf): bool
    {
        $cpf = preg_replace('/\D/', '', $cpf) ?? '';
        if (strlen($cpf) !== 11 || preg_match('/^(\d)\1{10}$/', $cpf) === 1) return false;
        for ($digit = 9; $digit < 11; $digit++) {
            $sum = 0;
            for ($index = 0; $index < $digit; $index++) {
                $sum += (int) $cpf[$index] * (($digit + 1) - $index);
            }
            $check = ($sum * 10) % 11;
            if (($check === 10 ? 0 : $check) !== (int) $cpf[$digit]) return false;
        }

        return true;
    }
}
