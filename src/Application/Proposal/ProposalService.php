<?php

declare(strict_types=1);

namespace Funderr\Application\Proposal;

use Funderr\Application\Audit\AuditService;
use Funderr\Application\Exception\ValidationException;
use Funderr\Application\Support\Input;
use PDO;

final class ProposalService
{
    private const UNITS = ['UNIDADE', 'HECTARE', 'METRO_QUADRADO', 'QUILOGRAMA', 'TONELADA', 'LITRO', 'CABECA', 'MES', 'ANO'];
    private const USE_SOURCE_CATEGORIES = ['INVESTIMENTO_FIXO', 'INVESTIMENTO_SEMIFIXO', 'CUSTEIO', 'CAPITAL_PROPRIO', 'FINANCIAMENTO', 'OUTRAS_FONTES'];
    private const STATUSES = [
        'EM ELABORAÇÃO' => ['EM ANÁLISE'],
        'EM ANÁLISE' => ['EM ELABORAÇÃO', 'APROVADO', 'RECUSADO'],
        'APROVADO' => ['EM ANÁLISE', 'CONCLUÍDO'],
        'RECUSADO' => ['EM ELABORAÇÃO', 'EM ANÁLISE'],
        'CONCLUÍDO' => ['EM ANÁLISE'],
    ];

    public function __construct(
        private readonly PDO $pdo,
        private readonly AuditService $audit,
    ) {
    }

    public function list(): array
    {
        $rows = $this->pdo->query(
            'SELECT p.*, b.nome AS beneficiary_nome, b.cpf AS beneficiary_cpf,
                    b.telefone AS beneficiary_telefone, pr.denominacao AS property_denominacao,
                    pr.municipio AS property_municipio, pr.endereco AS property_endereco,
                    pr.area_total AS property_area_total
             FROM proposals p
             JOIN beneficiaries b ON b.id = p.beneficiary_id
             JOIN properties pr ON pr.id = p.property_id
             ORDER BY p.id DESC'
        )->fetchAll();

        return array_map(function (array $proposal): array {
            $proposal['percentual_global'] = $this->completion($proposal)['global'];

            return $proposal;
        }, $rows);
    }

    public function find(int $id): ?array
    {
        $statement = $this->pdo->prepare(
            'SELECT p.*, b.nome AS beneficiary_nome, b.cpf AS beneficiary_cpf,
                    b.telefone AS beneficiary_telefone, pr.denominacao AS property_denominacao,
                    pr.municipio AS property_municipio, pr.endereco AS property_endereco,
                    pr.area_total AS property_area_total
             FROM proposals p
             JOIN beneficiaries b ON b.id = p.beneficiary_id
             JOIN properties pr ON pr.id = p.property_id
             WHERE p.id = :id'
        );
        $statement->execute(['id' => $id]);
        $proposal = $statement->fetch();

        if ($proposal === false) {
            return null;
        }

        $proposal['patrimony_items'] = $this->children('patrimony_items', $id);
        $proposal['patrimony_debts'] = $this->children('patrimony_debts', $id);
        $proposal['patrimony_totals'] = $this->patrimonyTotals($proposal);
        $proposal['identification'] = $this->one('identifications', $id);
        $proposal['jobs'] = $this->children('proposal_jobs', $id);
        $proposal['use_sources'] = $this->children('proposal_use_sources', $id);
        $proposal['cash_flow_items'] = $this->children('cash_flow_items', $id);
        $proposal['cash_flow'] = $this->cashFlowConsolidation($proposal['cash_flow_items']);
        $proposal['financing'] = $this->financing($id, $proposal['cash_flow']['saldo_operacional']);
        $proposal['guarantees'] = $this->children('guarantees', $id);
        $proposal['documents'] = $this->children('documents', $id);
        $proposal['history'] = $this->children('proposal_status_history', $id, 'changed_at DESC');
        $proposal['completion'] = $this->completion($proposal);

        return $proposal;
    }

    public function create(array $data): int
    {
        $beneficiaryId = Input::int($data, 'beneficiary_id');
        $propertyId = Input::int($data, 'property_id');
        $date = Input::string($data, 'data');
        $activity = Input::string($data, 'atividade');
        $this->validateRelationship($beneficiaryId, $propertyId);

        $parsedDate = \DateTimeImmutable::createFromFormat('!Y-m-d', $date);
        $year = (int) substr($date, 0, 4);
        if ($parsedDate === false || $parsedDate->format('Y-m-d') !== $date
            || $year < 2000 || $year > 2200 || mb_strlen($activity) < 2) {
            throw new ValidationException(['data' => 'Data do processo inválida.']);
        }
        $statement = $this->pdo->prepare(
            'SELECT COUNT(*) FROM proposals WHERE numero LIKE :prefix'
        );
        $statement->execute(['prefix' => $year . '-%']);
        $number = sprintf('%d-%04d', $year, (int) $statement->fetchColumn() + 1);
        $statement = $this->pdo->prepare(
            'INSERT INTO proposals (numero, beneficiary_id, property_id, data, atividade)
             VALUES (:numero, :beneficiary_id, :property_id, :data, :atividade)'
        );
        $statement->execute([
            'numero' => $number,
            'beneficiary_id' => $beneficiaryId,
            'property_id' => $propertyId,
            'data' => $date,
            'atividade' => $activity,
        ]);
        $id = (int) $this->pdo->lastInsertId();
        $this->audit->record('proposal.created', 'Proposal', $id, ['numero' => $number]);

        return $id;
    }

