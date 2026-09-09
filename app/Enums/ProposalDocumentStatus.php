<?php

namespace App\Enums;

enum ProposalDocumentStatus: string
{
    case Pending = 'PENDING';
    case Processing = 'PROCESSING';
    case Ready = 'READY';
    case Failed = 'FAILED';
}
