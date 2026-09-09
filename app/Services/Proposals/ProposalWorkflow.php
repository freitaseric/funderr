<?php

namespace App\Services\Proposals;

use App\Enums\CashFlowType;
use App\Enums\JobCategory;
use App\Enums\PatrimonyCategory;
use App\Enums\ProposalStatus;
use App\Enums\ProposalStep;
use App\Models\CreditLine;
use App\Models\Property;
use App\Models\Proposal;
use App\Rules\Cpf;
use Closure;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProposalWorkflow
{
    public function rules(ProposalStep $step, bool $complete): array
    {
        $required = $complete ? 'required' : 'nullable';
        $text = [$required, 'string', 'max:255'];
        $long = [$required, 'string', 'max:10000'];
        $money = [$required, 'numeric', 'min:0', 'max:999999999.99', 'decimal:0,2'];
        $quantity = [$required, 'numeric', 'gt:0', 'max:9999999', 'decimal:0,4'];

        return match ($step) {
            ProposalStep::Initial => [
                'beneficiary_id' => ['required', 'integer', Rule::exists('beneficiaries', 'id')],
                'property_id' => ['required', 'integer', Rule::exists('properties', 'id')],
                'activity' => $text, 'purpose' => $long, 'iater_unit' => $text,
            ],
            ProposalStep::Patrimony => [
                'items' => ['present', 'array', 'max:200'],
                'items.*.category' => ['required', Rule::enum(PatrimonyCategory::class)],
                'items.*.description' => $text, 'items.*.unit' => [$required, 'string', 'max:30'],
                'items.*.quantity' => $quantity, 'items.*.unit_value' => $money,
                'debts' => ['present', 'array', 'max:100'],
                'debts.*.creditor' => $text, 'debts.*.purpose' => $text,
                'debts.*.due_date' => [$required, 'date_format:Y-m-d'], 'debts.*.outstanding_balance' => $money,
            ],
            ProposalStep::Financing => [
                'credit_line_id' => [$required, 'integer', Rule::exists('credit_lines', 'id')->where('active', true)],
                'proposal_value' => [$required, 'numeric', 'gt:0', 'max:999999999.99', 'decimal:0,2'],
                'financeable_percentage' => [$required, 'numeric', 'gt:0', 'max:100'],
                'ater_percentage' => [$required, 'numeric', 'between:0,10'],
                'annual_interest_rate' => [$required, 'numeric', 'between:0,100'],
                'term_years' => [$required, 'integer', 'between:1,7'],
                'grace_years' => [$required, 'integer', 'between:0,6'],
                'grace_interest' => ['required', Rule::in(['PAY', 'CAPITALIZE'])],
                'guarantor.name' => ['nullable', 'string', 'max:255'],
                'guarantor.cpf' => ['nullable', 'string', new Cpf],
                'guarantor.phone' => ['nullable', 'string', 'regex:/^\d{10,11}$/'],
            ],
            ProposalStep::Identification => [
                'purpose' => $long, 'market' => $long, 'last_year_revenue' => $money,
                'location_analysis' => $long, 'considerations' => ['nullable', 'string', 'max:10000'],
                'jobs' => ['present', 'array', 'size:4'],
                'jobs.*.category' => ['required', Rule::enum(JobCategory::class), 'distinct'],
                'jobs.*.current' => [$required, 'integer', 'between:0,32767'],
                'jobs.*.expansion' => [$required, 'integer', 'between:0,32767'],
                'sources' => ['present', 'array', 'max:8'],
                'sources.*.category' => ['required', Rule::in([...array_column(array_slice(PatrimonyCategory::cases(), 0, 6), 'value'), 'OWN', 'OTHER']), 'distinct'],
                'sources.*.planned' => $money,
                'sources.*.realized' => ['nullable', 'numeric', 'min:0', 'max:999999999.99', 'decimal:0,2'],
            ],
            ProposalStep::CashFlow => [
                'items' => ['present', 'array', 'max:200'],
                'items.*.type' => ['required', Rule::enum(CashFlowType::class)],
                'items.*.description' => $text, 'items.*.unit' => [$required, 'string', 'max:30'],
                'items.*.quantity' => $quantity, 'items.*.unit_value' => $money,
                ...collect(range(2, 7))->mapWithKeys(fn (int $year): array => ['items.*.year_'.$year => ['nullable', 'numeric', 'min:0', 'max:999999999.99', 'decimal:0,2']])->all(),
            ],
            ProposalStep::Documents => [],
            ProposalStep::Review => [],
        };
    }

    public function validate(ProposalStep $step, array $input, bool $complete): array
    {
        $input = $this->normalize($input);
        if ($step === ProposalStep::CashFlow) {
            foreach ($input['items'] ?? [] as $key => $item) {
                foreach (range(2, 7) as $year) {
                    $input['items'][$key]['year_'.$year] ??= '0.00';
                }
            }
        }
        $validated = Validator::make($input, $this->rules($step, $complete), [
            'required' => 'Informe :attribute.',
            'numeric' => 'Informe um número válido em :attribute.',
            'integer' => 'Informe um número inteiro em :attribute.',
            'decimal' => ':attribute deve ter no máximo o número de casas decimais permitido.',
            'exists' => 'Selecione uma opção válida em :attribute.',
            'distinct' => ':attribute não pode ser repetido.',
            'min' => ':attribute não pode ser menor que :min.',
            'max' => ':attribute não pode ser maior que :max.',
            'between' => ':attribute deve estar entre :min e :max.',
            'gt' => ':attribute deve ser maior que :value.',
            'date_format' => 'Informe :attribute no formato de data válido.',
        ], $this->validationAttributes($step, $input))->validate();
        if ($step === ProposalStep::Initial && ! Property::whereKey($validated['property_id'])->where('beneficiary_id', $validated['beneficiary_id'])->exists()) {
            throw ValidationException::withMessages(['property_id' => 'A propriedade deve pertencer ao beneficiário selecionado.']);
        }
        if ($step === ProposalStep::Financing) {
            $line = CreditLine::find($validated['credit_line_id'] ?? null);
            $errors = [];
            if ($line) {
                foreach (['proposal_value' => 'financing_limit', 'financeable_percentage' => 'max_financeable_percentage', 'term_years' => 'max_term_years', 'grace_years' => 'max_grace_years'] as $field => $limit) {
                    if (isset($validated[$field]) && $validated[$field] > $line->$limit) {
                        $errors[$field] = 'O valor excede o limite da linha de crédito.';
                    }
                }
                if ($line->requires_guarantor) {
                    $guarantor = $validated['guarantor'] ?? [];
                    if (blank($guarantor['name'] ?? null)) {
                        $errors['guarantor.name'] = 'Informe o nome completo do avalista exigido por esta linha de crédito.';
                    }
                    if (blank($guarantor['cpf'] ?? null)) {
                        $errors['guarantor.cpf'] = 'Informe o CPF do avalista exigido por esta linha de crédito.';
                    }
                    if (blank($guarantor['phone'] ?? null)) {
                        $errors['guarantor.phone'] = 'Informe o telefone do avalista exigido por esta linha de crédito.';
                    }
                }
            }
            if (isset($validated['grace_years'], $validated['term_years']) && $validated['grace_years'] >= $validated['term_years']) {
                $errors['grace_years'] = 'A carência deve ser menor que o prazo total.';
            }
            if ($errors) {
                throw ValidationException::withMessages($errors);
            }
        }
        if ($complete && $step === ProposalStep::CashFlow) {
            $types = array_column($validated['items'], 'type');
            if (! in_array('REVENUE', $types, true) || ! array_intersect(['VARIABLE_COST', 'FIXED_COST'], $types)) {
                throw ValidationException::withMessages(['items' => 'Informe ao menos uma receita e um custo.']);
            }
        }

        return $validated;
    }

    /** @return array<string, mixed> */
    private function normalize(array $input): array
    {
        foreach ($input as $key => $value) {
            if (is_array($value)) {
                $input[$key] = $this->normalize($value);
            } elseif (is_string($value)) {
                $input[$key] = trim($value) === '' ? null : trim($value);
                if (in_array($key, ['cpf', 'phone'], true) && $input[$key] !== null) {
                    $input[$key] = preg_replace('/\D/', '', $input[$key]);
                }
                if (in_array($key, ['quantity', 'unit_value', 'outstanding_balance', 'proposal_value', 'financeable_percentage', 'ater_percentage', 'annual_interest_rate', 'estimated_value', 'last_year_revenue', 'planned', 'realized', 'year_2', 'year_3', 'year_4', 'year_5', 'year_6', 'year_7'], true) && $input[$key] !== null) {
                    $input[$key] = preg_replace('/^R\$\s*/u', '', $input[$key]);
                    if (str_contains($input[$key], ',')) {
                        $input[$key] = str_replace('.', '', $input[$key]);
                        $input[$key] = str_replace(',', '.', $input[$key]);
                    } elseif (preg_match('/^\d{1,3}(?:\.\d{3})+$/', $input[$key])) {
                        $input[$key] = str_replace('.', '', $input[$key]);
                    }
                }
            }
        }

        return $input;
    }

    /** @return array<string, string> */
    private function validationAttributes(ProposalStep $step, array $input = []): array
    {
        $attributes = match ($step) {
            ProposalStep::Initial => [
                'beneficiary_id' => 'o beneficiário', 'property_id' => 'a propriedade',
                'activity' => 'a atividade principal', 'purpose' => 'a finalidade do financiamento', 'iater_unit' => 'a unidade IATER',
            ],
            ProposalStep::Patrimony => [
                'items.*.category' => 'a categoria do item patrimonial', 'items.*.description' => 'a especificação do item patrimonial',
                'items.*.unit' => 'a unidade do item patrimonial', 'items.*.quantity' => 'a quantidade do item patrimonial', 'items.*.unit_value' => 'o valor unitário do item patrimonial',
                'debts.*.creditor' => 'o credor da dívida', 'debts.*.purpose' => 'a finalidade da dívida', 'debts.*.due_date' => 'o vencimento da dívida', 'debts.*.outstanding_balance' => 'o saldo devedor da dívida',
            ],
            ProposalStep::Financing => [
                'credit_line_id' => 'a linha de crédito', 'proposal_value' => 'o valor da proposta', 'financeable_percentage' => 'o percentual financiável',
                'ater_percentage' => 'o percentual de assistência técnica', 'annual_interest_rate' => 'a taxa de juros anual', 'term_years' => 'o prazo total', 'grace_years' => 'o período de carência', 'grace_interest' => 'o tratamento dos juros na carência',
                'guarantor.name' => 'o nome completo do avalista', 'guarantor.cpf' => 'o CPF do avalista', 'guarantor.phone' => 'o telefone do avalista',
            ],
            ProposalStep::Identification => [
                'purpose' => 'a finalidade do projeto', 'market' => 'a descrição do mercado', 'last_year_revenue' => 'o faturamento do último ano',
                'location_analysis' => 'a análise da localização', 'jobs.*.current' => 'o número atual de pessoas na categoria', 'jobs.*.expansion' => 'a expansão de pessoas na categoria',
                'sources.*.planned' => 'o valor a realizar da fonte', 'sources.*.realized' => 'o valor já realizado da fonte',
            ],
            ProposalStep::CashFlow => [
                'items.*.description' => 'a descrição do item do fluxo de caixa', 'items.*.unit' => 'a unidade do item do fluxo de caixa', 'items.*.quantity' => 'a quantidade do item do fluxo de caixa', 'items.*.unit_value' => 'o valor unitário do item do fluxo de caixa',
            ],
            ProposalStep::Documents => [],
            ProposalStep::Review => [],
        };

        if ($step === ProposalStep::CashFlow) {
            foreach ($input['items'] ?? [] as $key => $item) {
                $type = CashFlowType::tryFrom((string) ($item['type'] ?? ''))?->label() ?? 'fluxo de caixa';
                $description = filled($item['description'] ?? null) ? ' “'.$item['description'].'”' : '';
                $base = 'o item de '.mb_strtolower($type).$description;
                $attributes['items.'.$key.'.description'] = 'a descrição '.$base;
                $attributes['items.'.$key.'.unit'] = 'a unidade '.$base;
                $attributes['items.'.$key.'.quantity'] = 'a quantidade '.$base;
                $attributes['items.'.$key.'.unit_value'] = 'o valor unitário '.$base;
                foreach (range(2, 7) as $year) {
                    $attributes['items.'.$key.'.year_'.$year] = 'o valor do Ano '.$year.' '.$base;
                }
            }
        }

        if ($step === ProposalStep::Identification) {
            foreach ($input['jobs'] ?? [] as $key => $job) {
                $category = JobCategory::tryFrom((string) ($job['category'] ?? $key))?->label() ?? 'pessoal';
                $attributes['jobs.'.$key.'.current'] = 'o número atual de pessoas na categoria '.$category;
                $attributes['jobs.'.$key.'.expansion'] = 'a expansão de pessoas na categoria '.$category;
            }
            foreach ($input['sources'] ?? [] as $key => $source) {
                $category = match ((string) ($source['category'] ?? $key)) {
                    'OWN' => 'recursos próprios',
                    'OTHER' => 'outras fontes',
                    default => PatrimonyCategory::tryFrom((string) ($source['category'] ?? $key))?->label() ?? 'a fonte selecionada',
                };
                $attributes['sources.'.$key.'.planned'] = 'o valor a realizar de '.$category;
                $attributes['sources.'.$key.'.realized'] = 'o valor já realizado de '.$category;
            }
        }

        return $attributes;
    }

    public function save(Proposal $proposal, int $revision, ProposalStep $step, bool $complete, Closure $persist): Proposal
    {
        return DB::transaction(function () use ($proposal, $revision, $step, $complete, $persist): Proposal {
            $locked = Proposal::lockForUpdate()->findOrFail($proposal->id);
            Gate::authorize('update', $locked);
            $this->checkRevision($locked, $revision);
            $completed = $locked->completed_steps ?? [];
            if ($complete) {
                foreach (ProposalStep::cases() as $previous) {
                    if ($previous->position() < $step->position() && ! in_array($previous->value, $completed, true)) {
                        throw ValidationException::withMessages(['workflow' => 'Conclua primeiro a etapa '.$previous->label().'.']);
                    }
                }
            }
            $persist($locked);
            $completed = array_values(array_filter($completed, fn (string $value): bool => ProposalStep::from($value)->position() < $step->position()));
            if ($complete) {
                $completed[] = $step->value;
            }
            $locked->forceFill(['completed_steps' => $completed, 'current_step' => $complete ? $step->next() : $step, 'revision' => $revision + 1])->save();

            return $locked;
        });
    }

    public function checkRevision(Proposal $proposal, int $revision): void
    {
        if ($proposal->revision !== $revision) {
            throw ValidationException::withMessages(['workflow' => 'Esta proposta foi alterada em outra tela. Recarregue antes de salvar.']);
        }
    }

    public function stageData(Proposal $proposal, ProposalStep $step): array
    {
        return match ($step) {
            ProposalStep::Initial => $proposal->only(['beneficiary_id', 'property_id', 'activity', 'purpose', 'iater_unit']),
            ProposalStep::Patrimony => ['items' => $proposal->patrimonyItems->toArray(), 'debts' => $proposal->debts->map(fn ($debt): array => [...$debt->toArray(), 'due_date' => $debt->due_date?->format('Y-m-d')])->all()],
            ProposalStep::Financing => [...($proposal->financing?->toArray() ?? ['grace_interest' => 'PAY']), 'guarantor' => tap(['name' => '', 'cpf' => '', 'phone' => ''], function (array &$guarantor) use ($proposal): void {
                $stored = $proposal->guarantees()->where('type', 'AVAL_PESSOAL')->first();
                if ($stored) {
                    $guarantor = ['name' => $stored->guarantor_name, 'cpf' => $stored->guarantor_cpf, 'phone' => $stored->guarantor_phone];
                }
            })],
            ProposalStep::Identification => [...($proposal->identification?->toArray() ?? []), 'purpose' => $proposal->purpose, 'jobs' => $proposal->jobs->toArray(), 'sources' => $proposal->useSources->toArray()],
            ProposalStep::CashFlow => ['items' => $proposal->cashFlowItems->toArray()],
            ProposalStep::Documents, ProposalStep::Review => [],
        };
    }

    /** @return array<string, array<int, string>> */
    public function pending(Proposal $proposal): array
    {
        $pending = [];
        foreach (ProposalStep::cases() as $step) {
            if ($step === ProposalStep::Review) {
                continue;
            }
            try {
                $this->validate($step, $this->stageData($proposal, $step), true);
            } catch (ValidationException $exception) {
                $pending[$step->value] = array_values(array_unique($exception->validator->errors()->all()));
            }
            if (! in_array($step->value, $proposal->completed_steps ?? [], true)) {
                $pending[$step->value][] = 'Salve e conclua esta etapa.';
            }
        }

        $documents = $proposal->documents()->where('source_revision', $proposal->revision)->where('status', 'READY')->get();
        if (! $documents->contains(fn ($document): bool => $document->type->value === 'ATER_CONTRACT')) {
            $pending[ProposalStep::Documents->value][] = 'Gere o contrato ATER da revisão atual.';
        }
        if (! $documents->contains(fn ($document): bool => $document->type->value === 'ATER_CONTRACT_SIGNED')) {
            $pending[ProposalStep::Documents->value][] = 'Anexe o contrato ATER assinado da revisão atual.';
        }

        return $pending;
    }

    public function transition(Proposal $proposal, int $revision, ProposalStatus $target, ?string $reason, ?array $metadata = null): Proposal
    {
        return DB::transaction(function () use ($proposal, $revision, $target, $reason, $metadata): Proposal {
            $locked = Proposal::lockForUpdate()->findOrFail($proposal->id);
            $this->checkRevision($locked, $revision);
            Gate::authorize($target === ProposalStatus::InReview ? 'update' : 'process', $locked);
            $allowed = match ($locked->status) {
                ProposalStatus::Draft, ProposalStatus::Returned => [ProposalStatus::InReview],
                ProposalStatus::InReview => [ProposalStatus::Returned],
                ProposalStatus::ReadyForSend => [ProposalStatus::Returned, ProposalStatus::Sent],
                ProposalStatus::Sent => [ProposalStatus::Returned, ProposalStatus::Released],
                ProposalStatus::Released => [],
            };
            if (! in_array($target, $allowed, true)) {
                throw ValidationException::withMessages(['workflow' => 'Esta transição não é permitida no status atual.']);
            }
            if ($target === ProposalStatus::InReview && $this->pending($locked) !== []) {
                throw ValidationException::withMessages(['workflow' => 'Resolva as pendências antes de encaminhar ou liberar a proposta.']);
            }
            if ($target === ProposalStatus::Returned && blank($reason)) {
                throw ValidationException::withMessages(['reason' => 'A justificativa da devolução é obrigatória.']);
            }
            Validator::make(['reason' => $reason], ['reason' => ['nullable', 'string', 'max:10000']])->validate();
            $locked->history()->create([
                'user_id' => auth()->id(),
                'from_status' => $locked->status,
                'to_status' => $target,
                'reason' => $reason,
                'metadata' => $metadata,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
            $locked->forceFill(['status' => $target, 'current_step' => ProposalStep::Review])->save();

            return $locked;
        });
    }

    public function markDossierReady(Proposal $proposal, int $revision, int $userId, ?string $ipAddress = null, ?string $userAgent = null): Proposal
    {
        return DB::transaction(function () use ($proposal, $revision, $userId, $ipAddress, $userAgent): Proposal {
            $locked = Proposal::lockForUpdate()->findOrFail($proposal->id);
            if ($locked->revision !== $revision || $locked->status !== ProposalStatus::InReview) {
                return $locked;
            }
            $locked->history()->create([
                'user_id' => $userId,
                'from_status' => $locked->status,
                'to_status' => ProposalStatus::ReadyForSend,
                'reason' => 'Dossier gerado com sucesso.',
                'metadata' => ['source_revision' => $revision],
                'ip_address' => $ipAddress,
                'user_agent' => $userAgent,
            ]);
            $locked->forceFill(['status' => ProposalStatus::ReadyForSend, 'current_step' => ProposalStep::Review])->save();

            return $locked;
        });
    }
}