    public function updateGeneral(int $id, array $data): void
    {
        $proposal = $this->requireProposal($id);
        $beneficiaryId = Input::int($data, 'beneficiary_id');
        $propertyId = Input::int($data, 'property_id');
        $date = Input::string($data, 'data');
        $activity = Input::string($data, 'atividade');
        $this->validateRelationship($beneficiaryId, $propertyId);
        $parsedDate = \DateTimeImmutable::createFromFormat('!Y-m-d', $date);
        if ($parsedDate === false || $parsedDate->format('Y-m-d') !== $date || mb_strlen($activity) < 2) {
            throw new ValidationException(['proposal' => 'Data e atividade são obrigatórias.']);
        }

        $statement = $this->pdo->prepare(
            'UPDATE proposals SET beneficiary_id=:beneficiary_id, property_id=:property_id,
             data=:data, atividade=:atividade, updated_at=CURRENT_TIMESTAMP WHERE id=:id'
        );
        $statement->execute([
            'beneficiary_id' => $beneficiaryId, 'property_id' => $propertyId,
            'data' => $date, 'atividade' => $activity, 'id' => $id,
        ]);
        if (in_array($proposal['status'], ['APROVADO', 'CONCLUÍDO'], true)) {
            $this->changeStatus($id, [
                'status' => 'EM ANÁLISE',
                'motivo' => 'Dados gerais alterados; nova análise necessária.',
            ]);
        }
        $this->audit->record('proposal.updated', 'Proposal', $id);
    }

    public function changeStatus(int $id, array $data): void
    {
        $proposal = $this->requireProposal($id);
        $next = Input::string($data, 'status');
        $reason = Input::string($data, 'motivo');
        $allowed = self::STATUSES[$proposal['status']] ?? [];

        if (!in_array($next, $allowed, true)) {
            throw new ValidationException([
                'status' => "Transição de {$proposal['status']} para {$next} não permitida.",
            ]);
        }
        if (($next === 'RECUSADO' || $proposal['status'] === 'CONCLUÍDO') && $reason === '') {
            throw new ValidationException(['motivo' => 'Informe o motivo da transição.']);
        }
        if ($next === 'CONCLUÍDO') {
            $detail = $this->find($id);
            $pending = array_keys(array_filter(
                $detail['completion']['stages'],
                static fn(array $stage): bool => $stage['status'] !== 'CONCLUIDO',
            ));
            if ($pending !== []) {
                throw new ValidationException([
                    'status' => 'Etapas pendentes: ' . implode(', ', $pending) . '.',
                ]);
            }
        }

        $this->pdo->beginTransaction();
        try {
            $statement = $this->pdo->prepare(
                'UPDATE proposals SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :id'
            );
            $statement->execute(['status' => $next, 'id' => $id]);
            $statement = $this->pdo->prepare(
                'INSERT INTO proposal_status_history
                 (proposal_id, status_anterior, status_novo, motivo)
                 VALUES (:proposal_id, :previous, :next, :reason)'
            );
            $statement->execute([
                'proposal_id' => $id,
                'previous' => $proposal['status'],
                'next' => $next,
                'reason' => $reason,
            ]);
            $this->audit->record('proposal.status_changed', 'Proposal', $id, [
                'anterior' => $proposal['status'], 'novo' => $next, 'motivo' => $reason,
            ]);
            $this->pdo->commit();
        } catch (\Throwable $throwable) {
            $this->pdo->rollBack();
            throw $throwable;
        }
    }

    public function addPatrimonyItem(int $proposalId, array $data): void
    {
        $this->requireProposal($proposalId);
        $category = Input::string($data, 'categoria');
        $description = Input::string($data, 'especificacao');
        $unit = $this->normalizeUnit(Input::string($data, 'unidade'));
        $quantity = Input::number($data, 'quantidade');
        $unitValue = Input::number($data, 'valor_unitario');

        $categories = ['TERRA_COBERTURAS', 'CONSTRUCOES_CIVIS', 'ESTRUTURA_AGROPECUARIA',
            'INFRAESTRUTURA', 'MAQUINAS_EQUIPAMENTOS', 'SEMOVENTES', 'OUTROS_BENS_URBANOS'];
        if (!in_array($category, $categories, true) || mb_strlen($description) < 2
            || !in_array($unit, self::UNITS, true) || $quantity <= 0 || $unitValue <= 0) {
            throw new ValidationException(['item' => 'Preencha categoria, especificação, unidade, quantidade e valor positivos.']);
        }
        $statement = $this->pdo->prepare(
            'INSERT INTO patrimony_items
             (proposal_id, categoria, especificacao, unidade, quantidade, valor_unitario, valor_total)
             VALUES (:proposal_id, :categoria, :especificacao, :unidade, :quantidade, :valor_unitario, :valor_total)'
        );
        $statement->execute([
            'proposal_id' => $proposalId, 'categoria' => $category,
            'especificacao' => $description, 'unidade' => $unit, 'quantidade' => $quantity,
            'valor_unitario' => $unitValue, 'valor_total' => round($quantity * $unitValue, 2),
        ]);
        $itemId = (int) $this->pdo->lastInsertId();
        $this->invalidateFrom($proposalId, 'patrimonio');
        $this->audit->record('patrimony.item_added', 'PatrimonyItem', $itemId);
    }

    public function addDebt(int $proposalId, array $data): void
    {
        $this->requireProposal($proposalId);
        $creditor = Input::string($data, 'credor');
        $purpose = Input::string($data, 'finalidade');
        $due = Input::string($data, 'vencimento');
        $balance = Input::number($data, 'saldo_devedor');
        if (mb_strlen($creditor) < 2 || mb_strlen($purpose) < 2 || $due === '' || $balance <= 0) {
            throw new ValidationException(['debt' => 'Preencha todos os dados da dívida com saldo positivo.']);
        }
        $statement = $this->pdo->prepare(
            'INSERT INTO patrimony_debts
             (proposal_id, credor, finalidade, vencimento, saldo_devedor)
             VALUES (:proposal_id, :credor, :finalidade, :vencimento, :saldo)'
        );
        $statement->execute([
            'proposal_id' => $proposalId, 'credor' => $creditor,
            'finalidade' => $purpose, 'vencimento' => $due, 'saldo' => round($balance, 2),
        ]);
        $debtId = (int) $this->pdo->lastInsertId();
        $this->invalidateFrom($proposalId, 'patrimonio');
        $this->audit->record('patrimony.debt_added', 'PatrimonyDebt', $debtId);
    }

