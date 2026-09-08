<div class="flex flex-col gap-6">

    <x-proposal-feedback anchor-prefix="" />

    <header>
        <a
            href="{{ route('beneficiaries.index') }}"
            class="link link-hover text-sm"
        >
            ← Beneficiários
        </a>

        <h1 class="mt-3 text-3xl font-semibold">
            {{ $beneficiaryId
                ? 'Editar beneficiário'
                : 'Novo beneficiário'
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
                        <label for="name" class="fieldset-label">
                            Nome completo *
                        </label>

                        <input
                            wire:model="name"
                            id="name"
                            aria-describedby="name-error"
                            aria-invalid="{{ $errors->has('name') ? 'true' : 'false' }}"
                            type="text"
                            class="input w-full"
                            autofocus
                        >

                        @error('name')
                        <p id="name-error" role="alert" class="text-error text-sm">
                            {{ $message }}
                        </p>
                        @enderror
                    </fieldset>

                    <fieldset class="fieldset">
                        <label for="nickname" class="fieldset-label">
                            Apelido
                        </label>

                        <input
                            wire:model="nickname"
                            id="nickname"
                            aria-describedby="nickname-error"
                            aria-invalid="{{ $errors->has('nickname') ? 'true' : 'false' }}"
                            type="text"
                            class="input w-full"
                        >

                        @error('nickname')
                        <p id="nickname-error" role="alert" class="text-error text-sm">
                            {{ $message }}
                        </p>
                        @enderror
                    </fieldset>

                    <fieldset class="fieldset">
                        <label for="cpf" class="fieldset-label">
                            CPF *
                        </label>

                        <input
                            wire:model="cpf"
                            id="cpf"
                            aria-describedby="cpf-error"
                            aria-invalid="{{ $errors->has('cpf') ? 'true' : 'false' }}"
                            type="text"
                            inputmode="numeric"
                            maxlength="14"
                            x-mask="999.999.999-99"
                            class="input w-full"
                            placeholder="000.000.000-00"
                        >

                        @error('cpf')
                        <p id="cpf-error" role="alert" class="text-error text-sm">
                            {{ $message }}
                        </p>
                        @enderror
                    </fieldset>

                    <fieldset class="fieldset">
                        <label for="rg" class="fieldset-label">
                            RG
                        </label>

                        <input
                            wire:model="rg"
                            id="rg"
                            aria-describedby="rg-error"
                            aria-invalid="{{ $errors->has('rg') ? 'true' : 'false' }}"
                            type="text"
                            class="input w-full"
                        >

                        @error('rg')
                        <p id="rg-error" role="alert" class="text-error text-sm">
                            {{ $message }}
                        </p>
                        @enderror
                    </fieldset>

                    <fieldset class="fieldset">
                        <label for="phone" class="fieldset-label">
                            Telefone *
                        </label>

                        <input
                            wire:model="phone"
                            id="phone"
                            aria-describedby="phone-error"
                            aria-invalid="{{ $errors->has('phone') ? 'true' : 'false' }}"
                            type="text"
                            inputmode="tel"
                            x-mask:dynamic="$input.replace(/\D/g, '').length > 10 ? '(99) 99999-9999' : '(99) 9999-9999'"
                            placeholder="(95) 99999-9999"
                            class="input w-full"
                        >

                        @error('phone')
                        <p id="phone-error" role="alert" class="text-error text-sm">
                            {{ $message }}
                        </p>
                        @enderror
                    </fieldset>

                    <fieldset class="fieldset">
                        <label for="birthDate" class="fieldset-label">
                            Data de nascimento *
                        </label>

                        <input
                            wire:model="birthDate"
                            id="birthDate"
                            aria-describedby="birthDate-error"
                            aria-invalid="{{ $errors->has('birthDate') ? 'true' : 'false' }}"
                            type="date"
                            class="input w-full"
                        >

                        @error('birthDate')
                        <p id="birthDate-error" role="alert" class="text-error text-sm">
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
                    Dados pessoais
                </h2>

                <div class="grid gap-4 md:grid-cols-2">

                    <fieldset class="fieldset">
                        <label for="placeOfBirth" class="fieldset-label">
                            Naturalidade *
                        </label>

                        <input
                            wire:model="placeOfBirth"
                            id="placeOfBirth"
                            aria-describedby="placeOfBirth-error"
                            aria-invalid="{{ $errors->has('placeOfBirth') ? 'true' : 'false' }}"
                            type="text"
                            class="input w-full"
                            placeholder="Ex.: Boa Vista/RR"
                        >

                        @error('placeOfBirth')
                        <p id="placeOfBirth-error" role="alert" class="text-error text-sm">
                            {{ $message }}
                        </p>
                        @enderror
                    </fieldset>

                    <fieldset class="fieldset">
                        <label for="maritalStatus" class="fieldset-label">
                            Estado civil *
                        </label>

                        <x-searchable-select
                            id="maritalStatus"
                            model="maritalStatus"
                            :value="$maritalStatus"
                            :options="collect($maritalStatuses)->map(fn ($status) => ['value' => $status->value, 'label' => $status->label()])->all()"
                            placeholder="Selecione"
                            search-placeholder="Pesquisar estado civil"
                            :live="true"
                            aria-describedby="maritalStatus-error"
                            aria-invalid="{{ $errors->has('maritalStatus') ? 'true' : 'false' }}"
                        />

                        @error('maritalStatus')
                        <p id="maritalStatus-error" role="alert" class="text-error text-sm">
                            {{ $message }}
                        </p>
                        @enderror
                    </fieldset>

                    <fieldset class="fieldset">
                        <label for="educationLevel" class="fieldset-label">
                            Escolaridade *
                        </label>

                        <x-searchable-select
                            id="educationLevel"
                            model="educationLevel"
                            :value="$educationLevel"
                            :options="collect($educationLevels)->map(fn ($level) => ['value' => $level->value, 'label' => $level->label()])->all()"
                            placeholder="Selecione"
                            search-placeholder="Pesquisar escolaridade"
                            aria-describedby="educationLevel-error"
                            aria-invalid="{{ $errors->has('educationLevel') ? 'true' : 'false' }}"
                        />

                        @error('educationLevel')
                        <p id="educationLevel-error" role="alert" class="text-error text-sm">
                            {{ $message }}
                        </p>
                        @enderror
                    </fieldset>

                    <fieldset class="fieldset">
                        <label for="dependents" class="fieldset-label">
                            Número de dependentes *
                        </label>

                        <input
                            wire:model="dependents"
                            id="dependents"
                            aria-describedby="dependents-error"
                            aria-invalid="{{ $errors->has('dependents') ? 'true' : 'false' }}"
                            type="number"
                            min="0"
                            class="input w-full"
                        >

                        @error('dependents')
                        <p id="dependents-error" role="alert" class="text-error text-sm">
                            {{ $message }}
                        </p>
                        @enderror
                    </fieldset>

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

                </div>
            </div>
        </section>

        @if ($this->hasSpouse)

            <section
                class="card bg-base-100 shadow"
                wire:key="spouse-card"
            >
                <div class="card-body gap-5">

                    <div>
                        <h2 class="card-title">
                            Cônjuge
                        </h2>

                        <p class="mt-1 text-sm text-base-content/60">
                            Nome e CPF são obrigatórios para
                            casados ou pessoas em união estável.
                        </p>
                    </div>

                    <div class="grid gap-4 md:grid-cols-3">

                        <fieldset class="fieldset">
                            <label for="spouseName" class="fieldset-label">
                                Nome *
                            </label>

                            <input
                                wire:model="spouseName"
                                id="spouseName"
                                aria-describedby="spouseName-error"
                                aria-invalid="{{ $errors->has('spouseName') ? 'true' : 'false' }}"
                                type="text"
                                class="input w-full"
                            >

                            @error('spouseName')
                            <p id="spouseName-error" role="alert" class="text-error text-sm">
                                {{ $message }}
                            </p>
                            @enderror
                        </fieldset>

                        <fieldset class="fieldset">
                            <label for="spouseCpf" class="fieldset-label">
                                CPF *
                            </label>

                            <input
                                wire:model="spouseCpf"
                                id="spouseCpf"
                                aria-describedby="spouseCpf-error"
                                aria-invalid="{{ $errors->has('spouseCpf') ? 'true' : 'false' }}"
                                type="text"
                                inputmode="numeric"
                                maxlength="14"
                                x-mask="999.999.999-99"
                                class="input w-full"
                            >

                            @error('spouseCpf')
                            <p id="spouseCpf-error" role="alert" class="text-error text-sm">
                                {{ $message }}
                            </p>
                            @enderror
                        </fieldset>

                        <fieldset class="fieldset">
                            <label for="spouseRg" class="fieldset-label">
                                RG
                            </label>

                            <input
                                wire:model="spouseRg"
                                id="spouseRg"
                                aria-describedby="spouseRg-error"
                                aria-invalid="{{ $errors->has('spouseRg') ? 'true' : 'false' }}"
                                type="text"
                                class="input w-full"
                            >

                            @error('spouseRg')
                            <p id="spouseRg-error" role="alert" class="text-error text-sm">
                                {{ $message }}
                            </p>
                            @enderror
                        </fieldset>

                    </div>
                </div>
            </section>

        @endif

        <section class="card bg-base-100 shadow">
            <div class="card-body gap-6">

                <div>
                    <h2 class="card-title">
                        Referências pessoais
                    </h2>

                    <p class="mt-1 text-sm text-base-content/60">
                        As duas referências são obrigatórias.
                    </p>
                </div>

                @foreach ($references as $index => $reference)

                    <div
                        class="rounded-box border border-base-300 p-4"
                        wire:key="reference-{{ $index }}"
                    >

                        <h3 class="mb-4 font-semibold">
                            Referência {{ $index + 1 }}
                        </h3>

                        <div class="grid gap-4 md:grid-cols-2">

                            <fieldset class="fieldset">
                                <label for="references-{{ $index }}-name" class="fieldset-label">
                                    Nome *
                                </label>

                                <input
                                    wire:model="references.{{ $index }}.name"
                                    id="references-{{ $index }}-name"
                                    aria-describedby="references-{{ $index }}-name-error"
                                    aria-invalid="{{ $errors->has("references.$index.name") ? 'true' : 'false' }}"
                                    type="text"
                                    class="input w-full"
                                >

                                @error("references.$index.name")
                                <p id="references-{{ $index }}-name-error" role="alert" class="text-error text-sm">
                                    {{ $message }}
                                </p>
                                @enderror
                            </fieldset>

                            <fieldset class="fieldset">
                                <label for="references-{{ $index }}-phone" class="fieldset-label">
                                    Telefone *
                                </label>

                                <input
                                    wire:model="references.{{ $index }}.phone"
                                    id="references-{{ $index }}-phone"
                                    aria-describedby="references-{{ $index }}-phone-error"
                                    aria-invalid="{{ $errors->has("references.$index.phone") ? 'true' : 'false' }}"
                                    type="text"
                                    inputmode="tel"
                                    x-mask:dynamic="$input.replace(/\D/g, '').length > 10 ? '(99) 99999-9999' : '(99) 9999-9999'"
                                    placeholder="(95) 99999-9999"
                                    class="input w-full"
                                >

                                @error("references.$index.phone")
                                <p id="references-{{ $index }}-phone-error" role="alert" class="text-error text-sm">
                                    {{ $message }}
                                </p>
                                @enderror
                            </fieldset>

                        </div>
                    </div>

                @endforeach

            </div>
        </section>

        <div class="flex items-center justify-end gap-3">

            <span
                wire:loading
                wire:target="save"
                class="loading loading-spinner loading-sm"
            ></span>

            <a
                href="{{ route('beneficiaries.index') }}"
                class="btn btn-ghost"
            >
                Cancelar
            </a>

            <button
                type="submit"
                class="btn btn-primary"
                wire:confirm="Confirma o cadastro ou a atualização deste beneficiário?"
                wire:loading.attr="disabled"
                wire:target="save"
            >
                {{ $beneficiaryId
                    ? 'Salvar alterações'
                    : 'Cadastrar beneficiário'
                }}
            </button>

        </div>

    </form>
</div>
