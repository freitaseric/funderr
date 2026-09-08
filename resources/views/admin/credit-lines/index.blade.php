<x-layout title="Linhas de crédito">
    <main class="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6">
        <header class="flex flex-wrap items-center justify-between gap-4"><div><h1 class="text-3xl font-semibold">Linhas de crédito</h1><p class="text-base-content/60">Configure os parâmetros disponíveis para as propostas.</p></div><a href="{{ route('admin.credit-lines.create') }}" class="btn btn-primary">Nova linha</a></header>
        @if(session('success'))<div class="alert alert-success">{{ session('success') }}</div>@endif
        <form method="GET" class="flex gap-3"><input name="q" value="{{ $search }}" class="input w-full" placeholder="Buscar por nome" aria-label="Buscar linhas de crédito"><button class="btn btn-primary">Buscar</button></form>
        <div class="overflow-x-auto rounded-box bg-base-100 shadow"><table class="table"><thead><tr><th>Nome</th><th>Garantia</th><th>Status</th><th>Teto</th><th>Juros</th><th>Prazo</th><th></th></tr></thead><tbody>
            @forelse($creditLines as $line)<tr><td class="font-medium">{{ $line->name }}</td><td>{{ $line->requires_guarantor ? 'Avalista obrigatório' : 'Não exige avalista' }}</td><td><span class="badge {{ $line->active ? 'badge-success' : 'badge-ghost' }}">{{ $line->active ? 'Ativa' : 'Inativa' }}</span></td><td>R$ {{ number_format($line->financing_limit, 2, ',', '.') }}</td><td>{{ number_format($line->annual_interest_rate, 2, ',', '.') }}%</td><td>{{ $line->max_term_years }} anos / {{ $line->max_grace_years }} carência</td><td><a href="{{ route('admin.credit-lines.edit', $line) }}" class="btn btn-sm btn-outline">Editar</a></td></tr>@empty
                <tr><td colspan="7" class="py-8 text-center text-base-content/60">Nenhuma linha de crédito cadastrada.</td></tr>
            @endforelse
        </tbody></table></div>{{ $creditLines->links() }}
        <a href="{{ route('home') }}" class="btn btn-ghost self-start">← Voltar</a>
    </main>
</x-layout>