    public function removeChild(int $proposalId, string $kind, int $childId): void
    {
        $map = [
            'patrimony-item' => ['patrimony_items', 'patrimony'],
            'debt' => ['patrimony_debts', 'patrimonio'],
            'use-source' => ['proposal_use_sources', 'identificacao'],
            'cash-flow-item' => ['cash_flow_items', 'fluxo'],
            'guarantee' => ['guarantees', 'financiamento'],
        ];
        if (!isset($map[$kind])) throw new ValidationException(['item' => 'Tipo de item inválido.']);
        [$table, $stage] = $map[$kind];
        $statement = $this->pdo->prepare(
            "DELETE FROM {$table} WHERE id = :id AND proposal_id = :proposal_id"
        );
        $statement->execute(['id' => $childId, 'proposal_id' => $proposalId]);
        if ($statement->rowCount() === 0) throw new ValidationException(['item' => 'Item não encontrado.']);
        $this->invalidateFrom($proposalId, $stage);
        $this->audit->record($kind . '.deleted', $table, $childId);
    }

    public function confirmPatrimonyDebts(int $id, bool $confirmed): void
    {
        $this->setProposalFields($id, [
            'patrimonio_dividas_confirmadas' => $confirmed ? 1 : 0,
            'patrimonio_status' => 'RASCUNHO',
        ]);
        $this->invalidateAfter($id, 'patrimonio');
        $this->audit->record('patrimony.debts_confirmation', 'Proposal', $id, ['confirmed' => $confirmed]);
    }

    public function completePatrimony(int $id): void
    {
        $proposal = $this->requireProposal($id);
        if ($this->countChildren('patrimony_items', $id) === 0) {
            throw new ValidationException(['patrimony' => 'Informe ao menos um item patrimonial.']);
        }
        if (!(bool) $proposal['patrimonio_dividas_confirmadas']) {
            throw new ValidationException(['patrimony' => 'Confirme a revisão das dívidas.']);
        }
        $this->setProposalFields($id, ['patrimonio_status' => 'CONCLUIDO']);
        $this->audit->record('patrimony.completed', 'Proposal', $id);
    }

    public function saveIdentification(int $id, array $data): void
    {
        $proposal = $this->requireProposal($id);
        if ($proposal['patrimonio_status'] !== 'CONCLUIDO') {
            throw new ValidationException(['identification' => 'Conclua o patrimônio antes da identificação.']);
        }
        $values = [
            'proposal_id' => $id,
            'finalidade' => Input::string($data, 'finalidade'),
            'mercado' => Input::string($data, 'mercado'),
            'faturamento' => Input::number($data, 'faturamento_ultimo_ano'),
            'localizacao' => Input::string($data, 'analise_localizacao'),
            'consideracoes' => Input::string($data, 'consideracoes'),
            'empregos' => Input::bool($data, 'empregos_confirmados') ? 1 : 0,
            'usos' => Input::bool($data, 'usos_fontes_confirmados') ? 1 : 0,
        ];
        $statement = $this->pdo->prepare(
            "INSERT INTO identifications
             (proposal_id, finalidade, mercado, faturamento_ultimo_ano, analise_localizacao,
              consideracoes, empregos_confirmados, usos_fontes_confirmados, status)
             VALUES (:proposal_id, :finalidade, :mercado, :faturamento, :localizacao,
                     :consideracoes, :empregos, :usos, 'RASCUNHO')
             ON CONFLICT(proposal_id) DO UPDATE SET
              finalidade=excluded.finalidade, mercado=excluded.mercado,
              faturamento_ultimo_ano=excluded.faturamento_ultimo_ano,
              analise_localizacao=excluded.analise_localizacao, consideracoes=excluded.consideracoes,
              empregos_confirmados=excluded.empregos_confirmados,
              usos_fontes_confirmados=excluded.usos_fontes_confirmados,
              status='RASCUNHO', updated_at=CURRENT_TIMESTAMP"
        );
        $statement->execute($values);

        foreach (['ADMINISTRATIVOS', 'TECNICOS', 'PRODUTIVOS', 'OUTROS'] as $category) {
            $statement = $this->pdo->prepare(
                'INSERT INTO proposal_jobs (proposal_id, categoria, fase_atual, fase_expansao)
                 VALUES (:proposal_id, :categoria, :atual, :expansao)
                 ON CONFLICT(proposal_id, categoria) DO UPDATE SET
                 fase_atual=excluded.fase_atual, fase_expansao=excluded.fase_expansao'
            );
            $statement->execute([
                'proposal_id' => $id, 'categoria' => $category,
                'atual' => max(0, Input::int($data, 'job_' . $category . '_atual')),
                'expansao' => max(0, Input::int($data, 'job_' . $category . '_expansao')),
            ]);
        }
        $this->setProposalFields($id, ['identificacao_status' => 'RASCUNHO']);
        $this->invalidateAfter($id, 'identificacao');
        $this->audit->record('identification.saved', 'Identification', $id);
    }

