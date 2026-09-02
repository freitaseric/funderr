<?php

declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use Funderr\Application\Beneficiary\BeneficiaryService;
use Funderr\Application\Audit\AuditService;
use Funderr\Application\CreditLine\CreditLineService;
use Funderr\Application\Exception\ValidationException;
use Funderr\Application\Property\PropertyService;
use Funderr\Application\Proposal\ProposalService;
use Funderr\Application\System\SystemService;
use Funderr\Http\Request;
use Funderr\Http\Response;
use Funderr\Http\Router;
use Funderr\Infrastructure\Persistence\SqliteBeneficiaryRepository;

$tests = [];

function test(string $description, callable $test): void
{
    global $tests;
    $tests[$description] = $test;
}

function assertSame(mixed $expected, mixed $actual): void
{
    if ($expected !== $actual) {
        throw new RuntimeException(sprintf(
            "Esperado %s, recebido %s.",
            var_export($expected, true),
            var_export($actual, true),
        ));
    }
}

function assertThrows(string $exceptionClass, callable $callback): void
{
    try {
        $callback();
    } catch (Throwable $throwable) {
        if ($throwable instanceof $exceptionClass) {
            return;
        }

        throw $throwable;
    }

    throw new RuntimeException("Era esperada uma exceção {$exceptionClass}.");
}

function request(string $method, string $uri, array $post = []): Request
{
    return new Request(
        server: [
            'REQUEST_METHOD' => $method,
            'REQUEST_URI' => $uri,
        ],
        post: $post,
    );
}

function repository(): SqliteBeneficiaryRepository
{
    return new SqliteBeneficiaryRepository(database());
}

