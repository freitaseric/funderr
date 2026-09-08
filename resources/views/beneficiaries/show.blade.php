<x-layout :title="$beneficiary->name">
    <main class="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">

        <header
            class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
        >
            <div>
                <a
                    href="{{ route('beneficiaries.index') }}"
                    class="link link-hover text-sm"
                >
                    ← Beneficiários
                </a>

                <h1 class="mt-3 text-3xl font-semibold">
                    {{ $beneficiary->name }}
                </h1>

                @if ($beneficiary->nickname)
                    <p class="text-base-content/60">
                        {{ $beneficiary->nickname }}
                    </p>
                @endif
            </div>

            @if (auth()->user()->canActAsTechnician())
                <a
                    href="{{ route(
                        'beneficiaries.edit',
                        $beneficiary
                    ) }}"
                    class="btn btn-outline"
                >
                    Editar
                </a>
            @endif
        </header>

        @if (session('success'))
            <div class="alert alert-success">
                {{ session('success') }}
            </div>
        @endif

        <section class="card bg-base-100 shadow">
            <div class="card-body">

                <h2 class="card-title">
                    Identificação
                </h2>

                <div class="grid gap-5 md:grid-cols-3">

                    <div>
                        <div class="text-sm text-base-content/55">
                            CPF
                        </div>

                        <div class="font-medium">
                            {{ auth()->user()->isAdministrator() ? $beneficiary->formattedCpf() : $beneficiary->maskedCpf() }}
                        </div>
                    </div>

                    <div>
                        <div class="text-sm text-base-content/55">
                            RG
                        </div>

                        <div class="font-medium">
                            {{ $beneficiary->rg ?: '—' }}
                        </div>
                    </div>

                    <div>
                        <div class="text-sm text-base-content/55">
                            Telefone
                        </div>

                        <div class="font-medium">
                            {{ auth()->user()->isAdministrator() ? $beneficiary->formattedPhone() : $beneficiary->maskedPhone($beneficiary->phone) }}
                        </div>
                    </div>

                    <div>
                        <div class="text-sm text-base-content/55">
                            Data de nascimento
                        </div>

                        <div class="font-medium">
                            {{ $beneficiary->birth_date->format('d/m/Y') }}
                        </div>
                    </div>

                    <div>
                        <div class="text-sm text-base-content/55">
                            Naturalidade
                        </div>

                        <div class="font-medium">
                            {{ $beneficiary->place_of_birth }}
                        </div>
                    </div>

                    <div>
                        <div class="text-sm text-base-content/55">
                            Estado civil
                        </div>

                        <div class="font-medium">
                            {{ $beneficiary->marital_status->label() }}
                        </div>
                    </div>

                    <div>
                        <div class="text-sm text-base-content/55">
                            Escolaridade
                        </div>

                        <div class="font-medium">
                            {{ $beneficiary->education_level->label() }}
                        </div>
                    </div>

                    <div>
                        <div class="text-sm text-base-content/55">
                            Dependentes
                        </div>

                        <div class="font-medium">
                            {{ $beneficiary->dependents }}
                        </div>
                    </div>

                </div>

            </div>
        </section>

        <section class="card bg-base-100 shadow">
            <div class="card-body">

                <h2 class="card-title">
                    Endereço
                </h2>

                <p>
                    {{ $beneficiary->address }}
                </p>

            </div>
        </section>

        @if ($beneficiary->marital_status->requiresSpouse())

            <section class="card bg-base-100 shadow">
                <div class="card-body">

                    <h2 class="card-title">
                        Cônjuge
                    </h2>

                    <div class="grid gap-5 md:grid-cols-3">

                        <div>
                            <div class="text-sm text-base-content/55">
                                Nome
                            </div>

                            <div class="font-medium">
                                {{ $beneficiary->spouse_name }}
                            </div>
                        </div>

                        <div>
                            <div class="text-sm text-base-content/55">
                                CPF
                            </div>

                            <div class="font-medium">
                                {{ auth()->user()->isAdministrator() ? $beneficiary->formattedSpouseCpf() : $beneficiary->maskedSpouseCpf() }}
                            </div>
                        </div>

                        <div>
                            <div class="text-sm text-base-content/55">
                                RG
                            </div>

                            <div class="font-medium">
                                {{ $beneficiary->spouse_rg ?: '—' }}
                            </div>
                        </div>

                    </div>

                </div>
            </section>

        @endif

        <section class="card bg-base-100 shadow">
            <div class="card-body">

                <h2 class="card-title">
                    Referências pessoais
                </h2>

                <div class="grid gap-4 md:grid-cols-2">

                    @foreach ($beneficiary->references as $reference)

                        <div class="rounded-box border border-base-300 p-4">

                            <div class="text-sm text-base-content/55">
                                Referência {{ $reference->position }}
                            </div>

                            <div class="mt-1 font-medium">
                                {{ $reference->name }}
                            </div>

                            <div class="text-sm">
                                {{ preg_replace(
                                    '/^(\d{2})(\d{4,5})(\d{4})$/',
                                    '($1) $2-$3',
                                    auth()->user()->isAdministrator() ? $reference->phone : $beneficiary->maskedPhone($reference->phone)
                                ) }}
                            </div>

                        </div>

                    @endforeach

                </div>

            </div>
        </section>

    </main>
</x-layout>