    public function addUseSource(int $id, array $data): void
    {
        $type = Input::string($data, 'tipo');
        $category = $this->normalizeUseSourceCategory(Input::string($data, 'categoria'));
        if (!in_array($type, ['USO', 'FONTE'], true) || !in_array($category, self::USE_SOURCE_CATEGORIES, true)) {
            throw new ValidationException(['useSource' => 'Tipo e categoria de uso/fonte são obrigatórios.']);
        }
        $statement = $this->pdo->prepare(
            'INSERT INTO proposal_use_sources (proposal_id, tipo, categoria, realizado, a_realizar)
             VALUES (:proposal_id, :tipo, :categoria, :realizado, :a_realizar)'
        );
        $statement->execute([
            'proposal_id' => $id, 'tipo' => $type, 'categoria' => $category,
            'realizado' => Input::number($data, 'realizado'),
            'a_realizar' => Input::number($data, 'a_realizar'),
        ]);
        $this->setProposalFields($id, ['identificacao_status' => 'RASCUNHO']);
        $this->invalidateAfter($id, 'identificacao');
    }

    public function completeIdentification(int $id): void
    {
        $identification = $this->one('identifications', $id);
        $pending = [];
        if ($identification === null || $identification['finalidade'] === '') $pending[] = 'finalidade';
        if ($identification === null || $identification['mercado'] === '') $pending[] = 'mercado';
        if ($identification === null || $identification['analise_localizacao'] === '') $pending[] = 'análise de localização';
        if ($identification === null || $identification['consideracoes'] === '') $pending[] = 'considerações técnicas';
        if ($identification === null || !(bool) $identification['empregos_confirmados']) $pending[] = 'empregos';
        if ($identification === null || !(bool) $identification['usos_fontes_confirmados']) $pending[] = 'usos e fontes';
        if ($this->countChildren('proposal_jobs', $id) !== 4) $pending[] = 'quatro categorias de empregos';
        $useSources = $this->children('proposal_use_sources', $id);
        $uses = $sources = 0.0;
        foreach ($useSources as $item) {
            $total = (float) $item['realizado'] + (float) $item['a_realizar'];
            if ($item['tipo'] === 'USO') $uses += $total;
            else $sources += $total;
        }
        if ($uses <= 0) $pending[] = 'ao menos um uso positivo';
        if ($sources <= 0) $pending[] = 'ao menos uma fonte positiva';
        if (abs($uses - $sources) >= 0.01) $pending[] = 'equilíbrio entre usos e fontes';
        if ($pending !== []) {
            throw new ValidationException(['identification' => 'Pendências: ' . implode(', ', $pending) . '.']);
        }
        $this->pdo->prepare("UPDATE identifications SET status='CONCLUIDO', updated_at=CURRENT_TIMESTAMP WHERE proposal_id=:id")
            ->execute(['id' => $id]);
        $this->setProposalFields($id, ['identificacao_status' => 'CONCLUIDO']);
        $this->audit->record('identification.completed', 'Identification', $id);
    }

    public function addCashFlowItem(int $id, array $data): void
    {
        $proposal = $this->requireProposal($id);
        if ($proposal['identificacao_status'] !== 'CONCLUIDO') {
            throw new ValidationException(['cashflow' => 'Conclua a identificação antes do fluxo de caixa.']);
        }
        $type = Input::string($data, 'tipo');
        $description = Input::string($data, 'descricao');
        $unit = $this->normalizeUnit(Input::string($data, 'unidade'));
        $quantity = Input::number($data, 'quantidade');
        $unitValue = Input::number($data, 'valor_unitario');
        if (!in_array($type, ['RECEITA', 'CUSTO_VARIAVEL', 'CUSTO_FIXO'], true)
            || mb_strlen($description) < 2 || !in_array($unit, self::UNITS, true) || $quantity <= 0 || $unitValue <= 0) {
            throw new ValidationException(['cashflow' => 'Preencha corretamente o item do fluxo de caixa.']);
        }
        $values = [
            'proposal_id' => $id, 'tipo' => $type, 'descricao' => $description,
            'unidade' => $unit, 'quantidade' => $quantity, 'valor_unitario' => $unitValue,
            'ano1' => round($quantity * $unitValue, 2),
        ];
        for ($year = 2; $year <= 7; $year++) {
            $values['ano' . $year] = round(Input::number($data, 'ano' . $year), 2);
            if ($values['ano' . $year] < 0) {
                throw new ValidationException(['cashflow' => "O valor do ano {$year} não pode ser negativo."]);
            }
        }
        $statement = $this->pdo->prepare(
            'INSERT INTO cash_flow_items
             (proposal_id, tipo, descricao, unidade, quantidade, valor_unitario,
              ano1, ano2, ano3, ano4, ano5, ano6, ano7)
             VALUES (:proposal_id, :tipo, :descricao, :unidade, :quantidade, :valor_unitario,
                     :ano1, :ano2, :ano3, :ano4, :ano5, :ano6, :ano7)'
        );
        $statement->execute($values);
        $this->invalidateFrom($id, 'fluxo');
        $this->audit->record('cashflow.item_added', 'CashFlowItem', (int) $this->pdo->lastInsertId());
    }

    public function confirmCashFlow(int $id, bool $confirmed): void
    {
        if ($confirmed) {
            $types = array_column($this->children('cash_flow_items', $id), 'tipo');
            if (!in_array('RECEITA', $types, true)
                || (!in_array('CUSTO_VARIAVEL', $types, true) && !in_array('CUSTO_FIXO', $types, true))) {
                throw new ValidationException(['cashflow' => 'Inclua ao menos uma receita e um custo.']);
            }
        }
        $this->setProposalFields($id, [
            'fluxo_projecao_confirmada' => $confirmed ? 1 : 0,
            'fluxo_status' => 'RASCUNHO',
        ]);
        $this->invalidateAfter($id, 'fluxo');
    }

    public function completeCashFlow(int $id): void
    {
        $proposal = $this->requireProposal($id);
        if ($proposal['identificacao_status'] !== 'CONCLUIDO' || !(bool) $proposal['fluxo_projecao_confirmada']) {
            throw new ValidationException(['cashflow' => 'Conclua a identificação e confirme a projeção.']);
        }
        $this->setProposalFields($id, ['fluxo_status' => 'CONCLUIDO']);
        $this->audit->record('cashflow.completed', 'Proposal', $id);
    }

