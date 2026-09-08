<?php

namespace App\Enums;

enum ProposalStep: string
{
    case Initial = 'INITIAL';
    case Patrimony = 'PATRIMONY';
    case Financing = 'FINANCING';
    case Identification = 'IDENTIFICATION';
    case CashFlow = 'CASH_FLOW';
    case Review = 'REVIEW';

    public function label(): string
    {
        return match ($this) {
            self::Initial => 'Dados iniciais',
            self::Patrimony => 'Patrimônio',
            self::Financing => 'Financiamento',
            self::Identification => 'Identificação',
            self::CashFlow => 'Fluxo de caixa',
            self::Review => 'Revisão / documentos',
        };
    }

    public function position(): int
    {
        return array_search($this, self::cases(), true);
    }

    public function next(): self
    {
        return self::cases()[min($this->position() + 1, 5)];
    }
}
