<?php

namespace App\Enums;

enum PatrimonyUnit: string
{
    case Unit = 'UNIDADE';
    case Hectare = 'HECTARE';
    case SquareMeter = 'METRO_QUADRADO';
    case Kilogram = 'QUILOGRAMA';
    case Ton = 'TONELADA';
    case Liter = 'LITRO';
    case Head = 'CABECA';
    case Month = 'MES';
    case Year = 'ANO';

    public function label(): string
    {
        return match ($this) {
            self::Unit => 'Unidade', self::Hectare => 'Hectare (ha)', self::SquareMeter => 'Metro quadrado (m²)',
            self::Kilogram => 'Quilograma (kg)', self::Ton => 'Tonelada (t)', self::Liter => 'Litro (l)',
            self::Head => 'Cabeça', self::Month => 'Mês', self::Year => 'Ano',
        };
    }
}
