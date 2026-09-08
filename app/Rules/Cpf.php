<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class Cpf implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || ! preg_match('/^\d{11}$/', $value) || preg_match('/^(\d)\1{10}$/', $value)) {
            $fail('Informe um CPF válido.');

            return;
        }

        for ($length = 9; $length <= 10; $length++) {
            $sum = 0;
            for ($index = 0; $index < $length; $index++) {
                $sum += (int) $value[$index] * ($length + 1 - $index);
            }
            $digit = (11 - $sum % 11) % 10;
            if ($sum % 11 < 2) {
                $digit = 0;
            }
            if ((int) $value[$length] !== $digit) {
                $fail('Informe um CPF válido.');

                return;
            }
        }
    }
}
