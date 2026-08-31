<?php

declare(strict_types=1);

namespace Funderr\Domain\Beneficiary;

final class Beneficiary
{
    public function __construct(
        public readonly ?int $id,
        public string $nome,
        public string $cpf,
        public string $telefone,
        public ?string $apelido,
        public ?string $nacionalidade,
        public ?string $naturalidade,
        public ?string $estadoCivil,
        public ?string $dataNascimento,
        public ?string $profissao,
        public ?string $rg,
        public ?string $escolaridade,
        public ?string $endereco,
        public ?int $dependentes,
        public ?string $conjugeNome,
        public ?string $conjugeRg,
        public ?string $conjugeCpf,
        public readonly ?string $createdAt,
        public readonly ?string $updatedAt,
    ) {
    }
}
