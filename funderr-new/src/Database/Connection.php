<?php

declare(strict_types=1);

namespace Funderr\Database;

use PDO;

final class Connection
{
  public static function create(string $databasePath): PDO
  {
    $pdo = new PDO(
      'sqlite:' . $databasePath,
      null,
      null,
      [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
      ]
    );

    $pdo->exec('PRAGMA foreign_keys = ON');
    $pdo->exec('PRAGMA busy_timeout = 5000');

    return $pdo;
  }
}