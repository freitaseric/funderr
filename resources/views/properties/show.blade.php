<x-layout :title="$property->denomination">
    <main class="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">

        <header class="flex items-start justify-between gap-4">
            <div>
                <a
                    href="{{ route('properties.index') }}"
                    class="link link-hover text-sm"
                >
                    ← Propriedades
                </a>

                <h1 class="mt-3 text-3xl font-semibold">
                    {{ $property->denomination }}
                </h1>

                <p class="text-base-content/60">
                    {{ $property->beneficiary->name }}
                </p>
            </div>

            @if (auth()->user()->canActAsTechnician())
                <a
                    href="{{ route(
                        'properties.edit',
                        $property
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
                    Área
                </h2>

                <div class="grid gap-4 md:grid-cols-3">

                    <div>
                        <div class="text-sm text-base-content/60">
                            Área total
                        </div>

                        <strong>
                            {{ number_format(
                                (float) $property->total_area,
                                2,
                                ',',
                                '.'
                            ) }}
                            ha
                        </strong>
                    </div>

                    <div>
                        <div class="text-sm text-base-content/60">
                            Área disponível
                        </div>

                        <strong>
                            {{ number_format(
                                $property->availableArea(),
                                2,
                                ',',
                                '.'
                            ) }}
                            ha
                        </strong>
                    </div>

                    <div>
                        <div class="text-sm text-base-content/60">
                            Módulos fiscais
                        </div>

                        <strong>
                            {{ number_format(
                                $property->fiscalModules(),
                                2,
                                ',',
                                '.'
                            ) }}
                        </strong>
                    </div>

                </div>
            </div>
        </section>

        <section class="card bg-base-100 shadow">
            <div class="card-body">

                <h2 class="card-title">
                    Localização
                </h2>

                <p>{{ $property->address }}</p>

                <p>
                    {{ $property->municipality->label() }}/RR
                </p>

                @if ($property->latitude !== null && $property->longitude !== null)
                    <p class="text-sm text-base-content/60">
                        {{ number_format((float) $property->latitude, 7, ',', '') }}°;
                        {{ number_format((float) $property->longitude, 7, ',', '') }}°
                    </p>
                @endif

            </div>
        </section>

        <section class="card bg-base-100 shadow">
            <div class="card-body">

                <h2 class="card-title">
                    Exploração e documentação
                </h2>

                <div class="grid gap-4 md:grid-cols-3">

                    <div>
                        <div class="text-sm text-base-content/60">
                            Ocupação
                        </div>

                        <strong>
                            {{ $property->occupancy_type->label() }}
                        </strong>
                    </div>

                    <div>
                        <div class="text-sm text-base-content/60">
                            Tempo de exploração
                        </div>

                        <strong>
                            {{ $property->exploration_years }}
                            anos
                        </strong>
                    </div>

                    <div>
                        <div class="text-sm text-base-content/60">
                            Documento
                        </div>

                        <strong>
                            {{ $property->document_type->label() }}
                        </strong>
                    </div>

                </div>
            </div>
        </section>

    </main>
</x-layout>