    public function saveFinancing(int $id, array $data): void
    {
        $proposal = $this->requireProposal($id);
        if ($proposal['fluxo_status'] !== 'CONCLUIDO') {
            throw new ValidationException(['financing' => 'Conclua o fluxo de caixa antes do financiamento.']);
        }
        $lineId = Input::int($data, 'credit_line_id');
        $lineStatement = $this->pdo->prepare('SELECT * FROM credit_lines WHERE id=:id AND ativo=1');
        $lineStatement->execute(['id' => $lineId]);
        $line = $lineStatement->fetch();
        if ($line === false) throw new ValidationException(['line' => 'Linha de crédito inválida.']);

        $proposalValue = Input::number($data, 'valor_proposta');
        $financedPercent = Input::number($data, 'percentual_financiavel');
        $aterPercent = Input::number($data, 'percentual_ater');
        $interest = Input::number($data, 'taxa_juros_anual');
        $term = Input::int($data, 'prazo_total_anos');
        $grace = Input::int($data, 'carencia_anos');
        if ($proposalValue <= 0 || $proposalValue > (float) $line['teto_financiamento']) {
            throw new ValidationException(['value' => 'Valor inválido ou acima do teto da linha.']);
        }
        if ($financedPercent <= 0 || $financedPercent > (float) $line['percentual_financiavel_max']) {
            throw new ValidationException(['percent' => 'Percentual financiável acima do limite.']);
        }
        if ($aterPercent < 0 || $aterPercent > 10 || $interest < 0) {
            throw new ValidationException(['rates' => 'Percentual ATER ou taxa de juros inválidos.']);
        }
        if ($term < 1 || $term > (int) $line['prazo_max_anos'] || $grace < 0
            || $grace > (int) $line['carencia_max_anos'] || $grace >= $term) {
            throw new ValidationException(['term' => 'Prazo ou carência fora dos limites da linha.']);
        }
        $values = [
            'proposal_id' => $id, 'credit_line_id' => $lineId,
            'valor_proposta' => $proposalValue, 'percentual_financiavel' => $financedPercent,
            'valor_financiado' => round($proposalValue * $financedPercent / 100, 2),
            'percentual_ater' => $aterPercent,
            'valor_ater' => round($proposalValue * $aterPercent / 100, 2),
            'taxa' => $interest, 'prazo' => $term, 'carencia' => $grace,
            'juros_carencia' => Input::string($data, 'juros_carencia') === 'CAPITALIZAR' ? 'CAPITALIZAR' : 'PAGAR',
        ];
        $values['valor_projeto'] = $values['valor_financiado'] + $values['valor_ater'];
        $statement = $this->pdo->prepare(
            "INSERT INTO financing_scenarios
             (proposal_id, credit_line_id, valor_proposta, percentual_financiavel, valor_financiado,
              percentual_ater, valor_ater, valor_projeto, taxa_juros_anual, prazo_total_anos,
              carencia_anos, juros_carencia, status)
             VALUES (:proposal_id, :credit_line_id, :valor_proposta, :percentual_financiavel,
                     :valor_financiado, :percentual_ater, :valor_ater, :valor_projeto, :taxa,
                     :prazo, :carencia, :juros_carencia, 'RASCUNHO')
             ON CONFLICT(proposal_id) DO UPDATE SET credit_line_id=excluded.credit_line_id,
              valor_proposta=excluded.valor_proposta, percentual_financiavel=excluded.percentual_financiavel,
              valor_financiado=excluded.valor_financiado, percentual_ater=excluded.percentual_ater,
              valor_ater=excluded.valor_ater, valor_projeto=excluded.valor_projeto,
              taxa_juros_anual=excluded.taxa_juros_anual, prazo_total_anos=excluded.prazo_total_anos,
              carencia_anos=excluded.carencia_anos, juros_carencia=excluded.juros_carencia,
              garantias_confirmadas=0, cronograma_confirmado=0, status='RASCUNHO',
              updated_at=CURRENT_TIMESTAMP"
        );
        $statement->execute($values);
        $this->setProposalFields($id, ['financiamento_status' => 'RASCUNHO']);
        $this->audit->record('financing.saved', 'FinancingScenario', $id);
    }

    public function addGuarantee(int $id, array $data): void
    {
        if ($this->one('financing_scenarios', $id) === null) {
            throw new ValidationException(['guarantee' => 'Salve o financiamento antes das garantias.']);
        }
        $type = Input::string($data, 'tipo');
        $description = Input::string($data, 'descricao');
        $guarantorName = Input::string($data, 'garantidor_nome');
        $guarantorCpf = Input::digits($data, 'garantidor_cpf');
        $guarantorPhone = Input::digits($data, 'garantidor_telefone');
        $estimatedValue = Input::string($data, 'valor_estimado') === '' ? null : Input::number($data, 'valor_estimado');
        if (!in_array($type, ['AVAL_PESSOAL', 'BEM', 'OUTRA'], true) || mb_strlen($description) < 2) {
            throw new ValidationException(['guarantee' => 'Tipo e descrição da garantia são obrigatórios.']);
        }
        if ($type === 'AVAL_PESSOAL'
            && ($guarantorName === '' || !Input::validCpf($guarantorCpf)
                || strlen($guarantorPhone) < 10 || strlen($guarantorPhone) > 11)) {
            throw new ValidationException(['guarantee' => 'Aval pessoal exige nome, CPF e telefone válidos.']);
        }
        if ($type === 'BEM' && ($estimatedValue === null || $estimatedValue <= 0)) {
            throw new ValidationException(['guarantee' => 'Informe o valor estimado do bem.']);
        }
        $statement = $this->pdo->prepare(
            'INSERT INTO guarantees
             (proposal_id, tipo, descricao, garantidor_nome, garantidor_cpf,
              garantidor_telefone, valor_estimado)
             VALUES (:proposal_id, :tipo, :descricao, :nome, :cpf, :telefone, :valor)'
        );
        $statement->execute([
            'proposal_id' => $id, 'tipo' => $type, 'descricao' => $description,
            'nome' => $guarantorName ?: null,
            'cpf' => $guarantorCpf ?: null,
            'telefone' => $guarantorPhone ?: null,
            'valor' => $estimatedValue,
        ]);
        $this->pdo->prepare(
            "UPDATE financing_scenarios SET garantias_confirmadas=0, status='RASCUNHO' WHERE proposal_id=:id"
        )->execute(['id' => $id]);
        $this->setProposalFields($id, ['financiamento_status' => 'RASCUNHO']);
    }

