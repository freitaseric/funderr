<div class="flex flex-col gap-6">

    <x-proposal-feedback anchor-prefix="" />

    <header>
        <a
            href="{{ route('properties.index') }}"
            class="link link-hover text-sm"
        >
            ← Propriedades
        </a>

        <h1 class="mt-3 text-3xl font-semibold">
            {{ $propertyId
                ? 'Editar propriedade'
                : 'Nova propriedade'
            }}
        </h1>
    </header>

    <form
        wire:submit="save"
        class="flex flex-col gap-6"
    >

        <section class="card bg-base-100 shadow">
            <div class="card-body gap-5">

                <h2 class="card-title">
                    Identificação
                </h2>

                <div class="grid gap-4 md:grid-cols-2">

                    <fieldset class="fieldset">
                        <label for="beneficiaryId" class="fieldset-label">
                            Beneficiário *
                        </label>

                        <x-searchable-select
                            id="beneficiaryId"
                            model="beneficiaryId"
                            :value="$beneficiaryId"
                            :options="$beneficiaries->map(fn ($beneficiary) => ['value' => $beneficiary->id, 'label' => $beneficiary->name.' — '.(auth()->user()->isAdministrator() ? $beneficiary->formattedCpf() : $beneficiary->maskedCpf())])->all()"
                            placeholder="Selecione"
                            search-placeholder="Buscar por nome ou CPF"
                            :search-model="$propertyId ? null : 'beneficiarySearch'"
                            :disabled="(bool) $propertyId"
                            aria-describedby="beneficiaryId-error"
                            aria-invalid="{{ $errors->has('beneficiaryId') ? 'true' : 'false' }}"
                        />
                        @if (! $propertyId)
                            <p class="text-sm">Exibindo até 20 resultados mais relevantes, além do beneficiário selecionado.</p>
                        @endif

                        @error('beneficiaryId')
                        <p id="beneficiaryId-error" role="alert" class="text-error text-sm">
                            {{ $message }}
                        </p>
                        @enderror
                    </fieldset>

                    <fieldset class="fieldset">
                        <label for="denomination" class="fieldset-label">
                            Denominação *
                        </label>

                        <input
                            wire:model="denomination"
                            id="denomination"
                            aria-describedby="denomination-error"
                            aria-invalid="{{ $errors->has('denomination') ? 'true' : 'false' }}"
                            type="text"
                            class="input w-full"
                            placeholder="Ex.: Sítio Boa Esperança"
                        >

                        @error('denomination')
                        <p id="denomination-error" role="alert" class="text-error text-sm">
                            {{ $message }}
                        </p>
                        @enderror
                    </fieldset>

                </div>
            </div>
        </section>

        <section class="card bg-base-100 shadow">
            <div class="card-body gap-5">

                <h2 class="card-title">
                    Localização
                </h2>

                <div class="grid gap-4 md:grid-cols-2">

                    <fieldset class="fieldset md:col-span-2">
                        <label for="address" class="fieldset-label">
                            Endereço *
                        </label>

                        <textarea
                            wire:model="address"
                            id="address"
                            aria-describedby="address-error"
                            aria-invalid="{{ $errors->has('address') ? 'true' : 'false' }}"
                            rows="3"
                            class="textarea w-full"
                        ></textarea>

                        @error('address')
                        <p id="address-error" role="alert" class="text-error text-sm">
                            {{ $message }}
                        </p>
                        @enderror
                    </fieldset>

                    <fieldset class="fieldset">
                        <label for="municipality" class="fieldset-label">
                            Município *
                        </label>

                        <x-searchable-select
                            id="municipality"
                            model="municipality"
                            :value="$municipality"
                            :options="collect($municipalities)->map(fn ($municipality) => ['value' => $municipality->value, 'label' => $municipality->label()])->all()"
                            placeholder="Selecione"
                            search-placeholder="Pesquisar município"
                            :live="true"
                            aria-describedby="municipality-error"
                            aria-invalid="{{ $errors->has('municipality') ? 'true' : 'false' }}"
                        />

                        @error('municipality')
                        <p id="municipality-error" role="alert" class="text-error text-sm">
                            {{ $message }}
                        </p>
                        @enderror
                    </fieldset>

                    <fieldset class="fieldset">
                        <label for="state" class="fieldset-label">
                            Estado
                        </label>

                        <input
                            id="state" value="RR"
                            class="input w-full"
                            disabled
                        >
                    </fieldset>

                    <fieldset class="fieldset">
                        <label for="latitude" class="fieldset-label">
                            Latitude
                        </label>

                        <input
                            wire:model="latitude"
                            id="latitude"
                            aria-describedby="latitude-error"
                            aria-invalid="{{ $errors->has('latitude') ? 'true' : 'false' }}"
                            type="text"
                            inputmode="decimal"
                            x-mask:dynamic="$money($input, $input.includes(',') ? ',' : '.', '', 7)"
                            placeholder="2,8235000"
                            class="input w-full"
                        >

                        @error('latitude')
                        <p id="latitude-error" role="alert" class="text-error text-sm">
                            {{ $message }}
                        </p>
                        @enderror
                    </fieldset>

                    <fieldset class="fieldset">
                        <label for="longitude" class="fieldset-label">
                            Longitude
                        </label>

                        <input
                            wire:model="longitude"
                            id="longitude"
                            aria-describedby="longitude-error"
                            aria-invalid="{{ $errors->has('longitude') ? 'true' : 'false' }}"
                            type="text"
                            inputmode="decimal"
                            x-mask:dynamic="$money($input, $input.includes(',') ? ',' : '.', '', 7)"
                            placeholder="-60,6758000"
                            class="input w-full"
                        >

                        @error('longitude')
                        <p id="longitude-error" role="alert" class="text-error text-sm">
                            {{ $message }}
                        </p>
                        @enderror
                    </fieldset>

                </div>
            </div>
        </section>

        <section class="card bg-base-100 shadow">
            <div class="card-body gap-5">

                <h2 class="card-title">
                    Área
                </h2>

                <fieldset class="fieldset">
                    <label for="totalArea" class="fieldset-label">
                        Área total (ha) *
                    </label>

                    <input
                        wire:model.live.debounce.300ms="totalArea"
                        id="totalArea"
                        aria-describedby="totalArea-error"
                        aria-invalid="{{ $errors->has('totalArea') ? 'true' : 'false' }}"
                        type="number"
                        step="0.0001"
                        min="0"
                        class="input w-full max-w-md"
                    >

                    @error('totalArea')
                    <p id="totalArea-error" role="alert" class="text-error text-sm">
                        {{ $message }}
                    </p>
                    @enderror
                </fieldset>

                @if (
                    $this->availableArea !== null
                    || $this->fiscalModuleHectares !== null
                )
                    <div class="grid gap-4 md:grid-cols-3">

                        <div class="stat rounded-box bg-base-200">
                            <div class="stat-title">
                                Área disponível
                            </div>

                            <div class="stat-value text-2xl">
                                {{ number_format(
                                    $this->availableArea ?? 0,
                                    2,
                                    ',',
                                    '.'
                                ) }}
                                ha
                            </div>

                            <div class="stat-desc">
                                50% da área total
                            </div>
                        </div>

                        <div class="stat rounded-box bg-base-200">
                            <div class="stat-title">
                                Módulo fiscal
                            </div>

                            <div class="stat-value text-2xl">
                                {{ $this->fiscalModuleHectares ?? '—' }}
                                ha
                            </div>

                            <div class="stat-desc">
                                Conforme município
                            </div>
                        </div>

                        <div class="stat rounded-box bg-base-200">
                            <div class="stat-title">
                                Quantidade de módulos
                            </div>

                            <div class="stat-value text-2xl">
                                @if ($this->fiscalModules !== null)
                                    {{ number_format(
                                        $this->fiscalModules,
                                        2,
                                        ',',
                                        '.'
                                    ) }}
                                @else
                                    —
                                @endif
                            </div>

                            <div class="stat-desc">
                                Área ÷ módulo fiscal
                            </div>
                        </div>

                    </div>
                @endif

            </div>
        </section>

        <section class="card bg-base-100 shadow">
            <div class="card-body gap-5">

                <h2 class="card-title">
                    Exploração
                </h2>

                <div class="grid gap-4 md:grid-cols-2">

                    <fieldset class="fieldset">
                        <label for="occupancyType" class="fieldset-label">
                            Forma de ocupação *
                        </label>

                        <x-searchable-select
                            id="occupancyType"
                            model="occupancyType"
                            :value="$occupancyType"
                            :options="collect($occupancyTypes)->map(fn ($type) => ['value' => $type->value, 'label' => $type->label()])->all()"
                            placeholder="Selecione"
                            search-placeholder="Pesquisar forma de ocupação"
                            :live="true"
                            aria-describedby="occupancyType-error"
                            aria-invalid="{{ $errors->has('occupancyType') ? 'true' : 'false' }}"
                        />

                        @error('occupancyType')
                        <p id="occupancyType-error" role="alert" class="text-error text-sm">
                            {{ $message }}
                        </p>
                        @enderror
                    </fieldset>

                    <fieldset class="fieldset">
                        <label for="explorationYears" class="fieldset-label">
                            Tempo de exploração (anos) *
                        </label>

                        <input
                            wire:model="explorationYears"
                            id="explorationYears"
                            aria-describedby="explorationYears-error"
                            aria-invalid="{{ $errors->has('explorationYears') ? 'true' : 'false' }}"
                            type="number"
                            min="0"
                            class="input w-full"
                        >

                        @error('explorationYears')
                        <p id="explorationYears-error" role="alert" class="text-error text-sm">
                            {{ $message }}
                        </p>
                        @enderror
                    </fieldset>

                </div>
            </div>
        </section>

        <section class="card bg-base-100 shadow">
            <div class="card-body">

                <h2 class="card-title">
                    Documentação
                </h2>

                <fieldset class="fieldset">
                    <label for="documentType" class="fieldset-label">
                        Documento existente *
                    </label>

                    <x-searchable-select
                        wire:key="document-type-{{ $occupancyType }}"
                        id="documentType"
                        model="documentType"
                        :value="$documentType"
                        :options="collect($documentTypes)->map(fn ($type) => ['value' => $type->value, 'label' => $type->label()])->all()"
                        placeholder="Selecione"
                        search-placeholder="Pesquisar documento"
                        aria-describedby="documentType-error"
                        aria-invalid="{{ $errors->has('documentType') ? 'true' : 'false' }}"
                    />

                    @if ($occupancyType === '')
                        <p class="text-sm text-base-content/70">Selecione primeiro a forma de ocupação para ver os documentos aceitos.</p>
                    @endif

                    @error('documentType')
                    <p id="documentType-error" role="alert" class="text-error text-sm">
                        {{ $message }}
                    </p>
                    @enderror
                </fieldset>

            </div>
        </section>

        <div class="flex items-center justify-end gap-3">

            <span
                wire:loading
                wire:target="save"
                class="loading loading-spinner loading-sm"
            ></span>

            <a
                href="{{ route('properties.index') }}"
                class="btn btn-ghost"
            >
                Cancelar
            </a>

            <button
                type="submit"
                class="btn btn-primary"
                wire:confirm="Confirma o cadastro ou a atualização desta propriedade?"
                wire:loading.attr="disabled"
                wire:target="save"
            >
                {{ $propertyId
                    ? 'Salvar alterações'
                    : 'Cadastrar propriedade'
                }}
            </button>

        </div>

    </form>
</div>
