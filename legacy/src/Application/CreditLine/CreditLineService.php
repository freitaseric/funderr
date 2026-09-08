<?php

declare(strict_types=1);

namespace Funderr\Application\CreditLine;

use Funderr\Application\Audit\AuditService;
use Funderr\Application\Exception\ValidationException;
use Funderr\Application\Support\Input;
use PDO;

final class CreditLineService
{
    public function __construct(
        private readonly PDO $pdo,
        private readonly AuditService $audit,
    ) {
    }

    public function list(bool $onlyActive = false): array
    {
        $sql = 'SELECT * FROM credit_lines';
        if ($onlyActive) {
            $sql .= ' WHERE ativo = 1';
        }

        return $this->pdo->query($sql . ' ORDER BY nome')->fetchAll();
    }

    public function save(array $data): int
    {
        $id = Input::int($data, 'id');
        $values = [
            'codigo' => strtoupper(Input::string($data, 'codigo')),
            'nome' => Input::string($data, 'nome'),
            'ativo' => Input::bool($data, 'ativo') ? 1 : 0,
            'teto_financiamento' => Input::number($data, 'teto_financiamento'),
            'taxa_juros_anual' => Input::number($data, 'taxa_juros_anual'),
            'prazo_max_anos' => Input::int($data, 'prazo_max_anos'),
            'carencia_max_anos' => Input::int($data, 'carencia_max_anos'),
            'percentual_financiavel_max' => Input::number($data, 'percentual_financiavel_max'),
            'percentual_ater_padrao' => Input::number($data, 'percentual_ater_padrao'),
            'observacoes' => Input::string($data, 'observacoes'),
        ];
        $errors = [];

        if (mb_strlen($values['codigo']) < 2) $errors['codigo'] = 'Código é obrigatório.';
        if (mb_strlen($values['nome']) < 3) $errors['nome'] = 'Nome é obrigatório.';
        if ($values['teto_financiamento'] <= 0) $errors['teto'] = 'Teto deve ser positivo.';
        if ($values['taxa_juros_anual'] < 0) $errors['taxa'] = 'Taxa de juros não pode ser negativa.';
        if ($values['prazo_max_anos'] < 1) $errors['prazo'] = 'Prazo deve ser positivo.';
        if ($values['carencia_max_anos'] < 0) $errors['carencia'] = 'Carência não pode ser negativa.';
        if ($values['carencia_max_anos'] >= $values['prazo_max_anos']) {
            $errors['carencia'] = 'Carência deve ser menor que o prazo máximo.';
        }
        if ($values['percentual_financiavel_max'] <= 0 || $values['percentual_financiavel_max'] > 100) {
            $errors['percentual'] = 'Percentual financiável deve estar entre 0 e 100.';
        }
        if ($values['percentual_ater_padrao'] < 0 || $values['percentual_ater_padrao'] > 10) {
            $errors['ater'] = 'Percentual ATER deve estar entre 0 e 10.';
        }
        if ($errors !== []) throw new ValidationException($errors);

        try {
            if ($id > 0) {
                $statement = $this->pdo->prepare(
                    'UPDATE credit_lines SET codigo=:codigo, nome=:nome, ativo=:ativo,
                     teto_financiamento=:teto_financiamento, taxa_juros_anual=:taxa_juros_anual,
                     prazo_max_anos=:prazo_max_anos, carencia_max_anos=:carencia_max_anos,
                     percentual_financiavel_max=:percentual_financiavel_max,
                     percentual_ater_padrao=:percentual_ater_padrao, observacoes=:observacoes,
                     updated_at=CURRENT_TIMESTAMP WHERE id=:id'
                );
                $statement->execute([...$values, 'id' => $id]);
                $this->audit->record('credit_line.updated', 'CreditLine', $id);

                return $id;
            }

            $columns = array_keys($values);
            $statement = $this->pdo->prepare(
                'INSERT INTO credit_lines (' . implode(', ', $columns) . ')
                 VALUES (:' . implode(', :', $columns) . ')'
            );
            $statement->execute($values);
        } catch (\PDOException $exception) {
            throw new ValidationException(['codigo' => 'Já existe uma linha com este código.']);
        }

        $id = (int) $this->pdo->lastInsertId();
        $this->audit->record('credit_line.created', 'CreditLine', $id);

        return $id;
    }
}
