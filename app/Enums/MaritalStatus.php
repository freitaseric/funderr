<?php

namespace App\Enums;

enum MaritalStatus: string
{
    case Single = 'SOLTEIRO';
    case Married = 'CASADO';
    case StableUnion = 'UNIAO_ESTAVEL';
    case Divorced = 'DIVORCIADO';
    case Separated = 'SEPARADO';
    case Widowed = 'VIUVO';

    public function label(): string
    {
        return match ($this) {
            self::Single => 'Solteiro(a)',
            self::Married => 'Casado(a)',
            self::StableUnion => 'União estável',
            self::Divorced => 'Divorciado(a)',
            self::Separated => 'Separado(a)',
            self::Widowed => 'Viúvo(a)',
        };
    }

    public function requiresSpouse(): bool
    {
        return in_array($this, [self::Married, self::StableUnion], true);
    }
}