function database(): PDO
{
    $pdo = new PDO('sqlite::memory:', options: [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    $migrations = glob(dirname(__DIR__) . '/migrations/*.sql');
    if ($migrations === false) {
        throw new RuntimeException('Não foi possível localizar as migrations de teste.');
    }
    sort($migrations);

    foreach ($migrations as $migrationPath) {
        $migration = file_get_contents($migrationPath);
        if ($migration === false) {
            throw new RuntimeException('Não foi possível carregar a migration de teste.');
        }
        $pdo->exec($migration);
    }

    return $pdo;
}

test('router resolve parâmetros, query string e barra final', function (): void {
    $router = new Router();
    $router->get('/beneficiaries/{id}', function (Request $request): Response {
        return Response::text((string) $request->route('id'));
    });

    $response = $router->dispatch(request('GET', '/beneficiaries/42/?tab=data'));

    assertSame(200, $response->status());
    assertSame('42', $response->body());
});

test('preferências e presença são isoladas por dispositivo', function (): void {
    $pdo = database();
    $first = new SystemService($pdo, 'device-token-one');
    $second = new SystemService($pdo, 'device-token-two');

    $first->updatePreferences([
        'device_name' => 'Notebook da análise',
        'new_financing_ui' => 'on',
        'show_presence' => 'on',
    ]);
    $second->updatePreferences([
        'device_name' => 'Tablet da apresentação',
        'show_presence' => 'on',
    ]);

    assertSame(1, $first->preferences()['new_financing_ui']);
    assertSame(0, $second->preferences()['new_financing_ui']);
    $first->heartbeat('/proposals/1');
    $devices = $second->heartbeat('/config');
    assertSame(2, count($devices));
    assertSame('Tablet da apresentação', $devices[0]['name']);
    assertSame(1, $devices[0]['is_current']);
});

test('auditoria identifica o dispositivo responsável pela ação', function (): void {
    $pdo = database();
    $system = new SystemService($pdo, 'browser-token');
    $system->updatePreferences(['device_name' => 'Notebook da Maria']);
    $audit = new AuditService($pdo);
    $audit->setActor($system->auditActor());

    $audit->record('proposal.updated', 'Proposal', 42);

    $logs = $audit->list(['dispositivo' => 'Maria']);
    assertSame(1, count($logs));
    assertSame('Notebook da Maria', $logs[0]['device_name']);
    assertSame(hash('sha256', 'browser-token'), $logs[0]['device_id']);
});

test('rota estática tem precedência sobre rota parametrizada', function (): void {
    $router = new Router();
    $router->get('/beneficiaries/{id}', fn(): Response => Response::text('dynamic'));
    $router->get('/beneficiaries/new', fn(): Response => Response::text('static'));

    assertSame(
        'static',
        $router->dispatch(request('GET', '/beneficiaries/new'))->body(),
    );
});

test('router diferencia método inválido de caminho inexistente', function (): void {
    $router = new Router();
    $router->post('/beneficiaries', fn(): Response => Response::text('created'));

    $methodNotAllowed = $router->dispatch(request('GET', '/beneficiaries'));
    $notFound = $router->dispatch(request('GET', '/unknown'));

    assertSame(405, $methodNotAllowed->status());
    assertSame('POST', $methodNotAllowed->headers()['Allow']);
    assertSame(404, $notFound->status());
});

test('service valida, normaliza e persiste beneficiário', function (): void {
    $service = new BeneficiaryService(repository());
    $beneficiary = $service->create([
        'nome' => '  Maria da Silva  ',
        'cpf' => '529.982.247-25',
        'telefone' => '(95) 99123-4567',
        'dependentes' => '2',
    ]);

    assertSame(1, $beneficiary->id);
    assertSame('Maria da Silva', $beneficiary->nome);
    assertSame('52998224725', $beneficiary->cpf);
    assertSame('95991234567', $beneficiary->telefone);
    assertSame(2, $beneficiary->dependentes);
    assertSame(1, count($service->list()));
    assertSame('Maria da Silva', $service->find(1)?->nome);
});

test('service rejeita CPF inválido e CPF duplicado', function (): void {
    $service = new BeneficiaryService(repository());

    assertThrows(ValidationException::class, fn() => $service->create([
        'nome' => 'Maria da Silva',
        'cpf' => '111.111.111-11',
        'telefone' => '95991234567',
    ]));

    $valid = [
        'nome' => 'Maria da Silva',
        'cpf' => '52998224725',
        'telefone' => '95991234567',
    ];
    $service->create($valid);

    assertThrows(
        ValidationException::class,
        fn() => $service->create([...$valid, 'nome' => 'Outra Pessoa']),
    );
});

test('fluxo de elaboração respeita sequência e calcula patrimônio, caixa e SAC', function (): void {
    $pdo = database();
    $audit = new AuditService($pdo);
    $beneficiaries = new BeneficiaryService(new SqliteBeneficiaryRepository($pdo));
    $properties = new PropertyService($pdo, $audit);
    $creditLines = new CreditLineService($pdo, $audit);
    $proposals = new ProposalService($pdo, $audit);

    $beneficiary = $beneficiaries->create([
        'nome' => 'Maria Rural', 'cpf' => '52998224725', 'telefone' => '95991234567',
    ]);
    $propertyId = $properties->save([
        'beneficiary_id' => $beneficiary->id, 'denominacao' => 'Sítio Esperança',
        'endereco' => 'Vicinal 1', 'municipio' => 'Boa Vista', 'area_total' => '20',
        'forma_ocupacao' => 'PROPRIA', 'documento_existente' => 'Título',
    ]);
    $lineId = $creditLines->save([
        'codigo' => 'TESTE', 'nome' => 'Linha de Teste', 'ativo' => '1',
        'teto_financiamento' => '100000', 'taxa_juros_anual' => '2',
        'prazo_max_anos' => '5', 'carencia_max_anos' => '1',
        'percentual_financiavel_max' => '100', 'percentual_ater_padrao' => '2.5',
    ]);
    $proposalId = $proposals->create([
        'beneficiary_id' => $beneficiary->id, 'property_id' => $propertyId,
        'data' => '2026-08-31', 'atividade' => 'Horticultura',
    ]);

    $proposals->addPatrimonyItem($proposalId, [
        'categoria' => 'TERRA_COBERTURAS', 'especificacao' => 'Terra',
        'unidade' => 'ha', 'quantidade' => '20', 'valor_unitario' => '1000',
    ]);
    $proposals->confirmPatrimonyDebts($proposalId, true);
    $proposals->completePatrimony($proposalId);
    $proposals->saveIdentification($proposalId, [
        'finalidade' => 'Implantação', 'mercado' => 'Local',
        'analise_localizacao' => 'Acesso pela vicinal', 'consideracoes' => 'Projeto viável',
        'empregos_confirmados' => '1', 'usos_fontes_confirmados' => '1',
    ]);
    $proposals->addUseSource($proposalId, [
        'tipo' => 'USO', 'categoria' => 'Equipamentos', 'a_realizar' => '10000',
    ]);
    $proposals->addUseSource($proposalId, [
        'tipo' => 'FONTE', 'categoria' => 'Financiamento', 'a_realizar' => '10000',
    ]);
    $proposals->completeIdentification($proposalId);
    $baseCashItem = [
        'unidade' => 'ano', 'quantidade' => '1', 'valor_unitario' => '20000',
        'ano2' => '20000', 'ano3' => '20000', 'ano4' => '20000',
        'ano5' => '20000', 'ano6' => '20000', 'ano7' => '20000',
    ];
    $proposals->addCashFlowItem($proposalId, [
        ...$baseCashItem, 'tipo' => 'RECEITA', 'descricao' => 'Vendas',
    ]);
    $proposals->addCashFlowItem($proposalId, [
        ...$baseCashItem, 'tipo' => 'CUSTO_FIXO', 'descricao' => 'Custos',
        'valor_unitario' => '5000', 'ano2' => '5000', 'ano3' => '5000',
        'ano4' => '5000', 'ano5' => '5000', 'ano6' => '5000', 'ano7' => '5000',
    ]);
    $proposals->confirmCashFlow($proposalId, true);
    $proposals->completeCashFlow($proposalId);
    $proposals->saveFinancing($proposalId, [
        'credit_line_id' => $lineId, 'valor_proposta' => '10000',
        'percentual_financiavel' => '100', 'percentual_ater' => '2.5',
        'taxa_juros_anual' => '2', 'prazo_total_anos' => '5',
        'carencia_anos' => '1', 'juros_carencia' => 'CAPITALIZAR',
    ]);
    $proposals->addGuarantee($proposalId, [
        'tipo' => 'BEM', 'descricao' => 'Trator', 'valor_estimado' => '15000',
    ]);
    $proposals->confirmFinancing($proposalId, 'garantias_confirmadas', true);
    $proposals->confirmFinancing($proposalId, 'cronograma_confirmado', true);
    $proposals->completeFinancing($proposalId);

    $detail = $proposals->find($proposalId);
    assertSame('CONCLUIDO', $detail['patrimonio_status']);
    assertSame(20000.0, $detail['patrimony_totals']['liquido']);
    assertSame(15000.0, $detail['cash_flow']['saldo_operacional'][0]);
    assertSame(5, count($detail['financing']['schedule']));
    assertSame(10200.0, $detail['financing']['schedule'][1]['saldo_inicial']);
    assertSame(2550.0, $detail['financing']['schedule'][1]['amortizacao']);
    assertSame(0.0, $detail['financing']['schedule'][4]['saldo_final']);
    assertSame('CONCLUIDO', $detail['financiamento_status']);
});

$failures = 0;

foreach ($tests as $description => $test) {
    try {
        $test();
        echo "[OK] {$description}" . PHP_EOL;
    } catch (Throwable $throwable) {
        $failures++;
        fwrite(STDERR, "[ERRO] {$description}: {$throwable->getMessage()}" . PHP_EOL);
    }
}

if ($failures > 0) {
    exit(1);
}

echo count($tests) . ' testes executados com sucesso.' . PHP_EOL;
