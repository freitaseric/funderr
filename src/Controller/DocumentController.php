<?php

declare(strict_types=1);

namespace Funderr\Controller;

use Funderr\Application\Document\DocumentService;
use Funderr\Http\Request;
use Funderr\Http\Response;
use Funderr\Http\View;

final class DocumentController
{
    public function __construct(
        private readonly DocumentService $documents,
        private readonly string $templatesPath,
    ) {
    }

    public function index(Request $request): Response
    {
        return View::render($this->templatesPath . '/documents.php', [
            'documents' => $this->documents->list(),
        ]);
    }

    public function download(Request $request): Response
    {
        $document = $this->documents->download((int) $request->route('id'));
        if ($document === null) return Response::text('404 - Documento não encontrado', 404);

        return new Response(
            body: $document['content'],
            headers: [
                'Content-Type' => $document['mime_type'],
                'Content-Disposition' => 'attachment; filename="' .
                    str_replace(['"', "\r", "\n"], '', $document['nome_arquivo']) . '"',
                'Content-Length' => (string) strlen($document['content']),
            ],
        );
    }
}
