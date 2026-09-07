<?php

declare(strict_types=1);

namespace Funderr\Application\Property;

use Funderr\Application\Audit\AuditService;
use Funderr\Application\Exception\ValidationException;
use Funderr\Application\Support\Input;
use PDO;

final class PropertyService
{
    private const MUNICIPALITIES = [
        'Alto Alegre', 'Amajari', 'Boa Vista', 'Bonfim', 'Cantá',
        'Caracaraí', 'Caroebe', 'Iracema', 'Mucajaí', 'Normandia',
        'Pacaraima', 'Rorainópolis', 'São João da Baliza', 'São Luiz', 'Uiramutã',
    ];
    private const OCCUPANCY_TYPES = ['', 'PROPRIA', 'ARRENDADA', 'POSSE', 'COMODATO', 'CONCESSAO', 'ASSENTAMENTO'];
    private const DOCUMENT_TYPES = ['', 'TITULO_DEFINITIVO', 'ESCRITURA_PUBLICA', 'CONTRATO_COMPRA_VENDA',
        'CONTRATO_ARRENDAMENTO', 'TERMO_POSSE', 'CCU', 'OUTRO', 'SEM_DOCUMENTO'];

    public function __construct(
        private readonly PDO $pdo,
        private readonly AuditService $audit,
    ) {
    }

    public function list(?int $beneficiaryId = null): array
    {
        $sql = 'SELECT p.*, b.nome AS beneficiary_nome
                FROM properties p
                JOIN beneficiaries b ON b.id = p.beneficiary_id';
        $parameters = [];

        if ($beneficiaryId !== null) {
            $sql .= ' WHERE p.beneficiary_id = :beneficiary_id';
            $parameters['beneficiary_id'] = $beneficiaryId;
        }

        $sql .= ' ORDER BY p.denominacao';
        $statement = $this->pdo->prepare($sql);
        $statement->execute($parameters);

        return array_map($this->withCompleteness(...), $statement->fetchAll());
    }

    public function find(int $id): ?array
    {
        $statement = $this->pdo->prepare(
            'SELECT p.*, b.nome AS beneficiary_nome
             FROM properties p
             JOIN beneficiaries b ON b.id = p.beneficiary_id
             WHERE p.id = :id'
        );
        $statement->execute(['id' => $id]);
        $property = $statement->fetch();

        return $property === false ? null : $this->withCompleteness($property);
    }