    public function confirmFinancing(int $id, string $field, bool $confirmed): void
    {
        if (!in_array($field, ['garantias_confirmadas', 'cronograma_confirmado'], true)) {
            throw new ValidationException(['confirmation' => 'Confirmação inválida.']);
        }
        $statement = $this->pdo->prepare(
            "UPDATE financing_scenarios SET {$field}=:confirmed, status='RASCUNHO',
             updated_at=CURRENT_TIMESTAMP WHERE proposal_id=:id"
        );
        $statement->execute(['confirmed' => $confirmed ? 1 : 0, 'id' => $id]);
        if ($statement->rowCount() === 0) throw new ValidationException(['financing' => 'Financiamento não configurado.']);
        $this->setProposalFields($id, ['financiamento_status' => 'RASCUNHO']);
    }

    public function completeFinancing(int $id): void
    {
        $proposal = $this->requireProposal($id);
        $financing = $this->one('financing_scenarios', $id);
        if ($proposal['fluxo_status'] !== 'CONCLUIDO' || $financing === null
            || !(bool) $financing['garantias_confirmadas'] || !(bool) $financing['cronograma_confirmado']) {
            throw new ValidationException(['financing' => 'Conclua o fluxo e confirme garantias e cronograma.']);
        }
        $this->pdo->prepare("UPDATE financing_scenarios SET status='CONCLUIDO' WHERE proposal_id=:id")
            ->execute(['id' => $id]);
        $this->setProposalFields($id, ['financiamento_status' => 'CONCLUIDO']);
        $this->audit->record('financing.completed', 'Proposal', $id);
    }

    private function requireProposal(int $id): array
    {
        $statement = $this->pdo->prepare('SELECT * FROM proposals WHERE id = :id');
        $statement->execute(['id' => $id]);
        $proposal = $statement->fetch();
        if ($proposal === false) throw new ValidationException(['proposal' => 'Processo não encontrado.']);

        return $proposal;
    }

    private function validateRelationship(int $beneficiaryId, int $propertyId): void
    {
        $statement = $this->pdo->prepare(
            'SELECT 1 FROM properties WHERE id=:property_id AND beneficiary_id=:beneficiary_id'
        );
        $statement->execute(['property_id' => $propertyId, 'beneficiary_id' => $beneficiaryId]);
        if ($statement->fetchColumn() === false) {
            throw new ValidationException(['property' => 'A propriedade não pertence ao beneficiário selecionado.']);
        }
    }

    private function children(string $table, int $proposalId, string $order = 'id'): array
    {
        $statement = $this->pdo->prepare(
            "SELECT * FROM {$table} WHERE proposal_id=:proposal_id ORDER BY {$order}"
        );
        $statement->execute(['proposal_id' => $proposalId]);

        return $statement->fetchAll();
    }

    private function one(string $table, int $proposalId): ?array
    {
        $statement = $this->pdo->prepare("SELECT * FROM {$table} WHERE proposal_id=:id LIMIT 1");
        $statement->execute(['id' => $proposalId]);
        $row = $statement->fetch();

        return $row === false ? null : $row;
    }

    private function countChildren(string $table, int $proposalId): int
    {
        $statement = $this->pdo->prepare("SELECT COUNT(*) FROM {$table} WHERE proposal_id=:id");
        $statement->execute(['id' => $proposalId]);

        return (int) $statement->fetchColumn();
    }

    private function setProposalFields(int $id, array $fields): void
    {
        $assignments = [];
        $parameters = ['id' => $id];
        foreach ($fields as $field => $value) {
            $assignments[] = "{$field} = :{$field}";
            $parameters[$field] = $value;
        }
        $this->pdo->prepare(
            'UPDATE proposals SET ' . implode(', ', $assignments) .
            ', updated_at=CURRENT_TIMESTAMP WHERE id=:id'
        )->execute($parameters);
    }

    private function invalidateFrom(int $id, string $stage): void
    {
        $field = [
            'patrimonio' => 'patrimonio_status',
            'identificacao' => 'identificacao_status',
            'fluxo' => 'fluxo_status',
            'financiamento' => 'financiamento_status',
        ][$stage];
        $extra = $stage === 'patrimonio' ? ['patrimonio_dividas_confirmadas' => 0] : [];
        if ($stage === 'fluxo') $extra['fluxo_projecao_confirmada'] = 0;
        $this->setProposalFields($id, [$field => 'RASCUNHO', ...$extra]);
        $this->invalidateAfter($id, $stage);
    }

    private function invalidateAfter(int $id, string $stage): void
    {
        $order = ['patrimonio', 'identificacao', 'fluxo', 'financiamento'];
        $position = array_search($stage, $order, true);
        $fields = [];
        foreach (array_slice($order, $position + 1) as $later) {
            $field = $later . '_status';
            $current = $this->requireProposal($id)[$field];
            if ($current === 'CONCLUIDO') $fields[$field] = 'EM_REVISAO';
        }
        if ($fields !== []) $this->setProposalFields($id, $fields);
    }

