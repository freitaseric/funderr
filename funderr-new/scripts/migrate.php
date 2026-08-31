<?php

declare(strict_types=1);

use Funderr\Database\Connection;

$rootPath = dirname(__DIR__);

$databasePath = $rootPath . '/data/funderr.sqlite';

$migrationsPath = $rootPath . '/migrations';

$pdo = Connection::create($databasePath);

$pdo->exec(
  '
    CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        migration TEXT NOT NULL UNIQUE,
        executed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
    '
);

$migrationFiles = glob($migrationsPath . '/*.sql');

sort($migrationFiles);

foreach ($migrationFiles as $migrationFile) {
  $migrationName = basename($migrationFile);

  $stmt = $pdo->prepare(
    '
    SELECT COUNT(*)
    FROM migrations
    WHERE migration = :migration
    '
  );

  $stmt->execute([
    'migration' => $migrationName,
  ]);

  $alreadyExecuted = (int) $stmt->fetchColumn() > 0;
}