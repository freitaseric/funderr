<x-layout title="Alterar senha" :auth="true">
    <section class="flex w-full max-w-sm flex-col gap-8">
        <header class="flex flex-col items-center gap-4 text-center">
            <img src="{{ asset('funderr-logo.png') }}" alt="FUNDERR" width="64" height="64"
                 class="size-16 object-contain">
            <div class="flex flex-col gap-2">
                <h1 class="text-2xl font-semibold">Defina sua senha</h1>
                <p class="text-sm text-base-content/65">Antes de continuar, substitua a senha temporária por uma senha
                    que somente você conheça.</p>
            </div>
        </header>

        @if ($errors->updatePassword->any())
            <div role="alert" class="alert alert-error text-sm">
                <ul>
                    @foreach ($errors->updatePassword->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <form method="POST" action="{{ route('user-password.update') }}" class="flex flex-col gap-5">
            @csrf
            @method('PUT')

            <div class="flex flex-col gap-2">
                <label for="current_password" class="text-sm font-medium">
                    Senha atual
                </label>
                <input
                    id="current_password"
                    name="current_password"
                    type="password"
                    autocomplete="current-password"
                    class="input w-full"
                    required
                    autofocus
                >
            </div>

            <div class="flex flex-col gap-2">
                <label for="password" class="text-sm font-medium">Nova senha</label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    autocomplete="new-password"
                    minlength="8"
                    class="input w-full"
                    required
                >
                <p class="text-sm text-base-content/65">Use pelo menos 8 caracteres e uma senha diferente da atual.</p>
            </div>

            <div class="flex flex-col gap-2">
                <label for="password_confirmation" class="text-sm font-medium">Confirme sua nova senha</label>
                <input
                    id="password_confirmation"
                    name="password_confirmation"
                    type="password"
                    autocomplete="new-password"
                    minlength="8"
                    class="input w-full"
                    required
                >
            </div>

            <button type="submit" class="btn btn-primary w-full">Salvar e continuar</button>
        </form>

        <form method="POST" action="{{ route('logout') }}">
            @csrf
            <button type="submit" class="btn btn-ghost w-full">Sair da conta</button>
        </form>
    </section>
</x-layout>