    private function patrimonyTotals(array $proposal): array
    {
        $assets = 0.0;
        $urbanAssets = 0.0;
        foreach ($proposal['patrimony_items'] as $item) {
            if ($item['categoria'] === 'OUTROS_BENS_URBANOS') $urbanAssets += (float) $item['valor_total'];
            else $assets += (float) $item['valor_total'];
        }
        $debts = array_sum(array_column($proposal['patrimony_debts'], 'saldo_devedor'));

        return [
            'bens' => round($assets, 2), 'outros_bens_urbanos' => round($urbanAssets, 2),
            'dividas' => round($debts, 2), 'liquido' => round($assets - $debts, 2),
            'total_informado' => round($assets + $urbanAssets, 2),
        ];
    }

    private function cashFlowConsolidation(array $items): array
    {
        $result = ['receitas' => [], 'custos_variaveis' => [], 'custos_fixos' => [], 'saldo_operacional' => []];
        $result['despesas_totais'] = [];
        $result['saldo_acumulado'] = [];
        $accumulated = 0.0;
        for ($year = 1; $year <= 7; $year++) {
            $column = 'ano' . $year;
            $revenue = $variable = $fixed = 0.0;
            foreach ($items as $item) {
                if ($item['tipo'] === 'RECEITA') $revenue += (float) $item[$column];
                elseif ($item['tipo'] === 'CUSTO_VARIAVEL') $variable += (float) $item[$column];
                else $fixed += (float) $item[$column];
            }
            $result['receitas'][] = round($revenue, 2);
            $result['custos_variaveis'][] = round($variable, 2);
            $result['custos_fixos'][] = round($fixed, 2);
            $expenses = round($variable + $fixed, 2);
            $operating = round($revenue - $expenses, 2);
            $accumulated = round($accumulated + $operating, 2);
            $result['despesas_totais'][] = $expenses;
            $result['saldo_operacional'][] = $operating;
            $result['saldo_acumulado'][] = $accumulated;
        }

        return $result;
    }

    private function financing(int $proposalId, array $operatingBalance): ?array
    {
        $statement = $this->pdo->prepare(
            'SELECT f.*, c.nome AS credit_line_name FROM financing_scenarios f
             JOIN credit_lines c ON c.id=f.credit_line_id WHERE f.proposal_id=:id'
        );
        $statement->execute(['id' => $proposalId]);
        $financing = $statement->fetch();
        if ($financing === false) return null;

        $balance = (float) $financing['valor_financiado'];
        $rate = (float) $financing['taxa_juros_anual'] / 100;
        $term = (int) $financing['prazo_total_anos'];
        $grace = (int) $financing['carencia_anos'];
        $installments = max(1, $term - $grace);
        $schedule = [];
        $capacityAlerts = [];

        for ($year = 1; $year <= $term; $year++) {
            $initial = $balance;
            $interest = round($initial * $rate, 2);
            if ($year === $grace + 1) {
                $amortization = round($balance / $installments, 2);
            }
            $principal = $year <= $grace
                ? 0.0
                : ($year === $term ? $initial : min($amortization, $initial));
            if ($year <= $grace && $financing['juros_carencia'] === 'CAPITALIZAR') {
                $balance += $interest;
                $payment = 0.0;
            } else {
                $payment = $interest + $principal;
                $balance -= $principal;
            }
            $schedule[] = [
                'ano' => $year, 'saldo_inicial' => round($initial, 2), 'juros' => $interest,
                'amortizacao' => round($principal, 2), 'prestacao' => round($payment, 2),
                'saldo_final' => round(max(0, $balance), 2),
                'saldo_operacional' => $operatingBalance[$year - 1] ?? 0,
            ];
            $operating = $operatingBalance[$year - 1] ?? null;
            if ($operating !== null && $payment > $operating) {
                $capacityAlerts[] = [
                    'ano' => $year, 'prestacao' => round($payment, 2),
                    'saldo_operacional' => $operating,
                ];
            }
        }
        $financing['schedule'] = $schedule;
        $financing['capacity_alerts'] = $capacityAlerts;
        $financing['capacidade_insuficiente'] = $capacityAlerts !== [];

        return $financing;
    }

    private function completion(array $proposal): array
    {
        $beneficiaryPercent = $this->beneficiaryCompleteness((int) $proposal['beneficiary_id']);
        $propertyPercent = $this->propertyCompleteness((int) $proposal['property_id']);
        $documents = $proposal['documents'] ?? $this->children('documents', (int) $proposal['id']);
        $confirmedDocuments = count(array_filter($documents, fn(array $doc): bool => $doc['status'] === 'CONFIRMED'));
        $documentDone = $documents !== [] && $confirmedDocuments === count($documents);
        $documentPercent = $documents === [] ? 0 : (int) round($confirmedDocuments / count($documents) * 100);
        $stages = [
            'dados gerais' => ['status' => 'CONCLUIDO', 'percent' => 100],
            'beneficiário' => ['status' => $this->completionStatus($beneficiaryPercent), 'percent' => $beneficiaryPercent],
            'propriedade' => ['status' => $this->completionStatus($propertyPercent), 'percent' => $propertyPercent],
            'patrimônio' => ['status' => $proposal['patrimonio_status'], 'percent' => $proposal['patrimonio_status'] === 'CONCLUIDO' ? 100 : ($this->countChildren('patrimony_items', (int) $proposal['id']) > 0 ? 50 : 0)],
            'identificação' => ['status' => $proposal['identificacao_status'], 'percent' => $proposal['identificacao_status'] === 'CONCLUIDO' ? 100 : ($proposal['identificacao_status'] === 'RASCUNHO' ? 50 : 0)],
            'fluxo de caixa' => ['status' => $proposal['fluxo_status'], 'percent' => $proposal['fluxo_status'] === 'CONCLUIDO' ? 100 : ($this->countChildren('cash_flow_items', (int) $proposal['id']) > 0 ? 50 : 0)],
            'financiamento' => ['status' => $proposal['financiamento_status'], 'percent' => $proposal['financiamento_status'] === 'CONCLUIDO' ? 100 : ($this->one('financing_scenarios', (int) $proposal['id']) !== null ? 50 : 0)],
            'documentos' => ['status' => $documentDone ? 'CONCLUIDO' : ($documents === [] ? 'PENDENTE' : 'RASCUNHO'), 'percent' => $documentPercent],
        ];

        return [
            'stages' => $stages,
            'global' => (int) round(array_sum(array_column($stages, 'percent')) / count($stages)),
        ];
    }

