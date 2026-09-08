<x-layout title="Entrar no FUNDERR" :auth="true">
    <section class="flex w-full max-w-sm flex-col gap-8" aria-labelledby="login-title">
        <header class="flex flex-col items-center gap-4 text-center">
            <img src="{{ asset('funderr-logo.png') }}" alt="FUNDERR" width="64" height="64"
                 class="size-16 object-contain">
            <div class="flex flex-col gap-2">
                <h1 id="login-title" class="text-2xl font-semibold tracking-tight">Bem-vindo ao FUNDERR</h1>
                <p class="text-sm text-base-content/65">IATER · Núcleo de Crédito Rural</p>
            </div>
        </header>

        <form method="POST" action="{{ route('login.store') }}" class="flex flex-col gap-6">
            @csrf
            @if ($errors->any())
                <div role="alert" class="alert alert-error text-sm">
                    <p>Não foi possível entrar. Confira os dados ou aguarde caso tenha tentado várias vezes.</p>
                </div>
            @endif
            <div class="flex flex-col gap-2">
                <label for="cpf" class="text-sm font-medium">CPF</label>
                <input id="cpf" name="cpf" type="text" inputmode="numeric"
                       autocomplete="username" value="{{ old('cpf') }}" data-cpf-mask
                       pattern="[0-9]{3}\.?[0-9]{3}\.?[0-9]{3}-?[0-9]{2}" maxlength="14"
                       placeholder="000.000.000-00" class="input w-full" required autofocus>
            </div>
            <div class="flex flex-col gap-2">
                <label for="password" class="text-sm font-medium">Senha</label>
                <input id="password" name="password" type="password"
                       autocomplete="current-password" class="input w-full" required>
            </div>
            <button type="submit" class="btn btn-primary w-full">Entrar</button>
        </form>
        <p class="text-center text-sm leading-relaxed text-base-content/65">
            Para solicitar acesso ou redefinir sua senha,<br class="hidden sm:block">
            procure o administrador do sistema.
        </p>
    </section>
</x-layout>
