<?php

declare(strict_types=1);

namespace Funderr\Controller;

use Funderr\Application\Beneficiary\BeneficiaryService;
use Funderr\Domain\Beneficiary\BeneficiaryRepository;

final class BeneficiaryController
{
    public function __construct(
        private readonly BeneficiaryRepository $beneficiaries,
        private readonly BeneficiaryService $beneficiaryService,
        private readonly string $templatesPath,
    ) {
    }

    public function index(): void
    {
        $this->renderIndex();
    }

    //TODO: Criar função auxiliar para criar novo beneficiário

    private function renderIndex(?string $error = null): void
    {
        //TODO: Substituir por função de service
        $beneficiaries = $this->beneficiaries->findAll();

        require $this->templatesPath . '/beneficiaries/index.php';
    }
}
