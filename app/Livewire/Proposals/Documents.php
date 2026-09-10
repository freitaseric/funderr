<?php

namespace App\Livewire\Proposals;

use App\Enums\ProposalDocumentStatus;
use App\Enums\ProposalDocumentType;
use App\Enums\ProposalStep;
use App\Jobs\GenerateAterContract;
use App\Jobs\ProcessProposalDocument;
use App\Models\Proposal;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\View\View;
use Livewire\WithFileUploads;

class Documents extends StepEditor
{
    use WithFileUploads;

    public $file;

    public string $type = 'ATER_CONTRACT_SIGNED';

    public function step(): ProposalStep
    {
        return ProposalStep::Documents;
    }

    protected function loadData(array $data): void {}

    public function generateContract(): void
    {
        Gate::authorize('update', $this->proposal);
        $proposal = $this->proposal;
        $existing = $proposal->documents()->where('type', ProposalDocumentType::AterContract)->where('source_revision', $proposal->revision)->whereIn('status', [ProposalDocumentStatus::Pending, ProposalDocumentStatus::Processing, ProposalDocumentStatus::Ready])->first();
        if ($existing) {
            session()->flash('success', 'O contrato da revisão atual já foi solicitado ou gerado.');

            return;
        }
        $document = $proposal->documents()->create([
            'type' => ProposalDocumentType::AterContract,
            'status' => ProposalDocumentStatus::Pending,
            'disk' => config('proposals.documents.disk'),
            'path' => 'proposals/'.$proposal->id.'/contract-'.$proposal->revision.'-'.Str::uuid().'.pdf',
            'source_revision' => $proposal->revision,
            'version' => $proposal->documents()->where('type', ProposalDocumentType::AterContract->value)->max('version') + 1,
            'created_by' => auth()->id(),
        ]);
        GenerateAterContract::dispatch($proposal->id, $proposal->revision, $document->id)->afterCommit();
        session()->flash('success', 'Contrato enviado para geração.');
    }

    public function uploadDocument(): void
    {
        Gate::authorize('update', $this->proposal);
        $this->validate([
            'file' => ['required', 'file', 'max:'.config('proposals.documents.max_upload_kb'), 'mimes:pdf,jpg,jpeg,png'],
            'type' => ['required', Rule::enum(ProposalDocumentType::class), Rule::notIn([ProposalDocumentType::AterContract->value, ProposalDocumentType::Dossier->value])],
        ]);
        $proposal = $this->proposal;
        $extension = strtolower($this->file->getClientOriginalExtension());
        $path = $this->file->storeAs('proposals/'.$proposal->id.'/uploads', Str::uuid().'.'.$extension, config('proposals.documents.disk'));
        $document = $proposal->documents()->create([
            'type' => $this->type,
            'status' => ProposalDocumentStatus::Pending,
            'disk' => config('proposals.documents.disk'),
            'path' => $path,
            'original_name' => $this->file->getClientOriginalName(),
            'mime_type' => $this->file->getMimeType(),
            'size' => $this->file->getSize(),
            'source_revision' => $proposal->revision,
            'version' => $proposal->documents()->where('type', $this->type)->max('version') + 1,
            'created_by' => auth()->id(),
        ]);
        ProcessProposalDocument::dispatch($document->id)->afterCommit();
        $this->reset('file');
        session()->flash('success', 'Documento enviado para processamento.');
    }

    public function finish(): void
    {
        Gate::authorize('update', $this->proposal);
        $revision = $this->revision;
        $current = $this->proposal->documents()->where('source_revision', $revision)->where('status', ProposalDocumentStatus::Ready);
        abort_unless((clone $current)->where('type', ProposalDocumentType::AterContract)->exists(), 422, 'Gere o contrato ATER atual.');
        abort_unless((clone $current)->where('type', ProposalDocumentType::AterContractSigned)->exists(), 422, 'Anexe o contrato ATER assinado.');
        $this->persist(true, function (Proposal $proposal) use ($revision): null {
            $proposal->documents()
                ->where('source_revision', $revision)
                ->where('status', ProposalDocumentStatus::Ready)
                ->update(['source_revision' => $revision + 1]);

            return null;
        });
    }

    public function render(): View
    {
        return view('livewire.proposals.documents');
    }
}
