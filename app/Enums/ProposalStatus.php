<?php

namespace App\Enums;

enum ProposalStatus: string
{
    case Draft = 'RASCUNHO';
    case InReview = 'EM_REVISAO';
    case Returned = 'DEVOLVIDA';
    case Released = 'LIBERADA';
    case Sent = 'ENVIADA';
    case BankReturned = 'RETORNADA';
    case Completed = 'CONCLUIDA';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Rascunho',
            self::InReview => 'Em revisão',
            self::Returned => 'Devolvida',
            self::Released => 'Liberada',
            self::Sent => 'Enviada',
            self::BankReturned => 'Retornada pelo banco',
            self::Completed => 'Concluída',
        };
    }

    public function editable(): bool
    {
        return in_array($this, [self::Draft, self::Returned], true);
    }
}
