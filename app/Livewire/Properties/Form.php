<?php

namespace App\Livewire\Properties;

use App\Enums\Municipality;
use App\Enums\OccupancyType;
use App\Enums\PropertyDocumentType;
use App\Models\Beneficiary;
use App\Models\Property;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\View\View;
use Livewire\Attributes\Computed;
use Livewire\Attributes\Locked;
use Livewire\Component;

class Form extends Component
{
    #[Locked]
    public ?int $propertyId = null;

    public string $beneficiaryId = '';

    public string $beneficiarySearch = '';

    public string $denomination = '';

    public string $address = '';

    public string $municipality = '';

    public string $totalArea = '';

    public string $occupancyType = '';

    public int|string $explorationYears = 5;

    public string $documentType = '';

    public string $latitude = '';

    public string $longitude = '';

    public function mount(
        ?Property $property = null
    ): void {
        Gate::authorize('manage-registrations');

        if (! $property?->exists) {
            Gate::authorize('create', Property::class);

            return;
        }

        Gate::authorize('update', $property);

        $this->propertyId = $property->id;

        $this->beneficiaryId =
            (string) $property->beneficiary_id;

        $this->denomination =
            $property->denomination;

        $this->address =
            $property->address;

        $this->municipality =
            $property->municipality->value;

        $this->totalArea =
            (string) $property->total_area;

        $this->occupancyType =
            $property->occupancy_type->value;

        $this->explorationYears =
            $property->exploration_years;

        $this->documentType =
            $property->document_type->value;

        $this->latitude =
            $property->latitude ?? '';

        $this->longitude =
            $property->longitude ?? '';
    }

    #[Computed]
    public function fiscalModuleHectares(): ?int
    {
        return Municipality::tryFrom(
            $this->municipality
        )?->fiscalModuleHectares();
    }

    #[Computed]
    public function availableArea(): ?float
    {
        $area = $this->numericTotalArea();

        if ($area === null) {
            return null;
        }

        return Property::calculateAvailableArea($area);
    }

    private function numericTotalArea(): ?float
    {
        $value = str_replace(
            ',',
            '.',
            trim($this->totalArea)
        );

        if (
            $value === ''
            || ! is_numeric($value)
        ) {
            return null;
        }

        return (float) $value;
    }

    #[Computed]
    public function fiscalModules(): ?float
    {
        $area = $this->numericTotalArea();

        $module = $this->fiscalModuleHectares;

        if (
            $area === null
            || $module === null
            || $module === 0
        ) {
            return null;
        }

        return Property::calculateFiscalModules($area, Municipality::from($this->municipality));
    }

    public function save(): RedirectResponse
    {
        Gate::authorize('manage-registrations');

        $this->normalize();

        $this->validate();

        $editing = $this->propertyId !== null;

        $property = $editing
            ? Property::findOrFail($this->propertyId)
            : new Property;

        Gate::authorize($editing ? 'update' : 'create', $editing ? $property : Property::class);

        if (! $editing) {
            Gate::authorize('view', Beneficiary::findOrFail((int) $this->beneficiaryId));
        }

        if (! $editing) {
            $property->created_by = auth()->id();
            $property->beneficiary_id =
                (int) $this->beneficiaryId;
        }

        $property->fill([
            'denomination' => $this->denomination,

            'address' => $this->address,

            'municipality' => $this->municipality,

            'state' => 'RR',

            'total_area' => $this->totalArea,

            'occupancy_type' => $this->occupancyType,

            'exploration_years' => (int) $this->explorationYears,

            'document_type' => $this->documentType,

            'latitude' => $this->nullableNumber(
                $this->latitude
            ),

            'longitude' => $this->nullableNumber(
                $this->longitude
            ),
        ]);

        $property->save();

        session()->flash(
            'success',
            $editing
                ? 'Propriedade atualizada com sucesso.'
                : 'Propriedade cadastrada com sucesso.'
        );

        return redirect()->route(
            'properties.show',
            $property
        );
    }

    public function updatedOccupancyType(): void
    {
        $occupancyType = OccupancyType::tryFrom($this->occupancyType);
        $documentType = PropertyDocumentType::tryFrom($this->documentType);

        if ($occupancyType === null || $documentType === null) {
            return;
        }

        if (! in_array($documentType, PropertyDocumentType::forOccupancy($occupancyType), true)) {
            $this->documentType = '';
        }
    }

    private function normalize(): void
    {
        $this->denomination =
            trim($this->denomination);

        $this->address =
            trim($this->address);

        $this->totalArea =
            str_replace(
                ',',
                '.',
                trim($this->totalArea)
            );

        $this->latitude =
            str_replace(
                ',',
                '.',
                trim($this->latitude)
            );

        $this->longitude =
            str_replace(
                ',',
                '.',
                trim($this->longitude)
            );
    }

