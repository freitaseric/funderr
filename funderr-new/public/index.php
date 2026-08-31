<?php

declare(strict_types=1);

use Funderr\Http\Router;
use Funderr\Application\Beneficiary\BeneficiaryService;
use Funderr\Controller\BeneficiaryController;
use Funderr\Infrastructure\Persistence\SqliteBeneficiaryRepository;

require dirname(__DIR__) . '/vendor/autoload.php';

use Funderr\Database\Connection;

$rootPath = dirname(__DIR__);

$databasePath = $rootPath . '/data/funderr.sqlite';

$pdo = Connection::create($databasePath);

$beneficiaryRepository = new SqliteBeneficiaryRepository($pdo);

$beneficiaryService = new BeneficiaryService($beneficiaryRepository);

$beneficiaryController = new BeneficiaryController(
    $beneficiaryRepository,
    $beneficiaryService,
    templatesPath: $rootPath . '/templates',
);

$router = new Router();

$router->get('/', function (): void {
    header('Location: /beneficiaries', true, 302);
    exit;
});

$router->get('/beneficiaries', [$beneficiaryController, 'index']);

$router->dispatch(
    $_SERVER['REQUEST_METHOD'],
    $_SERVER['REQUEST_URI'],
);