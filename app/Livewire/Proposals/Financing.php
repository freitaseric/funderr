<?php

namespace App\Livewire\Proposals;

use App\Enums\ProposalStep;
use App\Models\CreditLine;
use App\Models\Proposal;
use App\Services\Proposals\ProposalCalculator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\View\View;
use Livewire\Attributes\Computed;

class Financing extends StepEditor
{
    public array $data = ['credit_line_id' => '', 'proposal_value' => '', 'financeable_percentage' => '', 'ater_percentage' => '', 'annual_interest_rate' => '', 'term_years' => '', 'grace_years' => '', 'grace_interest' => 'PAY'];

    public string $creditLineSearch = '';

    public array $guarantor = ['name' => '', 'cpf' => '', 'phone' => ''];

    public function step(): ProposalStep
    {
        return ProposalStep::Financing;
    }

    protected function loadData(array $data): void
    {
        $this->data = array_replace($this->data, array_intersect_key($data, $this->data));
        foreach (['financeable_percentage', 'ater_percentage', 'annual_interest_rate'] as $field) {
            $this->data[$field] = $this->normalizePercentage($this->data[$field]);
        }
        $this->guarantor = array_replace($this->guarantor, $data['guarantor'] ?? []);
    }

    public function updatedData(mixed $value, ?string $key): void
    {
        if ($key !== 'credit_line_id') {
            return;
        }
        $line = CreditLine::where('active', true)->find($value);
        if (! $line) {
            return;
        }
        if (! $line->requires_guarantor) {
            $this->guarantor = ['name' => '', 'cpf' => '', 'phone' => ''];
        }
        $this->data = [...$this->data, 'financeable_percentage' => $this->normalizePercentage($line->max_financeable_percentage), 'ater_percentage' => $this->normalizePercentage($line->default_ater_percentage), 'annual_interest_rate' => $this->normalizePercentage($line->annual_interest_rate), 'term_years' => $line->max_term_years, 'grace_years' => $line->max_grace_years];
    }

    #[Computed]
    public function calculation(): array
    {
        return app(ProposalCalculator::class)->financing($this->data);
    }

    public function save(bool $complete = false): void
    {
        $data = $this->validatedStep([...$this->data, 'guarantor' => $this->guarantor], $complete);
        $this->persist($complete, function (Proposal $proposal) use ($data): void {
            $financing = $data;
            unset($financing['guarantor']);
            $proposal->financing()->updateOrCreate([], $financing);
            $proposal->guarantees()->delete();
            $line = CreditLine::find($data['credit_line_id']);
            if ($line?->requires_guarantor && ($data['guarantor']['name'] ?? false)) {
                $proposal->guarantees()->create(['type' => 'AVAL_PESSOAL', 'guarantor_name' => $data['guarantor']['name'], 'guarantor_cpf' => $data['guarantor']['cpf'], 'guarantor_phone' => $data['guarantor']['phone']]);
            }
        });
    }

    public function render(): View
    {
        return view('livewire.proposals.financing', ['lines' => $this->creditLines()]);
    }

    private function creditLines(): Collection
    {
        $search = mb_substr(trim($this->creditLineSearch), 0, 255);
        $lines = CreditLine::query()
            ->where('active', true)
            ->select(['id', 'name', 'requires_guarantor', 'financing_limit', 'max_term_years', 'max_grace_years', 'notes'])
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query->whereRaw('LOWER(name) LIKE ?', ['%'.mb_strtolower($search).'%']);
                });
            })->when($search !== '', function (Builder $query) use ($search): void {
                $normalizedSearch = mb_strtolower($search);
                $query->orderByRaw('case when lower(name) = ? then 0 when lower(name) like ? then 1 else 2 end', [$normalizedSearch, $normalizedSearch.'%']);
            }, function (Builder $query): void {
                $query->latest();
            })->orderBy('name')
            ->limit(20)
            ->get();

        $creditLineId = $this->data['credit_line_id'];
        if (is_scalar($creditLineId) && ctype_digit((string) $creditLineId) && ! $lines->contains('id', (int) $creditLineId)) {
            $selected = CreditLine::query()
                ->where('active', true)
                ->select(['id', 'name', 'requires_guarantor', 'financing_limit', 'max_term_years', 'max_grace_years', 'notes'])
                ->find($creditLineId);

            if ($selected) {
                $lines->push($selected);
            }
        }

        return $lines;
    }

    private function normalizePercentage(mixed $value): string
    {
        $value = str_replace(',', '.', trim((string) $value));

        if ($value === '' || ! str_contains($value, '.')) {
            return $value;
        }

        return rtrim(rtrim($value, '0'), '.');
    }
}
