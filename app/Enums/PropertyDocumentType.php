<?php

namespace App\Enums;

enum PropertyDocumentType: string
{
    case DefinitiveTitle = 'TITULO_DEFINITIVO';
    case PublicDeed = 'ESCRITURA_PUBLICA';
    case PurchaseAgreement = 'CONTRATO_COMPRA_VENDA';
    case LeaseAgreement = 'CONTRATO_ARRENDAMENTO';
    case LoanAgreement = 'CONTRATO_COMODATO';
    case PossessionTerm = 'TERMO_POSSE';
    case Ccu = 'CCU';
    case Cdru = 'CDRU';
    case Sipra = 'SIPRA';
    case Other = 'OUTRO';
    case NoDocument = 'SEM_DOCUMENTO';

    public function label(): string
    {
        return match ($this) {
            self::DefinitiveTitle => 'Título definitivo',
            self::PublicDeed => 'Escritura pública',
            self::PurchaseAgreement => 'Contrato de compra e venda',
            self::LeaseAgreement => 'Contrato de arrendamento',
            self::LoanAgreement => 'Contrato de comodato',
            self::PossessionTerm => 'Termo de posse',
            self::Ccu => 'Contrato de concessão de uso (CCU)',
            self::Cdru => 'Contrato de concessão de direito real de uso (CDRU)',
            self::Sipra => 'Registro de beneficiário no SIPRA',
            self::Other => 'Outro documento',
            self::NoDocument => 'Sem documento',
        };
    }

    /** @return array<int, self> */
    public static function forOccupancy(OccupancyType $occupancyType): array
    {
        return match ($occupancyType) {
            OccupancyType::Own => [self::DefinitiveTitle, self::PublicDeed],
            OccupancyType::Rented => [self::LeaseAgreement],
            OccupancyType::Possession => [self::PossessionTerm, self::PurchaseAgreement],
            OccupancyType::Loan => [self::LoanAgreement],
            OccupancyType::Concession => [self::Ccu, self::Cdru],
            OccupancyType::Settlement => [self::Sipra, self::Ccu, self::Cdru, self::DefinitiveTitle],
        };
    }
}
