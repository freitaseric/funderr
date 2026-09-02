<?php

declare(strict_types=1);

namespace Funderr\Application\Document;

use finfo;
use Funderr\Application\Audit\AuditService;
use Funderr\Application\Exception\ValidationException;
use PDO;
use RuntimeException;

final class DocumentService
{
    private const MAX_SIZE = 26_214_400;
    private const MIME_TYPES = [
        'application/pdf' => 'pdf',
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    public function __construct(
        private readonly PDO $pdo,
        private readonly AuditService $audit,
        private readonly string $storagePath,
    ) {
    }

    public function list(?int $proposalId = null): array
    {
        $sql = 'SELECT d.*, p.numero AS proposal_numero FROM documents d
                JOIN proposals p ON p.id=d.proposal_id';
        $parameters = [];
        if ($proposalId !== null) {
            $sql .= ' WHERE d.proposal_id=:proposal_id';
            $parameters['proposal_id'] = $proposalId;
        }
        $sql .= ' ORDER BY d.id DESC';
        $statement = $this->pdo->prepare($sql);
        $statement->execute($parameters);

        return $statement->fetchAll();
    }

    public function upload(int $proposalId, string $type, ?array $file): int
    {
        $types = ['CPF_RG', 'COMPROVANTE_RESIDENCIA', 'CERTIDAO_CASAMENTO', 'CAF_DAP',
            'CAR_RORAIMA', 'TITULO_TERRA', 'ORCAMENTO', 'PROJETO_TECNICO', 'OUTRO'];
        if (!in_array($type, $types, true)) {
            throw new ValidationException(['document' => 'Tipo de documento inválido.']);
        }
        if ($file === null || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            throw new ValidationException(['document' => 'Selecione um arquivo válido.']);
        }
        $size = (int) ($file['size'] ?? 0);
        $temporaryPath = (string) ($file['tmp_name'] ?? '');
        if ($size < 1 || $size > self::MAX_SIZE || !is_file($temporaryPath)) {
            throw new ValidationException(['document' => 'Arquivo vazio ou acima do limite de 25 MB.']);
        }
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($temporaryPath);
        if (!is_string($mime) || !isset(self::MIME_TYPES[$mime])) {
            throw new ValidationException(['document' => 'Formato não suportado. Use PDF, JPEG, PNG ou WebP.']);
        }
        if (!is_dir($this->storagePath) && !mkdir($this->storagePath, 0770, true) && !is_dir($this->storagePath)) {
            throw new RuntimeException('Não foi possível criar o diretório de documentos.');
        }

        $originalName = basename((string) ($file['name'] ?? 'documento'));
        $storedName = bin2hex(random_bytes(16)) . '.' . self::MIME_TYPES[$mime];
        $destination = $this->storagePath . '/' . $storedName;
        $moved = is_uploaded_file($temporaryPath)
            ? move_uploaded_file($temporaryPath, $destination)
            : rename($temporaryPath, $destination);
        if (!$moved) throw new RuntimeException('Não foi possível armazenar o documento.');

        $statement = $this->pdo->prepare(
            'INSERT INTO documents
             (proposal_id, tipo, nome_arquivo, mime_type, tamanho_bytes, storage_path)
             VALUES (:proposal_id, :tipo, :nome, :mime, :size, :path)'
        );
        $statement->execute([
            'proposal_id' => $proposalId, 'tipo' => $type, 'nome' => $originalName,
            'mime' => $mime, 'size' => $size, 'path' => $storedName,
        ]);
        $id = (int) $this->pdo->lastInsertId();
        $this->audit->record('document.uploaded', 'ProposalDocument', $id, ['tipo' => $type]);

        return $id;
    }

    public function confirm(int $proposalId, int $documentId, string $verifiedData): void
    {
        $data = null;
        if ($verifiedData !== '') {
            try {
                $data = json_decode($verifiedData, true, flags: JSON_THROW_ON_ERROR);
            } catch (\JsonException) {
                throw new ValidationException(['document' => 'Os dados verificados devem ser um JSON válido.']);
            }
        }
        $statement = $this->pdo->prepare(
            "UPDATE documents SET status='CONFIRMED', extracted_data=:data,
             human_confirmed_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP
             WHERE id=:id AND proposal_id=:proposal_id"
        );
        $statement->execute([
            'data' => $data === null ? null : json_encode($data, JSON_UNESCAPED_UNICODE),
            'id' => $documentId, 'proposal_id' => $proposalId,
        ]);
        if ($statement->rowCount() === 0) throw new ValidationException(['document' => 'Documento não encontrado.']);
        $this->audit->record('document.confirmed', 'ProposalDocument', $documentId);
    }

    public function download(int $id): ?array
    {
        $statement = $this->pdo->prepare('SELECT * FROM documents WHERE id=:id');
        $statement->execute(['id' => $id]);
        $document = $statement->fetch();
        if ($document === false) return null;
        $path = $this->storagePath . '/' . basename($document['storage_path']);
        if (!is_file($path)) return null;
        $content = file_get_contents($path);
        if ($content === false) return null;
        $document['content'] = $content;

        return $document;
    }

    public function delete(int $proposalId, int $documentId): void
    {
        $statement = $this->pdo->prepare(
            'SELECT * FROM documents WHERE id=:id AND proposal_id=:proposal_id'
        );
        $statement->execute(['id' => $documentId, 'proposal_id' => $proposalId]);
        $document = $statement->fetch();
        if ($document === false) throw new ValidationException(['document' => 'Documento não encontrado.']);
        $path = $this->storagePath . '/' . basename($document['storage_path']);
        if (is_file($path) && !unlink($path)) throw new RuntimeException('Não foi possível excluir o arquivo.');
        $this->pdo->prepare('DELETE FROM documents WHERE id=:id')->execute(['id' => $documentId]);
        $this->audit->record('document.deleted', 'ProposalDocument', $documentId);
    }
}
