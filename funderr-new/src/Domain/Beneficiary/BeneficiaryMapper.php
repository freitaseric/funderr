<?php

declare(strict_types=1);

namespace Funderr\Domain\Beneficiary;

//TODO: Tem que analisar a necessidade de migrar para o namespace de infraestrutura pois essa classe conhece nuâncias do banco de dados
final class BeneficiaryMapper
{
    public static function fromRow(array $row): Beneficiary
    {
        return new Beneficiary(
            id: isset($row['id']) ? (int) $row['id'] : null,
            nome: (string) $row['nome'],
            cpf: (string) $row['cpf'],
            telefone: (string) $row['telefone'],
            apelido: isset($row['apelido']) ? (string) $row['apelido'] : null,
            nacionalidade: isset($row['nacionalidade']) ? (string) $row['nacionalidade'] : null,
            naturalidade: isset($row['naturalidade']) ? (string) $row['naturalidade'] : null,
            estadoCivil: isset($row['estadoCivil']) ? (string) $row['estadoCivil'] : null,
            dataNascimento: isset($row['dataNascimento']) ? (string) $row['dataNascimento'] : null,
            profissao: isset($row['profissao']) ? (string) $row['profissao'] : null,
            rg: isset($row['rg']) ? (string) $row['rg'] : null,
            escolaridade: isset($row['escolaridade']) ? (string) $row['escolaridade'] : null,
            endereco: isset($row['endereco']) ? (string) $row['endereco'] : null,
            dependentes: isset($row['dependentes']) ? (int) $row['dependentes'] : null,
            conjugeNome: isset($row['conjugeNome']) ? (string) $row['conjugeNome'] : null,
            conjugeRg: isset($row['conjugeRg']) ? (string) $row['conjugeRg'] : null,
            conjugeCpf: isset($row['conjugeCpf']) ? (string) $row['conjugeCpf'] : null,
            createdAt: isset($row['createdAt']) ? (string) $row['createdAt'] : null,
            updatedAt: isset($row['updatedAt']) ? (string) $row['updatedAt'] : null,
        );
    }

    //TODO: Tem que fazer o caminho contrário do fromRow
}