<?php

namespace App\Enums;

enum JobCategory: string
{
    case Administrative = 'ADMINISTRATIVE';
    case Technical = 'TECHNICAL';
    case Productive = 'PRODUCTIVE';
    case Other = 'OTHER';

    public function label(): string
    {
        return match ($this) {
            self::Administrative => 'Administrativa',
            self::Technical => 'Técnica',
            self::Productive => 'Produtiva',
            self::Other => 'Outros',
        };
    }
}
