<?php

namespace App\Livewire\CreditLines;

use App\Models\CreditLine;
use App\Support\Money;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\View\View;
use Livewire\Component;

class Form extends Component
{
    public ?int $creditLineId = null;

    public string $name = '';

    public bool $active = true;

    public bool $requiresGuarantor = false;

    public string $financingLimit = '';

    public string $annualInterestRate = '';

    public string $maxTermYears = '';

    public string $maxGraceYears = '';

    public string $maxFinanceablePercentage = '';

    public string $defaultAterPercentage = '';

    public string $notes = '';

    public function mount(?CreditLine $creditLine = null): void
    {
        Gate::authorize('manage-credit-lines');
        if (! $creditLine?->exists) {
            return;
        }
        $this->creditLineId = $creditLine->id;
        $this->name = $creditLine->name;
        $this->active = $creditLine->active;
        $this->requiresGuarantor = $creditLine->requires_guarantor;
        $this->financingLimit = (string) $creditLine->financing_limit;
        $this->annualInterestRate = (string) $creditLine->annual_interest_rate;
        $this->maxTermYears = (string) $creditLine->max_term_years;
        $this->maxGraceYears = (string) $creditLine->max_grace_years;
        $this->maxFinanceablePercentage = (string) $creditLine->max_financeable_percentage;
        $this->defaultAterPercentage = (string) $creditLine->default_ater_percentage;
        $this->notes = $creditLine->notes ?? '';
    }

    public function save(): RedirectResponse
    {
        Gate::authorize('manage-credit-lines');
        $this->normalize();
        $data = $this->validate($this->rules(), [
            'required' => 'Informe :attribute.',
            'string' => ':attribute deve ser informado como texto.',
            'numeric' => 'Informe um número válido em :attribute.',
            'integer' => 'Informe um número inteiro em :attribute.',
            'min' => ':attribute deve ter no mínimo :min caracteres ou valor :min.',
            'max' => ':attribute não pode ultrapassar :max.',
            'gt' => ':attribute deve ser maior que :value.',
            'gte' => ':attribute deve ser igual ou maior que :value.',
            'lte' => ':attribute deve ser igual ou menor que :value.',
            'lt' => ':attribute deve ser menor que :value.',
            'unique' => 'Já existe uma linha de crédito com este :attribute.',
        ], [
            'name' => 'o nome da linha de crédito', 'active' => 'o status da linha', 'requiresGuarantor' => 'a configuração de avalista',
            'financingLimit' => 'o teto de financiamento', 'annualInterestRate' => 'a taxa anual', 'maxTermYears' => 'o prazo máximo',
            'maxGraceYears' => 'a carência máxima', 'maxFinanceablePercentage' => 'o percentual financiável máximo', 'defaultAterPercentage' => 'o percentual padrão de ATER', 'notes' => 'as observações',
        ]);
        $line = $this->creditLineId ? CreditLine::findOrFail($this->creditLineId) : new CreditLine;
        $line->fill([
            'name' => $data['name'], 'active' => $data['active'], 'requires_guarantor' => $data['requiresGuarantor'],
            'financing_limit' => $data['financingLimit'], 'annual_interest_rate' => $data['annualInterestRate'],
            'max_term_years' => $data['maxTermYears'], 'max_grace_years' => $data['maxGraceYears'],
            'max_financeable_percentage' => $data['maxFinanceablePercentage'], 'default_ater_percentage' => $data['defaultAterPercentage'],
            'notes' => $this->nullable($data['notes']),
        ])->save();
        session()->flash('success', $this->creditLineId ? 'Linha de crédito atualizada com sucesso.' : 'Linha de crédito cadastrada com sucesso.');

        return redirect()->route('admin.credit-lines.index');
    }

    protected function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:3', 'max:255'], 'active' => ['required', 'boolean'], 'requiresGuarantor' => ['required', 'boolean'],
            'financingLimit' => ['required', 'numeric', 'gt:0'],
            'annualInterestRate' => ['required', 'numeric', 'gte:0'], 'maxTermYears' => ['required', 'integer', 'min:1'],
            'maxGraceYears' => ['required', 'integer', 'min:0', 'lt:maxTermYears'],
            'maxFinanceablePercentage' => ['required', 'numeric', 'gt:0', 'lte:100'],
            'defaultAterPercentage' => ['required', 'numeric', 'gte:0', 'lte:10'], 'notes' => ['nullable', 'string'],
        ];
    }

    private function normalize(): void
    {
        $this->name = trim($this->name);
        $this->notes = trim($this->notes);
        foreach (['financingLimit', 'annualInterestRate', 'maxFinanceablePercentage', 'defaultAterPercentage'] as $field) {
            $value = preg_replace('/^R\$\s*/u', '', trim($this->{$field}));
            if ($field === 'financingLimit') {
                $this->{$field} = Money::from($value)->toDecimal();
            } else {
                $this->{$field} = str_replace(',', '.', $value);
            }
        }
    }

    private function nullable(string $value): ?string
    {
        return $value === '' ? null : $value;
    }

    public function render(): View
    {
        return view('livewire.credit-lines.form');
    }
}
