<?php

declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

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

  if ($alreadyExecuted) {
    echo "[SKIP] {$migrationName}" . PHP_EOL;
    continue;
  }

  $sql = file_get_contents($migrationFile);

  if ($sql === false) {
    throw new RuntimeException("Não foi possível ler a migration {$migrationName}");
  }

  $pdo->beginTransaction();

  try {
    $pdo->exec($sql);

    $stmt = $pdo->prepare(
      '
      INSERT INTO migrations (migration)
      VALUES (:migration)
      '
    );

    $stmt->execute(['migration' => $migrationName]);

    $pdo->commit();

    echo "[OK] {$migrationName}" . PHP_EOL;
  } catch (\Throwable $th) {
    $pdo->rollBack();

    echo "[ERRO] {$migrationName}" . PHP_EOL;

    throw $th;
  }
}