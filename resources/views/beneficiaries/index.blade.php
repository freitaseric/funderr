<x-layout title="Beneficiários">
    <main class="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">

        <header
            class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
            <div>
                <h1 class="text-3xl font-semibold">
                    Beneficiários
                </h1>

                <p class="mt-1 text-base-content/60">
                    Produtores cadastrados no FUNDERR.
                </p>
            </div>

            @if (auth()->user()->canActAsTechnician())
                <a
                    href="{{ route('beneficiaries.create') }}"
                    class="btn btn-primary"
                >
                    Novo beneficiário
                </a>
            @endif
        </header>

        @if (session('success'))
            <div class="alert alert-success">
                {{ session('success') }}
            </div>
        @endif

        <form
            method="GET"
            action="{{ route('beneficiaries.index') }}"
            class="flex gap-2"
        >
            <input
                type="search"
                name="q"
                value="{{ $search }}"
                placeholder="Nome ou CPF"
                class="input w-full max-w-lg"
            >

            <button
                type="submit"
                class="btn btn-neutral"
            >
                Buscar
            </button>
        </form>

        <div class="overflow-x-auto rounded-box bg-base-100 shadow">

            <table class="table">
                <thead>
                <tr>
                    <th>Nome</th>
                    <th>CPF</th>
                    <th>Telefone</th>
                    <th>Naturalidade</th>
                    <th class="text-right">
                        Ações
                    </th>
                </tr>
                </thead>

                <tbody>
                @forelse ($beneficiaries as $beneficiary)

                    <tr>
                        <td>
                            <div class="font-medium">
                                {{ $beneficiary->name }}
                            </div>

                            @if ($beneficiary->nickname)
                                <div class="text-xs text-base-content/55">
                                    {{ $beneficiary->nickname }}
                                </div>
                            @endif
                        </td>

                        <td class="font-mono">
                            {{ auth()->user()->isAdministrator() ? $beneficiary->formattedCpf() : $beneficiary->maskedCpf() }}
                        </td>

                        <td>
                            {{ auth()->user()->isAdministrator() ? $beneficiary->formattedPhone() : $beneficiary->maskedPhone($beneficiary->phone) }}
                        </td>

                        <td>
                            {{ $beneficiary->place_of_birth }}
                        </td>

                        <td>
                            <div class="flex justify-end gap-2">

                                <a
                                    href="{{ route(
                                            'beneficiaries.show',
                                            $beneficiary
                                        ) }}"
                                    class="btn btn-sm btn-ghost"
                                >
                                    Ver
                                </a>

                                @if (auth()->user()->canActAsTechnician())
                                    <a
                                        href="{{ route(
                                                'beneficiaries.edit',
                                                $beneficiary
                                            ) }}"
                                        class="btn btn-sm btn-outline"
                                    >
                                        Editar
                                    </a>
                                @endif

                            </div>
                        </td>
                    </tr>

                @empty

                    <tr>
                        <td
                            colspan="5"
                            class="py-10 text-center text-base-content/60"
                        >
                            Nenhum beneficiário encontrado.
                        </td>
                    </tr>

                @endforelse
                </tbody>
            </table>

        </div>

        {{ $beneficiaries->links() }}

        <div>
            <a
                href="{{ route('home') }}"
                class="btn btn-ghost"
            >
                ← Voltar
            </a>
        </div>

    </main>
</x-layout>
