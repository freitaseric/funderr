<x-layout :title="$title">
    <article class="mx-auto flex max-w-5xl flex-col gap-6 bg-base-100 print:max-w-none">
        <header class="border-b border-base-300 pb-4">
            <h1 class="text-2xl font-bold">{{ $title }}</h1>
            <p>{{ $proposal->number }} · {{ $proposal->proposal_date->format('d/m/Y') }}</p>
            <p>{{ $proposal->beneficiary->name }} · CPF {{ auth()->user()->isAdministrator() ? $proposal->beneficiary->formattedCpf() : $proposal->beneficiary->maskedCpf() }}</p>
            <p>{{ $proposal->property->denomination }} · {{ $proposal->property->municipality->label() }}/RR</p>
        </header>

        @if (str_starts_with($document, 'patrimony'))
            @include('proposals.patrimony-totals', ['totals' => $summary['patrimony']])
            <div class="overflow-x-auto"><table class="table table-sm"><thead><tr><th>Categoria</th><th>Especificação</th><th>Unidade</th><th>Quantidade</th><th>Valor unitário</th><th>Total</th></tr></thead><tbody>@foreach($proposal->patrimonyItems as $item)<tr><td>{{ $item->category->label() }}</td><td>{{ $item->description }}</td><td>{{ $item->unit }}</td><td>{{ $item->quantity }}</td><td>{{ number_format($item->unit_value, 2, ',', '.') }}</td><td>{{ number_format($item->total(), 2, ',', '.') }}</td></tr>@endforeach</tbody></table></div>
        @elseif ($document === 'financing')
            @include('proposals.schedule', ['financing' => $summary['financing']])
        @elseif ($document === 'identification')
            <dl class="grid gap-4"><div><dt class="font-semibold">Finalidade</dt><dd>{{ $proposal->purpose }}</dd></div><div><dt class="font-semibold">Mercado</dt><dd>{{ $proposal->identification?->market }}</dd></div><div><dt class="font-semibold">Análise da localização</dt><dd>{{ $proposal->identification?->location_analysis }}</dd></div><div><dt class="font-semibold">Considerações</dt><dd>{{ $proposal->identification?->considerations }}</dd></div></dl>
            @include('proposals.uses-sources', ['usesSources' => $summary['uses_sources']])
        @elseif ($document === 'cash-flow')
            @include('proposals.cash-summary', ['cashFlow' => $summary['cash_flow']])
        @else
            <p>Fluxo atual: {{ $proposal->current_step->label() }} · {{ $proposal->status->label() }}.</p>
            <div class="overflow-x-auto"><table class="table table-sm"><thead><tr><th>Data</th><th>Responsável</th><th>Transição</th><th>Registro</th></tr></thead><tbody>@foreach($proposal->history as $entry)<tr><td>{{ $entry->created_at->format('d/m/Y H:i') }}</td><td>{{ $entry->user->name }}</td><td>{{ $entry->from_status?->label() ?? 'Criação' }} → {{ $entry->to_status->label() }}</td><td>{{ $entry->reason }}</td></tr>@endforeach</tbody></table></div>
        @endif
    </article>
</x-layout>
