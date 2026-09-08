<?php

namespace App\Enums;

enum CashFlowType: string
{
    case Revenue = 'REVENUE';
    case VariableCost = 'VARIABLE_COST';
    case FixedCost = 'FIXED_COST';

    public function label(): string
    {
        return match ($this) {
            self::Revenue => 'Receitas',
            self::VariableCost => 'Custos variáveis',
            self::FixedCost => 'Custos fixos',
        };
    }
}
