<x-layout title="Novo usuário">
    <main class="mx-auto flex w-full max-w-2xl flex-col gap-8 p-6">
        <header class="flex flex-col gap-2">
            <div>
                <a
                    href="{{ route('admin.users.index') }}"
                    class="link link-hover text-sm"
                >
                    ← Voltar para usuários
                </a>
            </div>

            <h1 class="text-3xl font-semibold">
                Novo usuário
            </h1>

            <p class="text-base-content/60">
                Cadastre um usuário para acessar o FUNDERR.
            </p>
        </header>

        @if ($errors->any())
            <div class="alert alert-error">
                <ul class="list-disc pl-5">
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <form
            method="POST"
            action="{{ route('admin.users.store') }}"
            class="card bg-base-100 shadow"
        >
            @csrf

            <div class="card-body gap-5">
                <div class="flex flex-col gap-2">
                    <label for="iater_unit" class="text-sm font-medium">Unidade IATER <span class="font-normal text-base-content/50">(obrigatória para técnicos)</span></label>
                    <input id="iater_unit" name="iater_unit" type="text" value="{{ old('iater_unit') }}" class="input w-full" placeholder="Ex.: Unidade Boa Vista">
                </div>

                <div class="flex flex-col gap-2">
                    <label
                        for="name"
                        class="text-sm font-medium"
                    >
                        Nome
                    </label>

                    <input
                        id="name"
                        name="name"
                        type="text"
                        value="{{ old('name') }}"
                        class="input w-full"
                        required
                        autofocus
                    >
                </div>

                <div class="flex flex-col gap-2">
                    <label
                        for="cpf"
                        class="text-sm font-medium"
                    >
                        CPF
                    </label>

                    <input
                        id="cpf"
                        name="cpf"
                        type="text"
                        inputmode="numeric"
                        value="{{ old('cpf') }}"
                        placeholder="000.000.000-00"
                        maxlength="14"
                        data-cpf-mask
                        class="input w-full"
                        required
                    >

                    <p class="text-xs text-base-content/60">
                        A senha temporária será gerada aleatoriamente e terá validade de 24 horas.
                    </p>
                </div>

                <div class="flex flex-col gap-2">
                    <label
                        for="email"
                        class="text-sm font-medium"
                    >
                        E-mail
                        <span class="font-normal text-base-content/50">
                            (opcional)
                        </span>
                    </label>

                    <input
                        id="email"
                        name="email"
                        type="email"
                        value="{{ old('email') }}"
                        class="input w-full"
                    >
                </div>

                <div class="flex flex-col gap-2">
                    <label
                        for="role"
                        class="text-sm font-medium"
                    >
                        Perfil
                    </label>

                    <select
                        id="role"
                        name="role"
                        class="select select-bordered w-full"
                        required
                    >
                        <option value="">Selecione</option>
                        @foreach ($roles as $role)
                            <option value="{{ $role->value }}" @selected(old('role') === $role->value)>
                                {{ $role->label() }}
                            </option>
                        @endforeach
                    </select>
                </div>

                <div class="card-actions justify-end pt-3">
                    <a
                        href="{{ route('admin.users.index') }}"
                        class="btn btn-ghost"
                    >
                        Cancelar
                    </a>

                    <button
                        type="submit"
                        class="btn btn-primary"
                    >
                        Criar usuário
                    </button>
                </div>
            </div>
        </form>
    </main>
</x-layout>
