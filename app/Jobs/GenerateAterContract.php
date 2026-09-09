<?php

namespace App\Jobs;

use App\Enums\ProposalDocumentStatus;
use App\Models\Proposal;
use App\Models\ProposalDocument;
use App\Services\Proposals\PdfDocument;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class GenerateAterContract implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 120;

    public int $uniqueFor = 600;

    public function __construct(public int $proposalId, public int $revision, public int $documentId)
    {
        $this->onQueue('documents');
    }

    public function uniqueId(): string
    {
        return 'ater-contract:'.$this->proposalId.':'.$this->revision;
    }

    public function handle(PdfDocument $pdf): void
    {
        $document = ProposalDocument::findOrFail($this->documentId);
        $proposal = Proposal::with(['beneficiary', 'property', 'financing.creditLine'])->findOrFail($this->proposalId);
        if ($proposal->revision !== $this->revision) {
            return;
        }
        $document->update(['status' => ProposalDocumentStatus::Processing, 'error_message' => null]);
        $text = view('proposals.documents.ater-contract', compact('proposal'))->render();
        Storage::disk($document->disk)->put($document->path, $pdf->fromText(strip_tags($text)));
        $document->update(['status' => ProposalDocumentStatus::Ready, 'mime_type' => 'application/pdf', 'size' => Storage::disk($document->disk)->size($document->path), 'sha256' => hash('sha256', Storage::disk($document->disk)->get($document->path))]);
    }

    public function failed(\Throwable $exception): void
    {
        ProposalDocument::whereKey($this->documentId)->update(['status' => ProposalDocumentStatus::Failed, 'error_message' => $exception->getMessage()]);
        Log::error('Falha ao gerar contrato ATER', ['proposal_id' => $this->proposalId, 'document_id' => $this->documentId, 'exception' => $exception]);
    }

    public function tags(): array
    {
        return ['proposal:'.$this->proposalId, 'document:'.$this->documentId];
    }
}
