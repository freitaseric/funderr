<?php

namespace App\Livewire\Proposals;

use App\Enums\ProposalStatus;
use App\Enums\ProposalStep;
use App\Services\Proposals\ProposalCalculator;
use App\Services\Proposals\ProposalWorkflow;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\View\View;
use Livewire\Attributes\Computed;

class Review extends StepEditor
{
    public string $reason = '';

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
            ProposalStatus::InReview => [ProposalStatus::Returned, ProposalStatus::Released],
            ProposalStatus::Released => [ProposalStatus::Returned, ProposalStatus::Sent],
            ProposalStatus::Sent => [ProposalStatus::BankReturned],
            ProposalStatus::BankReturned => [ProposalStatus::Returned, ProposalStatus::Completed],
            ProposalStatus::Completed => [],
        };
    }

    public function transitionStatus(string $status): void
    {
        $target = ProposalStatus::tryFrom($status);
        abort_unless($target, 422);
        $proposal = app(ProposalWorkflow::class)->transition($this->proposal, $this->revision, $target, $this->reason);
        $this->revision = $proposal->revision;
        $this->reason = '';
        unset($this->proposal, $this->summary, $this->pending);
        session()->flash('success', 'Tramitação registrada: '.$target->label().'.');
    }

    public function transitionLabel(ProposalStatus $target): string
    {
        return match ($target) {
            ProposalStatus::InReview => 'Enviar para análise',
            ProposalStatus::Returned => 'Devolver para correção',
            ProposalStatus::Released => 'Liberar proposta',
            ProposalStatus::Sent => 'Registrar envio ao banco',
            ProposalStatus::BankReturned => 'Registrar retorno do banco',
            ProposalStatus::Completed => 'Concluir proposta',
            ProposalStatus::Draft => 'Manter como rascunho',
        };
    }

    public function render(): View
    {
        return view('livewire.proposals.review');
    }
}
