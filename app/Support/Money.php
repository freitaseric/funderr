<?php

namespace App\Support;

use InvalidArgumentException;

/** Exact monetary value. Internally it is always an integer number of cents. */
final readonly class Money
{
    private function __construct(public int $cents) {}

    public static function from(mixed $value): self
    {
        if ($value instanceof self) {
            return $value;
        }
        if ($value === null || $value === '') {
            return self::zero();
        }
        $value = trim(str_replace(['R$', ' '], '', (string) $value));
        $negative = str_starts_with($value, '-');
        $value = ltrim($value, '+-');
        if (str_contains($value, ',')) {
            $value = str_replace('.', '', $value);
            $value = str_replace(',', '.', $value);
        }
        if (! preg_match('/^\d+(?:\.\d+)?$/', $value)) {
            throw new InvalidArgumentException('Invalid monetary value.');
        }
        [$whole, $fraction] = array_pad(explode('.', $value, 2), 2, '');
        $cents = ((int) $whole * 100) + (int) str_pad(substr($fraction, 0, 2), 2, '0');
        if (isset($fraction[2]) && (int) $fraction[2] >= 5) {
            $cents++;
        }

        return new self($negative ? -$cents : $cents);
    }

    public static function zero(): self
    {
        return new self(0);
    }

    public function add(self $other): self
    {
        return new self($this->cents + $other->cents);
    }

    public function subtract(self $other): self
    {
        return new self($this->cents - $other->cents);
    }

    public function multiplyDecimal(string $factor, int $scale = 4): self
    {
        $negative = str_starts_with($factor, '-');
        $factor = ltrim($factor, '+-');
        [$whole, $fraction] = array_pad(explode('.', $factor, 2), 2, '');
        $scaledFactor = ((int) $whole * (10 ** $scale))
            + (int) str_pad(substr($fraction, 0, $scale), $scale, '0');
        $result = self::roundedDivide($this->cents * $scaledFactor, 10 ** $scale);

        return new self($negative ? -$result : $result);
    }

    public function divide(int $divisor): self
    {
        return new self(self::roundedDivide($this->cents, $divisor));
    }

    public function isPositive(): bool
    {
        return $this->cents > 0;
    }

    public function isNegative(): bool
    {
        return $this->cents < 0;
    }

    public function isGreaterThanOrEqual(self $other): bool
    {
        return $this->cents >= $other->cents;
    }

    public function toDecimal(): string
    {
        $absolute = abs($this->cents);

        return ($this->cents < 0 ? '-' : '').intdiv($absolute, 100).'.'.str_pad((string) ($absolute % 100), 2, '0', STR_PAD_LEFT);
    }

    private static function roundedDivide(int $numerator, int $denominator): int
    {
        $sign = $numerator < 0 ? -1 : 1;
        $numerator = abs($numerator);

        return $sign * intdiv($numerator + intdiv($denominator, 2), $denominator);
    }
}
