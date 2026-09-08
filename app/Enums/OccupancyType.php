<?php

namespace App\Enums;

enum OccupancyType: string
{
    case Own = 'PROPRIA';
    case Rented = 'ARRENDADA';
    case Possession = 'POSSE';
    case Loan = 'COMODATO';
    case Concession = 'CONCESSAO';
    case Settlement = 'ASSENTAMENTO';

    public function label(): string
    {
        return match ($this) {
            self::Own => 'Própria',
            self::Rented => 'Arrendada',
            self::Possession => 'Posse',
            self::Loan => 'Comodato',
            self::Concession => 'Concessão de uso',
            self::Settlement => 'Assentamento',
        };
    }
}
