<?php

declare(strict_types=1);

namespace Funderr\Domain\Beneficiary;

interface BeneficiaryRepository
{
    public function findById(int $id): ?Beneficiary;

    public function findByCpf(string $cpf): ?Beneficiary;

    /**
     * @return Beneficiary[]
     */
    public function findAll(): array;

    public function create(Beneficiary $data): Beneficiary;

    public function update(Beneficiary $beneficiary): Beneficiary;

    public function references(int $beneficiaryId): array;

    public function replaceReferences(int $beneficiaryId, array $references): void;

}
