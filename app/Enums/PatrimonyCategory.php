<?php

namespace App\Enums;

enum PatrimonyCategory: string
{
    case Land = 'LAND';
    case Buildings = 'BUILDINGS';
    case AgriculturalStructures = 'AGRICULTURAL_STRUCTURES';
    case Infrastructure = 'INFRASTRUCTURE';
    case Equipment = 'EQUIPMENT';
    case Livestock = 'LIVESTOCK';
    case UrbanAssets = 'URBAN_ASSETS';

    public function label(): string
    {
        return match ($this) {
            self::Land => 'IV.1 Terra e cobertura',
            self::Buildings => 'IV.2 Construções civis',
            self::AgriculturalStructures => 'IV.3 Estrutura agropecuária',
            self::Infrastructure => 'IV.4 Infraestrutura',
            self::Equipment => 'IV.5 Máquinas, veículos, equipamentos e embarcações',
            self::Livestock => 'IV.6 Semoventes',
            self::UrbanAssets => 'IV.10 Outros bens urbanos',
        };
    }
}