    private function beneficiaryCompleteness(int $id): int
    {
        $statement = $this->pdo->prepare('SELECT * FROM beneficiaries WHERE id=:id');
        $statement->execute(['id' => $id]);
        $beneficiary = $statement->fetch();
        if ($beneficiary === false) return 0;

        $checks = [
            trim((string) $beneficiary['nome']) !== '', Input::validCpf((string) $beneficiary['cpf']),
            trim((string) ($beneficiary['rg'] ?? '')) !== '', trim((string) $beneficiary['telefone']) !== '',
            trim((string) ($beneficiary['endereco'] ?? '')) !== '', trim((string) ($beneficiary['nacionalidade'] ?? '')) !== '',
            trim((string) ($beneficiary['naturalidade'] ?? '')) !== '', ($beneficiary['dataNascimento'] ?? null) !== null,
            ($beneficiary['estadoCivil'] ?? null) !== null, ($beneficiary['escolaridade'] ?? null) !== null,
            trim((string) ($beneficiary['profissao'] ?? '')) !== '', ($beneficiary['dependentes'] ?? null) !== null,
        ];
        $reference = $this->pdo->prepare(
            "SELECT COUNT(*) FROM beneficiary_references WHERE beneficiary_id=:id AND trim(nome)<>'' AND trim(telefone)<>''"
        );
        $reference->execute(['id' => $id]);
        $checks[] = (int) $reference->fetchColumn() > 0;

        if (in_array($beneficiary['estadoCivil'], ['CASADO', 'UNIAO_ESTAVEL'], true)) {
            $checks[] = trim((string) ($beneficiary['conjugeNome'] ?? '')) !== '';
            $checks[] = trim((string) ($beneficiary['conjugeRg'] ?? '')) !== '';
            $checks[] = Input::validCpf((string) ($beneficiary['conjugeCpf'] ?? ''))
                && $beneficiary['conjugeCpf'] !== $beneficiary['cpf'];
        }

        return (int) round(count(array_filter($checks)) / count($checks) * 100);
    }

    private function propertyCompleteness(int $id): int
    {
        $statement = $this->pdo->prepare('SELECT * FROM properties WHERE id=:id');
        $statement->execute(['id' => $id]);
        $property = $statement->fetch();
        if ($property === false) return 0;

        $checks = [
            trim((string) $property['denominacao']) !== '', trim((string) $property['endereco']) !== '',
            in_array($property['municipio'], ['Alto Alegre','Amajari','Boa Vista','Bonfim','Cantá','Caracaraí','Caroebe','Iracema','Mucajaí','Normandia','Pacaraima','Rorainópolis','São João da Baliza','São Luiz','Uiramutã'], true),
            $property['estado'] === 'RR', (float) $property['area_total'] > 0,
            $property['area_disponivel'] !== null && (float) $property['area_disponivel'] >= 0,
            $property['area_legal'] !== null && (float) $property['area_legal'] >= 0,
            trim((string) $property['forma_ocupacao']) !== '', trim((string) ($property['tempo_exploracao'] ?? '')) !== '',
            trim((string) $property['documento_existente']) !== '', trim((string) ($property['confrontacao_norte'] ?? '')) !== '',
            trim((string) ($property['confrontacao_sul'] ?? '')) !== '', trim((string) ($property['confrontacao_leste'] ?? '')) !== '',
            trim((string) ($property['confrontacao_oeste'] ?? '')) !== '', trim((string) ($property['administracao'] ?? '')) !== '',
            $property['latitude'] !== null && $property['longitude'] !== null,
        ];

        return (int) round(count(array_filter($checks)) / count($checks) * 100);
    }

    private function completionStatus(int $percent): string
    {
        return $percent === 100 ? 'CONCLUIDO' : ($percent > 0 ? 'RASCUNHO' : 'PENDENTE');
    }

    private function normalizeUnit(string $unit): string
    {
        return match (mb_strtolower($unit)) {
            'un', 'und', 'unidade' => 'UNIDADE',
            'ha', 'hectare', 'hectares' => 'HECTARE',
            'm²', 'm2', 'metro quadrado' => 'METRO_QUADRADO',
            'kg', 'quilograma' => 'QUILOGRAMA',
            't', 'tonelada' => 'TONELADA',
            'l', 'litro' => 'LITRO',
            'cabeça', 'cabeca' => 'CABECA',
            'mês', 'mes' => 'MES',
            'ano' => 'ANO',
            default => strtoupper($unit),
        };
    }

    private function normalizeUseSourceCategory(string $category): string
    {
        return match (mb_strtolower($category)) {
            'equipamentos', 'investimento fixo' => 'INVESTIMENTO_FIXO',
            'investimento semifixo' => 'INVESTIMENTO_SEMIFIXO',
            'custeio' => 'CUSTEIO',
            'capital próprio', 'capital proprio' => 'CAPITAL_PROPRIO',
            'financiamento' => 'FINANCIAMENTO',
            'outras fontes' => 'OUTRAS_FONTES',
            default => strtoupper($category),
        };
    }
}
