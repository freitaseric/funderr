<?php

namespace App\Enums;

enum ProposalStatus: string
{
    case Draft = 'RASCUNHO';
    case InReview = 'EM_REVISAO';
    case Returned = 'DEVOLVIDA';
    case ReadyForSend = 'PRONTA_PARA_ENVIO';
    case Sent = 'ENVIADA';
    case Released = 'LIBERADA';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Rascunho',
            self::InReview => 'Em revisão',
            self::Returned => 'Devolvida',
            self::ReadyForSend => 'Pronta para envio',
            self::Sent => 'Enviada',
            self::Released => 'Liberada',
        };
    }

    public function editable(): bool
    {
        return in_array($this, [self::Draft, self::Returned], true);
    }
}
