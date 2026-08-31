<?php

declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use Funderr\Database\Connection;

$databasePath = dirname(__DIR__) . '/data/funderr.sqlite';

$pdo = Connection::create($databasePath);

echo 'PHP + SQLite funcionando!';