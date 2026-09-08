<dl class="grid gap-4 rounded-xl bg-base-100 p-5 sm:grid-cols-2 lg:grid-cols-4">
    @foreach(['gross' => 'Patrimônio agropecuário bruto', 'debts' => 'Dívidas agropecuárias', 'net' => 'Patrimônio agropecuário líquido', 'total' => 'Total de bens, incluindo urbanos'] as $key => $label)
        <div><dt class="text-sm text-base-content/70">{{ $label }}</dt><dd class="mt-1 text-xl font-semibold">R$ {{ number_format($totals[$key], 2, ',', '.') }}</dd></div>
    @endforeach
</dl>
