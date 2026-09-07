<?php

declare(strict_types=1);

namespace Funderr\Infrastructure\Persistence;

use Funderr\Domain\Beneficiary\Beneficiary;
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

        $stmt->execute(BeneficiaryMapper::toRow($data));

        $id = (int) $this->pdo->lastInsertId();

        $createdBeneficiary = $this->findById($id);

        if ($createdBeneficiary === null) {
            throw new RuntimeException(
                'Não foi possível recuperar o beneficiário criado.'
            );
        }

        return $createdBeneficiary;
    }

    public function update(Beneficiary $beneficiary): Beneficiary
    {
        if ($beneficiary->id === null) {
            throw new RuntimeException('Beneficiário sem ID não pode ser atualizado.');
        }

        $values = BeneficiaryMapper::toRow($beneficiary);
        $assignments = array_map(
            static fn(string $field): string => "{$field} = :{$field}",
            array_keys($values),
        );
        $statement = $this->pdo->prepare(
            'UPDATE beneficiaries SET ' . implode(', ', $assignments) .
            ', updatedAt = CURRENT_TIMESTAMP WHERE id = :id'
        );
        $statement->execute([...$values, 'id' => $beneficiary->id]);

        $updated = $this->findById($beneficiary->id);
        if ($updated === null) {
            throw new RuntimeException('Não foi possível recuperar o beneficiário atualizado.');
        }

        return $updated;
    }

    public function references(int $beneficiaryId): array
    {
        $statement = $this->pdo->prepare(
            'SELECT id, beneficiary_id, ordem, nome, telefone
             FROM beneficiary_references WHERE beneficiary_id=:id ORDER BY ordem'
        );
        $statement->execute(['id' => $beneficiaryId]);

        return $statement->fetchAll();
    }

    public function replaceReferences(int $beneficiaryId, array $references): void
    {
        $this->pdo->beginTransaction();
        try {
            $this->pdo->prepare('DELETE FROM beneficiary_references WHERE beneficiary_id=:id')
                ->execute(['id' => $beneficiaryId]);
            $statement = $this->pdo->prepare(
                'INSERT INTO beneficiary_references (beneficiary_id, ordem, nome, telefone)
                 VALUES (:beneficiary_id, :ordem, :nome, :telefone)'
            );
            foreach ($references as $index => $reference) {
                $statement->execute([
                    'beneficiary_id' => $beneficiaryId,
                    'ordem' => $index + 1,
                    'nome' => $reference['nome'],
                    'telefone' => $reference['telefone'],
                ]);
            }
            $this->pdo->commit();
        } catch (\Throwable $throwable) {
            $this->pdo->rollBack();
            throw $throwable;
        }
    }

}
