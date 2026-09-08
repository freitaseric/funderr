<?php

declare(strict_types=1);

namespace Funderr\Infrastructure\Persistence;

use Funderr\Domain\Beneficiary\Beneficiary;

final class BeneficiaryMapper
{
    public static function fromRow(array $row): Beneficiary
    {
        return new Beneficiary(
            id: isset($row['id']) ? (int) $row['id'] : null,
            nome: (string) $row['nome'],
            cpf: (string) $row['cpf'],
            telefone: (string) $row['telefone'],
            apelido: self::nullableString($row, 'apelido'),
            nacionalidade: self::nullableString($row, 'nacionalidade'),
            naturalidade: self::nullableString($row, 'naturalidade'),
            estadoCivil: self::nullableString($row, 'estadoCivil'),
            dataNascimento: self::nullableString($row, 'dataNascimento'),
            profissao: self::nullableString($row, 'profissao'),
            rg: self::nullableString($row, 'rg'),
            escolaridade: self::nullableString($row, 'escolaridade'),
            endereco: self::nullableString($row, 'endereco'),
            dependentes: isset($row['dependentes']) ? (int) $row['dependentes'] : null,
            conjugeNome: self::nullableString($row, 'conjugeNome'),
            conjugeRg: self::nullableString($row, 'conjugeRg'),
            conjugeCpf: self::nullableString($row, 'conjugeCpf'),
            createdAt: self::nullableString($row, 'createdAt'),
            updatedAt: self::nullableString($row, 'updatedAt'),
        );
    }

    /** @return array<string, string|int|null> */
    public static function toRow(Beneficiary $beneficiary): array
    {
        return [
            'nome' => $beneficiary->nome,
            'cpf' => $beneficiary->cpf,
            'telefone' => $beneficiary->telefone,
            'apelido' => $beneficiary->apelido,
            'nacionalidade' => $beneficiary->nacionalidade,
            'naturalidade' => $beneficiary->naturalidade,
            'estadoCivil' => $beneficiary->estadoCivil,
            'dataNascimento' => $beneficiary->dataNascimento,
            'profissao' => $beneficiary->profissao,
            'rg' => $beneficiary->rg,
            'escolaridade' => $beneficiary->escolaridade,
            'endereco' => $beneficiary->endereco,
            'dependentes' => $beneficiary->dependentes,
            'conjugeNome' => $beneficiary->conjugeNome,
            'conjugeRg' => $beneficiary->conjugeRg,
            'conjugeCpf' => $beneficiary->conjugeCpf,
        ];
    }

    private static function nullableString(array $row, string $key): ?string
    {
        return isset($row[$key]) ? (string) $row[$key] : null;
    }
}
