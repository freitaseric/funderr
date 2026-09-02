<?php

declare(strict_types=1);

namespace Funderr\Application\System;

use PDO;

final class SystemService
{
    private readonly string $deviceId;

    public function __construct(private readonly PDO $pdo, string $deviceToken)
    {
        $this->deviceId = hash('sha256', $deviceToken);
        $this->ensureDevice();
    }

    public function dashboard(): array
    {
        $counts = [];
        foreach (['beneficiaries', 'properties', 'proposals', 'documents'] as $table) {
            $counts[$table] = (int) $this->pdo->query("SELECT COUNT(*) FROM {$table}")->fetchColumn();
        }
        $counts['in_analysis'] = (int) $this->pdo->query(
            "SELECT COUNT(*) FROM proposals WHERE status='EM ANÁLISE'"
        )->fetchColumn();
        $counts['approved'] = (int) $this->pdo->query(
            "SELECT COUNT(*) FROM proposals WHERE status IN ('APROVADO', 'CONCLUÍDO')"
        )->fetchColumn();
        $counts['recent'] = $this->pdo->query(
            'SELECT p.id, p.numero, p.status, b.nome AS beneficiary_nome
             FROM proposals p JOIN beneficiaries b ON b.id=p.beneficiary_id
             ORDER BY p.updated_at DESC LIMIT 10'
        )->fetchAll();

        return $counts;
    }

    public function preferences(): array
    {
        $statement = $this->pdo->prepare(
            'SELECT name, new_financing_ui, show_presence FROM devices WHERE id = :id'
        );
        $statement->execute(['id' => $this->deviceId]);

        return $statement->fetch() ?: [];
    }

    public function auditActor(): array
    {
        $preferences = $this->preferences();

        return [
            'id' => $this->deviceId,
            'name' => (string) ($preferences['name'] ?? 'Dispositivo anônimo'),
        ];
    }

    public function updatePreferences(array $data): void
    {
        $name = trim((string) ($data['device_name'] ?? ''));
        if ($name === '') {
            $name = 'Dispositivo anônimo';
        }

        $statement = $this->pdo->prepare(
            'UPDATE devices
             SET name = :name,
                 new_financing_ui = :new_financing_ui,
                 show_presence = :show_presence,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = :id'
        );
        $statement->execute([
            'id' => $this->deviceId,
            'name' => mb_substr($name, 0, 60),
            'new_financing_ui' => isset($data['new_financing_ui']) ? 1 : 0,
            'show_presence' => isset($data['show_presence']) ? 1 : 0,
        ]);
    }

    public function heartbeat(string $path): array
    {
        $path = '/' . ltrim(parse_url($path, PHP_URL_PATH) ?: '/', '/');
        $statement = $this->pdo->prepare(
            'UPDATE devices SET current_path = :path, last_seen_at = CURRENT_TIMESTAMP WHERE id = :id'
        );
        $statement->execute(['id' => $this->deviceId, 'path' => mb_substr($path, 0, 200)]);

        if (!(bool) ($this->preferences()['show_presence'] ?? false)) {
            return [];
        }

        $statement = $this->pdo->prepare(
            "SELECT name, current_path, id = :id AS is_current
             FROM devices
             WHERE show_presence = 1
               AND last_seen_at >= datetime('now', '-30 seconds')
             ORDER BY is_current DESC, name"
        );
        $statement->execute(['id' => $this->deviceId]);

        return $statement->fetchAll();
    }

    private function ensureDevice(): void
    {
        $statement = $this->pdo->prepare(
            "INSERT OR IGNORE INTO devices (id, name) VALUES (:id, 'Dispositivo anônimo')"
        );
        $statement->execute(['id' => $this->deviceId]);
    }
}
