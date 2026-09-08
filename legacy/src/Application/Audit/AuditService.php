<?php

declare(strict_types=1);

namespace Funderr\Application\Audit;

use PDO;

final class AuditService
{
    private ?array $actor = null;

    public function __construct(private readonly PDO $pdo)
    {
    }

    public function setActor(?array $actor): void
    {
        $this->actor = $actor;
    }

    public function record(
        string $action,
        string $entity,
        int|string $entityId,
        array $metadata = [],
    ): void {
        $statement = $this->pdo->prepare(
            'INSERT INTO audit_logs
             (user_id, user_name, user_role, device_id, device_name, acao, entidade, entity_id, metadata)
             VALUES (:user_id, :user_name, :user_role, :device_id, :device_name, :action, :entity, :entity_id, :metadata)'
        );
        $statement->execute([
            'user_id' => $this->actor['user_id'] ?? null,
            'user_name' => $this->actor['user_name'] ?? null,
            'user_role' => $this->actor['user_role'] ?? null,
            'device_id' => $this->actor['id'] ?? null,
            'device_name' => $this->actor['name'] ?? null,
            'action' => $action,
            'entity' => $entity,
            'entity_id' => (string) $entityId,
            'metadata' => $metadata === []
                ? null
                : json_encode($metadata, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE),
        ]);
    }

    public function list(array $filters = []): array
    {
        $where = [];
        $parameters = [];

        if (($filters['entidade'] ?? '') !== '') {
            $where[] = 'entidade = :entidade';
            $parameters['entidade'] = $filters['entidade'];
        }

        if (($filters['acao'] ?? '') !== '') {
            $where[] = 'acao LIKE :acao';
            $parameters['acao'] = '%' . $filters['acao'] . '%';
        }

        if (($filters['dispositivo'] ?? '') !== '') {
            $where[] = 'device_name LIKE :device_name';
            $parameters['device_name'] = '%' . $filters['dispositivo'] . '%';
        }

        $sql = 'SELECT * FROM audit_logs';
        $sql .= $where === [] ? '' : ' WHERE ' . implode(' AND ', $where);
        $sql .= ' ORDER BY id DESC LIMIT 200';
        $statement = $this->pdo->prepare($sql);
        $statement->execute($parameters);

        return $statement->fetchAll();
    }
}
