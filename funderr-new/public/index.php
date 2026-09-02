<?php

declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use Funderr\Application\Audit\AuditService;
use Funderr\Application\Beneficiary\BeneficiaryService;
use Funderr\Application\CreditLine\CreditLineService;
use Funderr\Application\Document\DocumentService;
use Funderr\Application\Property\PropertyService;
use Funderr\Application\Proposal\ProposalService;
use Funderr\Application\System\SystemService;
use Funderr\Controller\BeneficiaryController;
use Funderr\Controller\CreditLineController;
use Funderr\Controller\DashboardController;
use Funderr\Controller\DocumentController;
use Funderr\Controller\PropertyController;
use Funderr\Controller\ProposalController;
use Funderr\Controller\SystemController;
use Funderr\Database\Connection;
use Funderr\Http\Csrf;
use Funderr\Http\Request;
use Funderr\Http\Response;
use Funderr\Http\Router;
use Funderr\Infrastructure\Persistence\SqliteBeneficiaryRepository;

session_start();

$deviceToken = $_COOKIE['funderr_device'] ?? '';
if (!is_string($deviceToken) || preg_match('/^[a-f0-9]{64}$/', $deviceToken) !== 1) {
    $deviceToken = bin2hex(random_bytes(32));
    setcookie('funderr_device', $deviceToken, [
        'expires' => time() + 31536000,
        'path' => '/',
        'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

$rootPath = dirname(__DIR__);
$databasePath = getenv('FUNDERR_DATABASE_PATH') ?: $rootPath . '/data/funderr.sqlite';
$pdo = Connection::create($databasePath);

$beneficiaryRepository = new SqliteBeneficiaryRepository($pdo);
$beneficiaryService = new BeneficiaryService($beneficiaryRepository);
$auditService = new AuditService($pdo);
$propertyService = new PropertyService($pdo, $auditService);
$creditLineService = new CreditLineService($pdo, $auditService);
$proposalService = new ProposalService($pdo, $auditService);
$documentService = new DocumentService(
    $pdo,
    $auditService,
    getenv('FUNDERR_DOCUMENTS_PATH') ?: $rootPath . '/data/documents',
);
$systemService = new SystemService($pdo, $deviceToken);
$auditService->setActor($systemService->auditActor());

$dashboardController = new DashboardController($systemService, $rootPath . '/templates');
$beneficiaryController = new BeneficiaryController(
    $beneficiaryService,
    templatesPath: $rootPath . '/templates',
);
$propertyController = new PropertyController(
    $propertyService,
    $beneficiaryService,
    $rootPath . '/templates',
);
$creditLineController = new CreditLineController($creditLineService, $rootPath . '/templates');
$proposalController = new ProposalController(
    $proposalService,
    $beneficiaryService,
    $propertyService,
    $creditLineService,
    $documentService,
    $rootPath . '/templates',
);
$documentController = new DocumentController($documentService, $rootPath . '/templates');
$systemController = new SystemController($systemService, $auditService, $rootPath . '/templates');

$router = new Router();
$router->get('/', [$dashboardController, 'index']);
$router->get('/beneficiaries', [$beneficiaryController, 'index']);
$router->post('/beneficiaries', [$beneficiaryController, 'store']);
$router->get('/beneficiaries/{id}', [$beneficiaryController, 'show']);
$router->get('/properties', [$propertyController, 'index']);
$router->post('/properties', [$propertyController, 'save']);
$router->get('/proposals', [$proposalController, 'index']);
$router->post('/proposals', [$proposalController, 'create']);
$router->get('/proposals/{id}', [$proposalController, 'show']);
$router->post('/proposals/{id}/actions/{action}', [$proposalController, 'action']);
$router->post('/proposals/{id}/remove/{kind}', [$proposalController, 'remove']);
$router->post('/proposals/{id}/documents/{documentId}/confirm', [$proposalController, 'confirmDocument']);
$router->post('/proposals/{id}/documents/{documentId}/delete', [$proposalController, 'deleteDocument']);
$router->get('/credit-lines', [$creditLineController, 'index']);
$router->post('/credit-lines', [$creditLineController, 'save']);
$router->get('/documents', [$documentController, 'index']);
$router->get('/documents/{id}/download', [$documentController, 'download']);
$router->get('/audit', [$systemController, 'audit']);
$router->get('/config', [$systemController, 'config']);
$router->post('/config', [$systemController, 'updateConfig']);
$router->post('/presence', [$systemController, 'presence']);
$router->get('/health', [$systemController, 'health']);
$router->get('/maps/geocode', [$systemController, 'geocode']);

$request = Request::capture();

if ($request->method() === 'POST' && !Csrf::validate($request->post('_token'))) {
    $response = Response::text(
        '419 - Sessão expirada. Recarregue a página e tente novamente.',
        419,
    );
} else {
    try {
        $response = $router->dispatch($request);
    } catch (Throwable $throwable) {
        error_log((string) $throwable);
        $response = Response::text('500 - Erro interno do servidor', 500);
    }
}

$response->send();
