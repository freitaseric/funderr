<?php

namespace App\Livewire\Beneficiaries;

use App\Enums\EducationLevel;
use App\Enums\MaritalStatus;
use App\Models\Beneficiary;
use App\Rules\Cpf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\View\View;
use Livewire\Attributes\Computed;
use Livewire\Attributes\Locked;
use Livewire\Component;
use Throwable;

class Form extends Component
{
    #[Locked]
    public ?int $beneficiaryId = null;

    public string $name = '';

    public string $nickname = '';

    public string $cpf = '';

    public string $rg = '';

    public string $phone = '';

    public string $birthDate = '';

    public string $placeOfBirth = '';

    public string $maritalStatus = '';

    public string $educationLevel = '';

    public int|string $dependents = 0;

    public string $address = '';

    public string $spouseName = '';

    public string $spouseCpf = '';

    public string $spouseRg = '';

    public array $references = [
        [
            'name' => '',
            'phone' => '',
        ],
        [
            'name' => '',
            'phone' => '',
        ],
    ];

    public function mount(?Beneficiary $beneficiary = null): void
    {
        Gate::authorize('manage-registrations');

        if (! $beneficiary?->exists) {
            Gate::authorize('create', Beneficiary::class);

            return;
        }

        Gate::authorize('update', $beneficiary);

        $beneficiary->load('references');

        $this->beneficiaryId = $beneficiary->id;

        $this->name = $beneficiary->name;
        $this->nickname = $beneficiary->nickname ?? '';

        $this->cpf = $beneficiary->cpf;
        $this->rg = $beneficiary->rg ?? '';
        $this->phone = $beneficiary->phone;

        $this->birthDate =
            $beneficiary->birth_date->format('Y-m-d');

        $this->placeOfBirth =
            $beneficiary->place_of_birth;

        $this->maritalStatus =
            $beneficiary->marital_status->value;

        $this->educationLevel =
            $beneficiary->education_level->value;

        $this->dependents =
            $beneficiary->dependents;

        $this->address =
            $beneficiary->address;

        $this->spouseName =
            $beneficiary->spouse_name ?? '';

        $this->spouseCpf =
            $beneficiary->spouse_cpf ?? '';

        $this->spouseRg =
            $beneficiary->spouse_rg ?? '';

        foreach ($beneficiary->references as $reference) {
            $index = $reference->position - 1;

            if (! isset($this->references[$index])) {
                continue;
            }

            $this->references[$index] = [
                'name' => $reference->name,
                'phone' => $reference->phone,
            ];
        }
    }

    public function updatedMaritalStatus(): void
    {
        if ($this->hasSpouse()) {
            return;
        }

        $this->spouseName = '';
        $this->spouseCpf = '';
        $this->spouseRg = '';

        $this->resetValidation([
            'spouseName',
            'spouseCpf',
            'spouseRg',
        ]);
    }

    #[Computed]
    public function hasSpouse(): bool
    {
        return in_array(
            $this->maritalStatus,
            [
                MaritalStatus::Married->value,
                MaritalStatus::StableUnion->value,
            ],
            true
        );
    }

    /**
     * @throws Throwable
     */
    public function save(): RedirectResponse
    {
        Gate::authorize('manage-registrations');

        $this->normalize();

        $this->validate();

        $editing = $this->beneficiaryId !== null;
        $beneficiary = $editing
            ? Beneficiary::findOrFail($this->beneficiaryId)
            : new Beneficiary;

        Gate::authorize($editing ? 'update' : 'create', $editing ? $beneficiary : Beneficiary::class);

        $beneficiary = DB::transaction(function () use ($beneficiary, $editing) {
            $beneficiary->fill([
                'created_by' => $editing ? $beneficiary->created_by : auth()->id(),
                'name' => $this->name,
                'nickname' => $this->nullable(
                    $this->nickname
                ),

                'cpf' => $this->cpf,
                'rg' => $this->nullable(
                    $this->rg
                ),
                'phone' => $this->phone,

                'birth_date' => $this->birthDate,
                'place_of_birth' => $this->placeOfBirth,

                'marital_status' => $this->maritalStatus,

                'education_level' => $this->educationLevel,

                'dependents' => (int) $this->dependents,

                'address' => $this->address,

                'spouse_name' => $this->hasSpouse()
                    ? $this->nullable($this->spouseName)
                    : null,

                'spouse_cpf' => $this->hasSpouse()
                    ? $this->nullable($this->spouseCpf)
                    : null,

                'spouse_rg' => $this->hasSpouse()
                    ? $this->nullable($this->spouseRg)
                    : null,
            ]);

            $beneficiary->save();

            $beneficiary->references()->delete();

            foreach ($this->references as $index => $reference) {
                $beneficiary->references()->create([
                    'position' => $index + 1,
                    'name' => trim($reference['name']),
                    'phone' => $reference['phone'],
                ]);
            }

            return $beneficiary;
        });

        session()->flash(
            'success',
            $this->beneficiaryId
                ? 'Beneficiário atualizado com sucesso.'
                : 'Beneficiário cadastrado com sucesso.'
        );

        return redirect()->route(
            'beneficiaries.show',
            $beneficiary
        );
    }

