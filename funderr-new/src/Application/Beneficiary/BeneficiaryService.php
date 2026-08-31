<?php

declare(strict_types=1);

namespace Funderr\Application\Beneficiary;

use Funderr\Domain\Beneficiary\Beneficiary;
use Funderr\Domain\Beneficiary\BeneficiaryRepository;

final class BeneficiaryService
{
    public function __construct(
        private readonly BeneficiaryRepository $beneficiaries,
    ) {}

    public function create(Beneficiary $data): Beneficiary {
        //TODO: Validar e criar usuário

        return $data;
    }

    //TODO: Demais funções de banco de dados
}
