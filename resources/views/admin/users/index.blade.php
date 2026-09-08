<x-layout title="Usuários">
    <main class="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
        <header
            class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
            <div>
                <h1 class="text-3xl font-semibold">
                    Usuários
                </h1>

                <p class="mt-1 text-base-content/60">
                    Gerencie o acesso ao FUNDERR.
                </p>
            </div>

            <a
                href="{{ route('admin.users.create') }}"
                class="btn btn-primary"
            >
                Novo usuário
            </a>
        </header>

        @if (session('success'))
            <div class="alert alert-success">
                {{ session('success') }}
            </div>
        @endif

        @if ($errors->any())
            <div class="alert alert-error">
                {{ $errors->first() }}
            </div>
        @endif

        @if (session('temporary_password'))
            <div class="alert alert-warning">
                <div>
                    <strong>
                        Senha temporária de
                        {{ session('temporary_password_user') }}:
                    </strong>

                    <span
                        class="ml-2 font-mono text-lg font-bold"
                    >
                        {{ session('temporary_password') }}
                    </span>

                    <p class="mt-1 text-sm">
                        Informe essa senha ao usuário. Ele será
                        obrigado a alterá-la no primeiro acesso. Ela expira em 24 horas.
                    </p>
                </div>
            </div>
        @endif

        <form method="GET" action="{{ route('admin.users.index') }}" class="flex gap-3">
            <label for="user-search" class="sr-only">Buscar usuários por nome ou CPF</label>
            <input id="user-search" name="q" value="{{ $search }}" placeholder="Nome ou CPF" class="input w-full">
            <button type="submit" class="btn btn-primary">Buscar</button>
        </form>

        <div class="overflow-x-auto rounded-box bg-base-100 shadow">
            <table class="table">
                <thead>
                <tr>
                    <th>Nome</th>
                    <th>CPF</th>
                    <th>Perfil</th>
                    <th>Status</th>
                    <th class="text-right">Ações</th>
                </tr>
                </thead>

                <tbody>
                @forelse ($users as $user)
                    <tr>
                        <td>
                            <div class="font-medium">
                                {{ $user->name }}
                            </div>

                            @if ($user->email)
                                <div class="text-xs text-base-content/55">
                                    {{ $user->email }}
                                </div>
                            @endif
                        </td>

                        <td class="font-mono">
                            {{ preg_replace(
                                '/(\d{3})(\d{3})(\d{3})(\d{2})/',
                                '$1.$2.$3-$4',
                                $user->cpf
                            ) }}
                        </td>

                        <td>
                            {{ $user->role->label() }}
                        </td>

                        <td>
                            @if ($user->isActive())
                                <span class="badge badge-success">
                                        Ativo
                                    </span>
                            @else
                                <span class="badge badge-ghost">
                                        Desativado
                                    </span>
                            @endif
                        </td>

                        <td>
                            <div class="flex justify-end gap-2">
                                <form
                                    method="POST"
                                    action="{{ route(
                                            'admin.users.reset-password',
                                            $user
                                        ) }}"
                                >
                                    @csrf
                                    @method('PATCH')

                                    <button
                                        type="submit"
                                        class="btn btn-sm btn-ghost"
                                    >
                                        Redefinir senha
                                    </button>
                                </form>

                                @if ($user->isActive())
                                    @if (auth()->id() !== $user->id)
                                        <form
                                            method="POST"
                                            action="{{ route(
                                                    'admin.users.disable',
                                                    $user
                                                ) }}"
                                        >
                                            @csrf
                                            @method('PATCH')

                                            <button
                                                type="submit"
                                                class="btn btn-sm btn-error btn-outline"
                                            >
                                                Desativar
                                            </button>
                                        </form>
                                    @endif
                                @else
                                    <form
                                        method="POST"
                                        action="{{ route(
                                                'admin.users.enable',
                                                $user
                                            ) }}"
                                    >
                                        @csrf
                                        @method('PATCH')

                                        <button
                                            type="submit"
                                            class="btn btn-sm btn-success btn-outline"
                                        >
                                            Reativar
                                        </button>
                                    </form>
                                @endif
                            </div>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td
                            colspan="5"
                            class="py-8 text-center text-base-content/60"
                        >
                            Nenhum usuário cadastrado.
                        </td>
                    </tr>
                @endforelse
                </tbody>
            </table>
        </div>

        {{ $users->links() }}

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