    private function normalize(): void
    {
        $this->name = trim($this->name);
        $this->nickname = trim($this->nickname);

        $this->cpf = $this->digits($this->cpf);
        $this->rg = trim($this->rg);
        $this->phone = $this->digits($this->phone);

        $this->placeOfBirth =
            trim($this->placeOfBirth);

        $this->address =
            trim($this->address);

        $this->spouseName =
            trim($this->spouseName);

        $this->spouseCpf =
            $this->digits($this->spouseCpf);

        $this->spouseRg =
            trim($this->spouseRg);

        foreach ($this->references as $index => $reference) {
            $this->references[$index]['name'] =
                trim((string) ($reference['name'] ?? ''));

            $this->references[$index]['phone'] =
                $this->digits(
                    $reference['phone'] ?? ''
                );
        }
    }

    private function digits(mixed $value): string
    {
        return preg_replace(
            '/\D/',
            '',
            (string) $value
        ) ?? '';
    }

    private function nullable(string $value): ?string
    {
        return trim($value) === ''
            ? null
            : trim($value);
    }

    public function render(): View
    {
        return view(
            'livewire.beneficiaries.form',
            [
                'maritalStatuses' => MaritalStatus::cases(),

                'educationLevels' => EducationLevel::cases(),
            ]
        );
    }

    protected function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'nickname' => [
                'nullable',
                'string',
                'max:255',
            ],

            'cpf' => [
                'required',
                'string',
                'size:11',
                new Cpf,
                Rule::unique('beneficiaries', 'cpf')
                    ->ignore($this->beneficiaryId),
            ],

            'rg' => [
                'nullable',
                'string',
                'max:50',
            ],

            'phone' => [
                'required',
                'string',
                'min:10',
                'max:11',
            ],

            'birthDate' => [
                'required',
                'date',
                'before_or_equal:today',
            ],

            'placeOfBirth' => [
                'required',
                'string',
                'max:255',
            ],

            'maritalStatus' => [
                'required',
                Rule::enum(MaritalStatus::class),
            ],

            'educationLevel' => [
                'required',
                Rule::enum(EducationLevel::class),
            ],

            'dependents' => [
                'required',
                'integer',
                'min:0',
                'max:32767',
            ],

            'address' => [
                'required',
                'string',
            ],

            'spouseName' => [
                Rule::requiredIf(
                    fn () => $this->hasSpouse()
                ),
                'nullable',
                'string',
                'max:255',
            ],

            'spouseCpf' => [
                Rule::requiredIf(
                    fn () => $this->hasSpouse()
                ),
                'nullable',
                'string',
                'size:11',
                new Cpf,
            ],

            'spouseRg' => [
                'nullable',
                'string',
                'max:50',
            ],

            'references' => [
                'required',
                'array',
                'size:2',
            ],

            'references.*.name' => [
                'required',
                'string',
                'max:255',
            ],

            'references.*.phone' => [
                'required',
                'string',
                'min:10',
                'max:11',
            ],
        ];
    }

    protected function messages(): array
    {
        return [
            'name.required' => 'Informe o nome do beneficiário.',

            'cpf.required' => 'Informe o CPF.',

            'cpf.size' => 'O CPF deve conter 11 dígitos.',

            'cpf.unique' => 'Já existe um beneficiário com este CPF.',

            'phone.required' => 'Informe o telefone.',

            'birthDate.before_or_equal' => 'A data de nascimento não pode estar no futuro.',

            'birthDate.required' => 'Informe a data de nascimento.',

            'placeOfBirth.required' => 'Informe a naturalidade.',

            'maritalStatus.required' => 'Selecione o estado civil.',

            'educationLevel.required' => 'Selecione a escolaridade.',

            'dependents.required' => 'Informe o número de dependentes.',

            'address.required' => 'Informe o endereço.',

            'spouseName.required' => 'Informe o nome do cônjuge.',

            'spouseCpf.required' => 'Informe o CPF do cônjuge.',

            'references.0.name.required' => 'Informe o nome da primeira referência.',

            'references.0.phone.required' => 'Informe o telefone da primeira referência.',

            'references.1.name.required' => 'Informe o nome da segunda referência.',

            'references.1.phone.required' => 'Informe o telefone da segunda referência.',
        ];
    }
}
