<?php

namespace App\Enums;

enum UserRole: string
{
    case Technician = 'tecnico';
    case Core = 'nucleo';
    case Administrator = 'administrador';

    public function label(): string
    {
        return match ($this) {
            self::Technician => 'Técnico',
            self::Core => 'Núcleo',
            self::Administrator => 'Administrador',
        };
    }
}
