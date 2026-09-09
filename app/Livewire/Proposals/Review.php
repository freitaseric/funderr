<?php

namespace App\Livewire\Proposals;

use App\Enums\ProposalDocumentStatus;
use App\Enums\ProposalDocumentType;
use App\Enums\ProposalStatus;
use App\Enums\ProposalStep;
use App\Jobs\GenerateProposalDossier;
use App\Services\Proposals\ProposalCalculator;
use App\Services\Proposals\ProposalWorkflow;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Validator;
use Illuminate\View\View;
use Livewire\Attributes\Computed;

class Review extends StepEditor
{
    public string $reason = '';

    public string $dispatchMethod = '';

    public function step(): ProposalStep
    {
        return ProposalStep::Review;
    }

    protected function loadData(array $data): void {}

    #[Computed]
    public function summary(): array
    {
        return app(ProposalCalculator::class)->summary($this->proposal);
    }

    #[Computed]
    public function pending(): array
    {
        return app(ProposalWorkflow::class)->pending($this->proposal);
    }

    #[Computed]
    public function history(): Collection
    {
        return $this->proposal->history()->with('user')->orderBy('created_at')->orderBy('id')->get();
    }

    /** @return array<int, ProposalStatus> */
    #[Computed]
    public function availableTransitions(): array
    {
        return match ($this->proposal->status) {
            ProposalStatus::Draft, ProposalStatus::Returned => [ProposalStatus::InReview],
            ProposalStatus::InReview => [ProposalStatus::Returned, ProposalStatus::ReadyForSend],
            ProposalStatus::ReadyForSend => [ProposalStatus::Returned, ProposalStatus::Sent],
            ProposalStatus::Sent => [ProposalStatus::Returned, ProposalStatus::Released],
            ProposalStatus::Released => [],
        };
    }

    public function transitionStatus(string $status): void
    {
        $target = ProposalStatus::tryFrom($status);
        abort_unless($target, 422);
        if ($target === ProposalStatus::ReadyForSend) {
            $this->generateDossier();

            return;
        }
        if ($target === ProposalStatus::Sent) {
            Validator::make(['dispatch_method' => $this->dispatchMethod], ['dispatch_method' => ['required', 'in:WHATSAPP,PRESENCIAL']])->validate();
        }
        $metadata = $target === ProposalStatus::Sent ? ['dispatch_method' => $this->dispatchMethod] : null;
        $proposal = app(ProposalWorkflow::class)->transition($this->proposal, $this->revision, $target, $this->reason, $metadata);
        $this->revision = $proposal->revision;
        $this->reason = '';
        $this->dispatchMethod = '';
        unset($this->proposal, $this->summary, $this->pending);
        session()->flash('success', 'Tramitação registrada: '.$target->label().'.');
    }

    public function transitionLabel(ProposalStatus $target): string
    {
        return match ($target) {
            ProposalStatus::InReview => 'Enviar para análise',
            ProposalStatus::Returned => 'Devolver para correção',
            ProposalStatus::ReadyForSend => 'Aprovar revisão e gerar dossier',
            ProposalStatus::Sent => 'Registrar envio ao banco',
            ProposalStatus::Released => 'Marcar como liberada',
            ProposalStatus::Draft => 'Manter como rascunho',
        };
    }

    public function generateDossier(): void
    {
        Gate::authorize('process', $this->proposal);
        $proposal = $this->proposal;
        abort_unless($proposal->status === ProposalStatus::InReview, 422);
        abort_if(app(ProposalWorkflow::class)->pending($proposal) !== [], 422, 'Resolva as pendências antes de gerar o dossier.');
        $document = $proposal->documents()->where('type', ProposalDocumentType::Dossier)->where('source_revision', $proposal->revision)->latest('id')->first();
        if (! $document) {
            $document = $proposal->documents()->create([
                'type' => ProposalDocumentType::Dossier,
                'status' => ProposalDocumentStatus::Pending,
                'disk' => config('proposals.documents.disk'),
                'path' => 'proposals/'.$proposal->id.'/dossier-'.$proposal->revision.'.pdf',
                'source_revision' => $proposal->revision,
                'version' => $proposal->documents()->where('type', ProposalDocumentType::Dossier->value)->max('version') + 1,
                'created_by' => auth()->id(),
                'metadata' => ['ip_address' => request()->ip(), 'user_agent' => request()->userAgent()],
            ]);
        } else {
            $document->update(['status' => ProposalDocumentStatus::Pending, 'error_message' => null, 'created_by' => auth()->id()]);
        }
        GenerateProposalDossier::dispatch($proposal->id, $proposal->revision, $document->id)->afterCommit();
        session()->flash('success', 'Dossier enviado para geração. A proposta permanecerá em revisão até o processamento terminar.');
    }

    public function render(): View
    {
        return view('livewire.proposals.review');
    }
}