    private function nullableNumber(
        string $value
    ): ?string {
        return trim($value) === ''
            ? null
            : $value;
    }

    public function render(): View
    {
        return view(
            'livewire.properties.form',
            [
                'beneficiaries' => $this->beneficiaryOptions(),

                'municipalities' => Municipality::cases(),

                'occupancyTypes' => OccupancyType::cases(),

                'documentTypes' => $this->documentTypes(),
            ]
        );
    }

    private function beneficiaryOptions(): Collection
    {
        $search = mb_substr(trim($this->beneficiarySearch), 0, 255);
        $query = Beneficiary::query()->visibleTo(auth()->user())->select(['id', 'name', 'cpf']);
        if ($this->propertyId !== null) {
            return $query->whereKey(Property::findOrFail($this->propertyId)->beneficiary_id)->get();
        }
        $options = $query->when($search !== '', function (Builder $query) use ($search): void {
            $query->where(function (Builder $query) use ($search): void {
                $query->whereRaw('LOWER(name) LIKE ?', ['%'.mb_strtolower($search).'%']);
                $digits = preg_replace('/\D/', '', $search);
                if ($digits !== '') {
                    $query->orWhere('cpf', 'like', '%'.$digits.'%');
                }
            });
        })->when($search !== '', function (Builder $query) use ($search): void {
            $digits = preg_replace('/\D/', '', $search);
            if ($digits !== '') {
                $query->orderByRaw('case when cpf = ? then 0 when cpf like ? then 1 else 2 end', [$digits, $digits.'%']);

                return;
            }

            $normalizedSearch = mb_strtolower($search);
            $query->orderByRaw('case when lower(name) = ? then 0 when lower(name) like ? then 1 else 2 end', [$normalizedSearch, $normalizedSearch.'%']);
        }, function (Builder $query): void {
            $query->latest();
        })->orderBy('name')->limit(20)->get();

        if (ctype_digit($this->beneficiaryId) && ! $options->contains('id', (int) $this->beneficiaryId)) {
            $selected = Beneficiary::query()->visibleTo(auth()->user())->select(['id', 'name', 'cpf'])->find($this->beneficiaryId);
            if ($selected) {
                $options->push($selected);
            }
        }

        return $options;
    }

    protected function rules(): array
    {
        $documentTypeRules = [
            'required',
            Rule::enum(PropertyDocumentType::class),
        ];

        $occupancyType = OccupancyType::tryFrom($this->occupancyType);
        if ($occupancyType !== null) {
            $documentTypeRules[] = Rule::in(array_column(PropertyDocumentType::forOccupancy($occupancyType), 'value'));
        }

        return [
            'beneficiaryId' => [
                'required',
                'integer',
                Rule::exists('beneficiaries', 'id'),
            ],

            'denomination' => [
                'required',
                'string',
                'max:255',
            ],

            'address' => [
                'required',
                'string',
            ],

            'municipality' => [
                'required',
                Rule::enum(Municipality::class),
            ],

            'totalArea' => [
                'required',
                'numeric',
                'gt:0',
                'max:99999999.9999',
                'decimal:0,4',
            ],

            'occupancyType' => [
                'required',
                Rule::enum(OccupancyType::class),
            ],

            'explorationYears' => [
                'required',
                'integer',
                'min:0',
                'max:32767',
            ],

            'documentType' => $documentTypeRules,

            'latitude' => [
                'nullable',
                'numeric',
                'between:-90,90',
                'required_with:longitude',
            ],

            'longitude' => [
                'nullable',
                'numeric',
                'between:-180,180',
                'required_with:latitude',
            ],
        ];
    }

    protected function messages(): array
    {
        return [
            'beneficiaryId.required' => 'Selecione o beneficiário.',

            'denomination.required' => 'Informe a denominação da propriedade.',

            'address.required' => 'Informe o endereço da propriedade.',

            'municipality.required' => 'Selecione o município.',

            'totalArea.required' => 'Informe a área total.',

            'totalArea.gt' => 'A área total deve ser maior que zero.',

            'occupancyType.required' => 'Selecione a forma de ocupação.',

            'explorationYears.required' => 'Informe o tempo de exploração.',

            'documentType.required' => 'Selecione o documento existente.',

            'documentType.in' => 'Selecione um documento compatível com a forma de ocupação.',

            'latitude.required_with' => 'Informe também a latitude.',

            'longitude.required_with' => 'Informe também a longitude.',
        ];
    }

    /** @return array<int, PropertyDocumentType> */
    private function documentTypes(): array
    {
        $occupancyType = OccupancyType::tryFrom($this->occupancyType);

        return $occupancyType === null
            ? []
            : PropertyDocumentType::forOccupancy($occupancyType);
    }
}
