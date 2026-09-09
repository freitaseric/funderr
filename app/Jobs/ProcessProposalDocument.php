<?php

namespace App\Jobs;

use App\Enums\ProposalDocumentStatus;
use App\Models\ProposalDocument;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProcessProposalDocument implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 120;

    public function __construct(public int $documentId)
    {
        $this->onQueue('documents');
    }

    public function uniqueId(): string
    {
        return 'proposal-document:'.$this->documentId;
    }

    public function handle(): void
    {
        $document = ProposalDocument::findOrFail($this->documentId);
        $document->update(['status' => ProposalDocumentStatus::Processing]);
        $disk = Storage::disk($document->disk);
        abort_unless($disk->exists($document->path), 422, 'Arquivo não encontrado.');
        $document->update(['status' => ProposalDocumentStatus::Ready, 'size' => $disk->size($document->path), 'sha256' => hash('sha256', $disk->get($document->path))]);
    }

    public function failed(\Throwable $exception): void
    {
        ProposalDocument::whereKey($this->documentId)->update(['status' => ProposalDocumentStatus::Failed, 'error_message' => $exception->getMessage()]);
        Log::error('Falha ao processar documento da proposta', ['document_id' => $this->documentId, 'exception' => $exception]);
    }

    public function tags(): array
    {
        return ['document:'.$this->documentId];
    }
}
