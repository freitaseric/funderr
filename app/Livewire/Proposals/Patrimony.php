<?php

namespace App\Livewire\Proposals;

use App\Enums\PatrimonyCategory;
use App\Enums\PatrimonyUnit;
use App\Enums\ProposalStep;
use App\Models\Proposal;
use App\Services\Proposals\ProposalCalculator;
use Illuminate\Support\Str;
use Illuminate\View\View;
use Livewire\Attributes\Computed;

class Patrimony extends StepEditor
{
    public array $items = [];

    public array $debts = [];

    public array $newItem = ['category' => '', 'description' => '', 'unit' => '', 'quantity' => '', 'unit_value' => ''];

    public function step(): ProposalStep
    {
        return ProposalStep::Patrimony;
    }

    protected function loadData(array $data): void
    {
        $this->items = $this->keyed($data['items']);
        $this->debts = $this->keyed($data['debts']);
    }

    public function addItem(?string $category = null): void
    {
        $category ??= $this->newItem['category'];
        if (! PatrimonyCategory::tryFrom((string) $category)) {
            $this->addError('newItem.category', 'Selecione uma categoria para adicionar o item.');

            return;
        }
        if (count($this->items) >= 200) {
            $this->addError('newItem.category', 'O limite de 200 itens patrimoniais foi atingido.');

            return;
        }

        $this->items[(string) Str::uuid()] = [...$this->newItem, 'category' => $category];
        $this->newItem = ['category' => '', 'description' => '', 'unit' => '', 'quantity' => '', 'unit_value' => ''];
        $this->resetValidation('newItem.category');
    }

    public function removeItem(string $key): void
    {
        unset($this->items[$key]);
    }

    public function addDebt(): void
    {
        abort_if(count($this->debts) >= 100, 422);
        $this->debts[(string) Str::uuid()] = ['creditor' => '', 'purpose' => '', 'due_date' => '', 'outstanding_balance' => ''];
    }

    public function removeDebt(string $key): void
    {
        unset($this->debts[$key]);
    }

    #[Computed]
    public function debtCreditors(): array
    {
        $beneficiary = $this->proposal->beneficiary;
        $options = [['value' => $beneficiary->name, 'label' => $beneficiary->name.' (beneficiário)']];
        if ($beneficiary->spouse_name) {
            $options[] = ['value' => $beneficiary->spouse_name, 'label' => $beneficiary->spouse_name.' (cônjuge)'];
        }

        return $options;
    }

    #[Computed]
    public function totals(): array
    {
        return app(ProposalCalculator::class)->patrimony($this->items, $this->debts);
    }

    public function save(bool $complete = false): void
    {
        $data = $this->validatedStep(['items' => $this->items, 'debts' => $this->debts], $complete);
        $this->persist($complete, function (Proposal $proposal) use ($data): void {
            $proposal->patrimonyItems()->delete();
            $proposal->patrimonyItems()->createMany(array_values($data['items']));
            $proposal->debts()->delete();
            $proposal->debts()->createMany(array_values($data['debts']));
        });
    }

    public function render(): View
    {
        return view('livewire.proposals.patrimony', ['categories' => PatrimonyCategory::cases(), 'units' => PatrimonyUnit::cases()]);
    }
}
