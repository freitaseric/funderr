<?php

namespace App\Enums;

enum ActivityCategory: string
{
    case Livestock = 'PECUARIA';
    case Agriculture = 'AGRICULTURA';
    case FishFarming = 'PISCICULTURA';

    public function label(): string
    {
        return match ($this) {
            self::Livestock => 'Pecuária', self::Agriculture => 'Agricultura', self::FishFarming => 'Piscicultura',
        };
    }

    /** @return array<int, string> */
    public function details(): array
    {
        return match ($this) {
            self::Livestock => ['Bovinocultura', 'Suinocultura', 'Avicultura', 'Ovinocultura', 'Caprinocultura', 'Bubalinocultura', 'Apicultura'],
            self::Agriculture => ['Horticultura', 'Fruticultura', 'Mandiocultura', 'Milhocultura', 'Feijãocultura', 'Culturas anuais'],
            self::FishFarming => ['Piscicultura de água doce', 'Criação de tambaqui', 'Criação de matrinxã', 'Criação de pirarucu'],
        };
    }
}
