<?php

namespace App\Jobs;

use App\Enums\ProposalDocumentStatus;
use App\Models\Proposal;
use App\Models\ProposalDocument;
use App\Services\Proposals\ProposalDossierPdf;
use App\Services\Proposals\ProposalWorkflow;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class GenerateProposalDossier implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 180;

    public function __construct(public int $proposalId, public int $revision, public int $documentId)
    {
        $this->onQueue('documents');
    }

    public function uniqueId(): string
    {
        return 'dossier:'.$this->proposalId.':'.$this->revision;
    }

    public function handle(ProposalDossierPdf $pdf): void
    {
        $document = ProposalDocument::findOrFail($this->documentId);
        $proposal = Proposal::with(['beneficiary', 'property', 'financing.creditLine', 'identification', 'cashFlowItems', 'patrimonyItems', 'debts', 'documents'])->findOrFail($this->proposalId);
        if ($proposal->revision !== $this->revision || $proposal->status->value !== 'EM_REVISAO') {
            return;
        }
        $document->update(['status' => ProposalDocumentStatus::Processing, 'error_message' => null]);
        $disk = Storage::disk($document->disk);
        $disk->put($document->path, $pdf->build($proposal));
        $document->update(['status' => ProposalDocumentStatus::Ready, 'mime_type' => 'application/pdf', 'size' => $disk->size($document->path), 'sha256' => hash('sha256', $disk->get($document->path))]);
        app(ProposalWorkflow::class)->markDossierReady(
            $proposal,
            $this->revision,
            (int) $document->created_by,
            $document->metadata['ip_address'] ?? null,
            $document->metadata['user_agent'] ?? null,
        );
    }

    public function failed(\Throwable $exception): void
    {
        ProposalDocument::whereKey($this->documentId)->update(['status' => ProposalDocumentStatus::Failed, 'error_message' => $exception->getMessage()]);
        Log::error('Falha ao gerar dossier', ['proposal_id' => $this->proposalId, 'document_id' => $this->documentId, 'exception' => $exception]);
    }

    public function tags(): array
    {
        return ['proposal:'.$this->proposalId, 'document:'.$this->documentId];
    }
}
