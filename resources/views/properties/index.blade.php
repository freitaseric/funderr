<x-layout title="Propriedades">
    <main class="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">

        <header class="flex items-center justify-between gap-4">
            <div>
                <h1 class="text-3xl font-semibold">
                    Propriedades
                </h1>

                <p class="text-base-content/60">
                    Imóveis rurais cadastrados no FUNDERR.
                </p>
            </div>

            @if (auth()->user()->canActAsTechnician())
                <a
                    href="{{ route('properties.create') }}"
                    class="btn btn-primary"
                >
                    Nova propriedade
                </a>
            @endif
        </header>

        <form
            method="GET"
            class="flex gap-2"
        >
            <input
                name="q"
                value="{{ $search }}"
                class="input w-full max-w-lg"
                placeholder="Propriedade ou beneficiário"
            >

            <button class="btn btn-neutral">
                Buscar
            </button>
        </form>

        <div class="overflow-x-auto rounded-box bg-base-100 shadow">
            <table class="table">

                <thead>
                <tr>
                    <th>Propriedade</th>
                    <th>Beneficiário</th>
                    <th>Município</th>
                    <th>Área</th>
                    <th>Módulos</th>
                    <th></th>
                </tr>
                </thead>

                <tbody>
                @forelse ($properties as $property)
                    <tr>
                        <td class="font-medium">
                            {{ $property->denomination }}
                        </td>

                        <td>
                            {{ $property->beneficiary->name }}
                        </td>

                        <td>
                            {{ $property->municipality->label() }}
                        </td>

                        <td>
                            {{ number_format(
                                (float) $property->total_area,
                                2,
                                ',',
                                '.'
                            ) }}
                            ha
                        </td>

                        <td>
                            {{ number_format(
                                $property->fiscalModules(),
                                2,
                                ',',
                                '.'
                            ) }}
                        </td>

                        <td class="text-right">
                            <a
                                href="{{ route(
                                        'properties.show',
                                        $property
                                    ) }}"
                                class="btn btn-sm btn-ghost"
                            >
                                Ver
                            </a>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td
                            colspan="6"
                            class="py-10 text-center"
                        >
                            Nenhuma propriedade cadastrada.
                        </td>
                    </tr>
                @endforelse
                </tbody>

            </table>
        </div>

        {{ $properties->links() }}

    </main>
</x-layout>
