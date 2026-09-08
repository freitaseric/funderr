<x-layout title="Propostas">
    <div class="flex flex-col gap-6">
        <a href="{{ route('home') }}" class="link w-fit">← Início</a>
        <header class="flex flex-wrap justify-between gap-4"><div><h1 class="text-3xl font-bold">Propostas</h1><p class="text-base-content/70">Elaboração, revisão e acompanhamento do crédito rural.</p></div>@can('create', \App\Models\Proposal::class)<a href="{{ route('proposals.create') }}" class="btn btn-primary">Nova proposta</a>@endcan</header>
        <form method="GET" class="flex gap-3"><label class="sr-only" for="proposal-search">Número ou beneficiário</label><input id="proposal-search" class="input w-full" name="q" value="{{ $search }}" placeholder="Número ou nome do beneficiário"><button class="btn">Buscar</button></form>
        <div class="overflow-x-auto rounded-xl bg-base-100"><table class="table"><thead><tr><th>Proposta</th><th>Beneficiário / propriedade</th><th>Etapa</th><th>Status</th><th></th></tr></thead><tbody>
        @forelse($proposals as $proposal)<tr><td>{{ $proposal->number }}<div class="text-xs">{{ $proposal->proposal_date->format('d/m/Y') }}</div></td><td>{{ $proposal->beneficiary->name }}<div class="text-sm text-base-content/70">{{ $proposal->property->denomination }}</div></td><td>{{ $proposal->current_step->label() }}</td><td>{{ $proposal->status->label() }}</td><td><a class="btn btn-sm btn-outline" href="{{ route('proposals.edit', [$proposal, auth()->user()->can('update', $proposal) ? $proposal->current_step->value : 'REVIEW']) }}">Abrir</a></td></tr>
        @empty<tr><td colspan="5" class="py-12 text-center">Nenhuma proposta encontrada.</td></tr>@endforelse
        </tbody></table></div>{{ $proposals->links() }}
    </div>
</x-layout>
