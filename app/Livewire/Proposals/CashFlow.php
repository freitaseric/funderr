<?php

namespace App\Livewire\Proposals;

use App\Enums\CashFlowType;
use App\Enums\ProposalStep;
use App\Models\Proposal;
use App\Services\Proposals\ProposalCalculator;
use Illuminate\Support\Str;
use Illuminate\View\View;
use Livewire\Attributes\Computed;

class CashFlow extends StepEditor
{
    public array $items = [];

    public function step(): ProposalStep
    {
        return ProposalStep::CashFlow;
    }

    protected function loadData(array $data): void
    {
        $this->items = $this->keyed($data['items']);
    }

    public function addItem(string $type): void
    {
        abort_unless(CashFlowType::tryFrom($type) && count($this->items) < 200, 422);
        $this->items[(string) Str::uuid()] = ['type' => $type, 'description' => '', 'unit' => '', 'quantity' => '', 'unit_value' => '', ...array_fill_keys(array_map(fn (int $year): string => 'year_'.$year, range(2, 7)), null)];
    }

    public function removeItem(string $key): void
    {
        unset($this->items[$key]);
    }

    #[Computed]
    public function summary(): array
    {
        $calculator = app(ProposalCalculator::class);
        $financing = $calculator->financing($this->proposal->financing?->toArray() ?? []);

        return $calculator->cashFlow($this->items, $financing['schedule']);
    }

    public function save(bool $complete = false): void
    {
        $data = $this->validatedStep(['items' => $this->items], $complete);
        $this->persist($complete, function (Proposal $proposal) use ($data): void {
            $proposal->cashFlowItems()->delete();
            $proposal->cashFlowItems()->createMany(array_values($data['items']));
        });
    }

    public function render(): View
    {
        return view('livewire.proposals.cash-flow');
    }
}