    public function save(array $data): int
    {
        $id = Input::int($data, 'id');
        $beneficiaryId = Input::int($data, 'beneficiary_id');
        $denomination = Input::string($data, 'denominacao');
        $municipality = Input::string($data, 'municipio');
        $occupancyType = match (Input::string($data, 'forma_ocupacao')) {
            'Própria', 'PROPRIA' => 'PROPRIA',
            'Arrendada', 'ARRENDADA' => 'ARRENDADA',
            'Posse', 'POSSE' => 'POSSE',
            default => Input::string($data, 'forma_ocupacao'),
        };
        $documentType = match (Input::string($data, 'documento_existente')) {
            'Título', 'TITULO_DEFINITIVO' => 'TITULO_DEFINITIVO',
            default => Input::string($data, 'documento_existente'),
        };
        $latitude = Input::string($data, 'latitude');
        $longitude = Input::string($data, 'longitude');
        $errors = [];

        if ($beneficiaryId < 1 || !$this->beneficiaryExists($beneficiaryId)) {
            $errors['beneficiary_id'] = 'Selecione um beneficiário existente.';
        }
        if (mb_strlen($denomination) < 2) {
            $errors['denominacao'] = 'Denominação deve ter no mínimo 2 caracteres.';
        }
        if ($municipality !== '' && !in_array($municipality, self::MUNICIPALITIES, true)) {
            $errors['municipio'] = 'Município deve pertencer ao Estado de Roraima.';
        }
        if (!in_array($occupancyType, self::OCCUPANCY_TYPES, true)) {
            $errors['forma_ocupacao'] = 'Forma de ocupação inválida.';
        }
        if (!in_array($documentType, self::DOCUMENT_TYPES, true)) {
            $errors['documento_existente'] = 'Tipo de documento inválido.';
        }
        if (($latitude === '') !== ($longitude === '')) {
            $errors['coordinates'] = 'Latitude e longitude devem ser informadas em conjunto.';
        }
        if ($latitude !== '' && ((float) $latitude < -90 || (float) $latitude > 90)) {
            $errors['latitude'] = 'Latitude inválida.';
        }
        if ($longitude !== '' && ((float) $longitude < -180 || (float) $longitude > 180)) {
            $errors['longitude'] = 'Longitude inválida.';
        }
        foreach (['area_total', 'area_disponivel', 'area_legal'] as $areaField) {
            if (Input::string($data, $areaField) !== '' && Input::number($data, $areaField) < 0) {
                $errors[$areaField] = 'Áreas não podem ser negativas.';
            }
        }
        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $values = [
            'beneficiary_id' => $beneficiaryId,
            'denominacao' => $denomination,
            'endereco' => Input::string($data, 'endereco'),
            'municipio' => $municipality,
            'area_total' => Input::number($data, 'area_total'),
            'area_disponivel' => $this->optionalNumber($data, 'area_disponivel'),
            'area_legal' => $this->optionalNumber($data, 'area_legal'),
            'forma_ocupacao' => $occupancyType,
            'tempo_exploracao' => $this->optionalString($data, 'tempo_exploracao'),
            'modulo' => $this->optionalString($data, 'modulo'),
            'documento_existente' => $documentType,
            'latitude' => $latitude === '' ? null : (float) $latitude,
            'longitude' => $longitude === '' ? null : (float) $longitude,
            'place_id' => $this->optionalString($data, 'place_id'),
            'confrontacao_norte' => $this->optionalString($data, 'confrontacao_norte'),
            'confrontacao_sul' => $this->optionalString($data, 'confrontacao_sul'),
            'confrontacao_leste' => $this->optionalString($data, 'confrontacao_leste'),
            'confrontacao_oeste' => $this->optionalString($data, 'confrontacao_oeste'),
            'administracao' => $this->optionalString($data, 'administracao'),
        ];

        if ($id > 0) {
            $existing = $this->find($id);
            if ($existing === null) {
                throw new ValidationException(['id' => 'Propriedade não encontrada.']);
            }
            if ((int) $existing['beneficiary_id'] !== $beneficiaryId) {
                throw new ValidationException([
                    'beneficiary_id' => 'O beneficiário de uma propriedade existente não pode ser alterado.',
                ]);
            }
            $assignments = array_map(
                static fn(string $field): string => "{$field} = :{$field}",
                array_keys($values),
            );
            $statement = $this->pdo->prepare(
                'UPDATE properties SET ' . implode(', ', $assignments) .
                ', updated_at = CURRENT_TIMESTAMP WHERE id = :id'
            );
            $statement->execute([...$values, 'id' => $id]);
            $this->invalidateProposals($id);
            $this->audit->record('property.updated', 'Property', $id);

            return $id;
        }

        $columns = array_keys($values);
        $statement = $this->pdo->prepare(
            'INSERT INTO properties (' . implode(', ', $columns) . ')
             VALUES (:' . implode(', :', $columns) . ')'
        );
        $statement->execute($values);
        $id = (int) $this->pdo->lastInsertId();
        $this->audit->record('property.created', 'Property', $id);

        return $id;
    }

    public function municipalities(): array
    {
        return self::MUNICIPALITIES;
    }

    private function beneficiaryExists(int $id): bool
    {
        $statement = $this->pdo->prepare('SELECT 1 FROM beneficiaries WHERE id = :id');
        $statement->execute(['id' => $id]);

        return $statement->fetchColumn() !== false;
    }

    private function withCompleteness(array $property): array
    {
        $required = [
            'denominacao' => 'Denominação',
            'endereco' => 'Endereço',
            'municipio' => 'Município',
            'area_total' => 'Área total',
            'area_disponivel' => 'Área disponível',
            'area_legal' => 'Área legal',
            'forma_ocupacao' => 'Forma de ocupação',
            'tempo_exploracao' => 'Tempo de exploração',
            'documento_existente' => 'Documento da propriedade',
            'confrontacao_norte' => 'Confrontação norte',
            'confrontacao_sul' => 'Confrontação sul',
            'confrontacao_leste' => 'Confrontação leste',
            'confrontacao_oeste' => 'Confrontação oeste',
            'administracao' => 'Administração',
            'latitude' => 'Latitude',
            'longitude' => 'Longitude',
        ];
        $pending = [];

        foreach ($required as $field => $label) {
            $missing = $property[$field] === '' || $property[$field] === null;

            if ($field === 'area_total') {
                $missing = (float) $property[$field] <= 0;
            }

            if ($missing) {
                $pending[] = $label;
            }
        }

        $property['pendencias'] = $pending;
        $property['percentual_completude'] = (int) round(
            ((count($required) - count($pending)) / count($required)) * 100
        );

        return $property;
    }

    private function invalidateProposals(int $propertyId): void
    {
        $statement = $this->pdo->prepare(
            "UPDATE proposals
             SET status = CASE WHEN status IN ('APROVADO', 'CONCLUÍDO') THEN 'EM ANÁLISE' ELSE status END,
                 updated_at = CURRENT_TIMESTAMP
             WHERE property_id = :property_id"
        );
        $statement->execute(['property_id' => $propertyId]);
    }

    private function optionalString(array $data, string $key): ?string
    {
        $value = Input::string($data, $key);

        return $value === '' ? null : $value;
    }

    private function optionalNumber(array $data, string $key): ?float
    {
        return Input::string($data, $key) === '' ? null : Input::number($data, $key);
    }
}
