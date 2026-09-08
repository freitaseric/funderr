<?php

namespace App\Enums;

enum EducationLevel: string
{
    case None = 'SEM_ESCOLARIDADE';
    case ElementaryIncomplete = 'FUNDAMENTAL_INCOMPLETO';
    case ElementaryComplete = 'FUNDAMENTAL_COMPLETO';
    case HighSchoolIncomplete = 'MEDIO_INCOMPLETO';
    case HighSchoolComplete = 'MEDIO_COMPLETO';
    case HigherEducationIncomplete = 'SUPERIOR_INCOMPLETO';
    case HigherEducationComplete = 'SUPERIOR_COMPLETO';
    case Postgraduate = 'POS_GRADUACAO';

    public function label(): string
    {
        return match ($this) {
            self::None => 'Sem escolaridade',
            self::ElementaryIncomplete => 'Fundamental incompleto',
            self::ElementaryComplete => 'Fundamental completo',
            self::HighSchoolIncomplete => 'Médio incompleto',
            self::HighSchoolComplete => 'Médio completo',
            self::HigherEducationIncomplete => 'Superior incompleto',
            self::HigherEducationComplete => 'Superior completo',
            self::Postgraduate => 'Pós-graduação',
        };
    }
}
