<x-layout>
    <header class="flex flex-wrap items-center justify-between gap-4">
        <div>
            <h1 class="text-2xl font-bold">FUNDERR</h1>
            <p>Olá, {{ auth()->user()->name }}.</p>
        </div>

        <form method="POST" action="{{ route('logout') }}">
            @csrf
            <button type="submit" class="btn btn-outline">Sair</button>
        </form>
    </header>

    <section class="card mt-8 bg-base-100 shadow-sm">
        <div class="card-body">
            <h2 class="card-title">Núcleo de Crédito Rural</h2>
            <p>Os módulos de propostas estarão disponíveis nesta página.</p>
        </div>
    </section>
</x-layout>
