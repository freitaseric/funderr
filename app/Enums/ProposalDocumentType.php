<?php

namespace App\Enums;

enum ProposalDocumentType: string
{
    case AterContract = 'ATER_CONTRACT';
    case AterContractSigned = 'ATER_CONTRACT_SIGNED';
    case ProducerIdentity = 'PRODUCER_IDENTITY';
    case PropertyDocument = 'PROPERTY_DOCUMENT';
    case ProofOfAddress = 'PROOF_OF_ADDRESS';
    case Caf = 'CAF';
    case OtherProducerDocument = 'OTHER_PRODUCER_DOCUMENT';
    case Dossier = 'DOSSIER';

    public function label(): string
    {
        return match ($this) {
            self::AterContract => 'Contrato ATER',
            self::AterContractSigned => 'Contrato ATER assinado',
            self::ProducerIdentity => 'Identificação do produtor',
            self::PropertyDocument => 'Documento da propriedade',
            self::ProofOfAddress => 'Comprovante de endereço',
            self::Caf => 'CAF',
            self::OtherProducerDocument => 'Outro documento do produtor',
            self::Dossier => 'Dossier',
        };
    }
}
