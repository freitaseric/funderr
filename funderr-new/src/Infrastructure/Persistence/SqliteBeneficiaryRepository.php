<?php

declare(strict_types=1);

namespace Funderr\Infrastructure\Persistence;

use Funderr\Domain\Beneficiary\Beneficiary;
use Funderr\Domain\Beneficiary\BeneficiaryMapper;
use Funderr\Domain\Beneficiary\BeneficiaryRepository;
use PDO;
use RuntimeException;

final class SqliteBeneficiaryRepository implements BeneficiaryRepository
{
    public function __construct(
        private readonly PDO $pdo
    ) {
    }

    public function findById(int $id): ?Beneficiary
    {
        $stmt = $this->pdo->prepare(
            '
            SELECT
                id,
                nome,
                cpf,
                telefone,
                apelido,
                nacionalidade,
                naturalidade,
                estadoCivil,
                dataNascimento,
                profissao,
                rg,
                escolaridade,
                endereco,
                dependentes,
                conjugeNome,
                conjugeRg,
                conjugeCpf,
                createdAt,
                updatedAt
            FROM beneficiaries
            WHERE id = :id
            LIMIT 1
            '
        );

        $stmt->execute(['id' => $id]);

        $row = $stmt->fetch();

        if ($row === false) {
            return null;
        }

        return BeneficiaryMapper::fromRow($row);
    }

    public function findByCpf(string $cpf): ?Beneficiary
    {
        $stmt = $this->pdo->prepare(
            '
            SELECT
              id,
                nome,
                cpf,
                telefone,
                apelido,
                nacionalidade,
                naturalidade,
                estadoCivil,
                dataNascimento,
                profissao,
                rg,
                escolaridade,
                endereco,
                dependentes,
                conjugeNome,
                conjugeRg,
                conjugeCpf,
                createdAt,
                updatedAt
            FROM beneficiaries
            WHERE cpf = :cpf
            LIMIT 1
            '
        );

        $stmt->execute(['cpf' => $cpf]);

        $row = $stmt->fetch();

        if ($row === false) {
            return null;
        }

        return BeneficiaryMapper::fromRow($row);
    }

    public function findAll(): array
    {
        $stmt = $this->pdo->query(
            '
            SELECT
                id,
                nome,
                cpf,
                telefone,
                apelido,
                nacionalidade,
                naturalidade,
                estadoCivil,
                dataNascimento,
                profissao,
                rg,
                escolaridade,
                endereco,
                dependentes,
                conjugeNome,
                conjugeRg,
                conjugeCpf,
                createdAt,
                updatedAt
            FROM beneficiaries
            ORDER BY nome
            '
        );

        $rows = $stmt->fetchAll();

        return array_map(fn(array $row): Beneficiary => BeneficiaryMapper::fromRow($row), $rows);
    }

    public function create(Beneficiary $data): Beneficiary
    {
        $stmt = $this->pdo->prepare(
            '
            INSERT INTO beneficiaries (
                nome,
                cpf,
                telefone,
                apelido,
                nacionalidade,
                naturalidade,
                estadoCivil,
                dataNascimento,
                profissao,
                rg,
                escolaridade,
                endereco,
                dependentes,
                conjugeNome,
                conjugeRg,
                conjugeCpf
            )
            VALUES (
                :nome,
                :cpf,
                :telefone,
                :apelido,
                :nacionalidade,
                :naturalidade,
                :estadoCivil,
                :dataNascimento,
                :profissao,
                :rg,
                :escolaridade,
                :endereco,
                :dependentes,
                :conjugeNome,
                :conjugeRg,
                :conjugeCpf
            )
            '
        );

        $stmt->execute([
            'nome' => $data->nome,
            'cpf' => $data->cpf,
            'telefone' => $data->telefone,
            'apelido' => $data->apelido,
            'nacionalidade' => $data->nacionalidade,
            'naturalidade' => $data->naturalidade,
            'estadoCivil' => $data->estadoCivil,
            'dataNascimento' => $data->dataNascimento,
            'profissao' => $data->profissao,
            'rg' => $data->rg,
            'escolaridade' => $data->escolaridade,
            'endereco' => $data->endereco,
            'dependentes' => $data->dependentes,
            'conjugeNome' => $data->conjugeNome,
            'conjugeRg' => $data->conjugeRg,
            'conjugeCpf' => $data->conjugeCpf
        ]);

        $id = (int) $this->pdo->lastInsertId();

        $createdUser = $this->findById($id);

        if ($createdUser === null) {
            throw new RuntimeException(
                'Não foi possível recuperar o usuário criado.'
            );
        }

        return $createdUser;
    }

}
