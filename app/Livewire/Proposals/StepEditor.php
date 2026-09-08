<?php

namespace App\Livewire\Proposals;

use App\Enums\ProposalStep;
use App\Models\Proposal;
use App\Services\Proposals\ProposalWorkflow;
use Closure;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Livewire\Attributes\Computed;
use Livewire\Attributes\Locked;
use Livewire\Component;

abstract class StepEditor extends Component
{
    #[Locked]
    public int $proposalId;

    #[Locked]
    public int $revision;

    abstract public function step(): ProposalStep;

    public function mount(Proposal $proposal): void
    {
        Gate::authorize('view', $proposal);
        $this->proposalId = $proposal->id;
        $this->revision = $proposal->revision ?? 0;
        $this->loadData(app(ProposalWorkflow::class)->stageData($proposal, $this->step()));
    }

    abstract protected function loadData(array $data): void;

    #[Computed]
    public function proposal(): Proposal
    {
        $proposal = Proposal::with(['beneficiary', 'property'])->findOrFail($this->proposalId);
        Gate::authorize('view', $proposal);

        return $proposal;
    }

    protected function persist(bool $complete, Closure $callback): void
    {
        $proposal = app(ProposalWorkflow::class)->save($this->proposal, $this->revision, $this->step(), $complete, $callback);
        $this->revision = $proposal->revision;
        unset($this->proposal);
        session()->flash('success', $complete ? 'Etapa concluída.' : 'Rascunho salvo.');
        if ($complete) {
            $this->redirectRoute('proposals.edit', ['proposal' => $proposal, 'step' => $proposal->current_step->value]);
        }
    }

    protected function keyed(array $items): array
    {
        $rows = [];
        foreach ($items as $item) {
            $rows[(string) Str::uuid()] = $item;
        }

        return $rows;
    }

    protected function validatedStep(array $data, bool $complete): array
    {
        Gate::authorize('update', $this->proposal);

        return app(ProposalWorkflow::class)->validate($this->step(), $data, $complete);
    }
}
