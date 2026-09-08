<x-layout :title="$creditLine->exists ? 'Editar linha de crédito' : 'Nova linha de crédito'">
    <main class="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
        <header><a href="{{ route('admin.credit-lines.index') }}" class="link link-hover text-sm">← Linhas de crédito</a><h1 class="mt-3 text-3xl font-semibold">{{ $creditLine->exists ? 'Editar linha de crédito' : 'Nova linha de crédito' }}</h1><p class="text-base-content/60">Os valores serão usados como parâmetros iniciais no financiamento das propostas.</p></header>
        <livewire:credit-lines.form :credit-line="$creditLine" />
    </main>
</x-layout>
