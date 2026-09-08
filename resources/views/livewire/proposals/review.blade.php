<div class="flex flex-col gap-6">
    <x-proposal-context :proposal="$this->proposal" :step="$this->step()" />
    <x-proposal-feedback />

    @if ($this->pending !== [])
        <section class="card border border-warning bg-base-100">
            <div class="card-body gap-4">
                <h2 class="card-title">Pendências para envio</h2>
                @foreach ($this->pending as $step => $messages)
                    @php($stage = \App\Enums\ProposalStep::from($step))
                    <div class="rounded-lg bg-warning/10 p-4" wire:key="pending-{{ $step }}">
                        <a class="link font-semibold" href="{{ route('proposals.edit', [$this->proposal, $stage->value]) }}">{{ $stage->label() }}</a>
                        <ul class="mt-2 list-disc pl-5 text-sm">@foreach ($messages as $message)<li>{{ $message }}</li>@endforeach</ul>
                    </div>
                @endforeach
            </div>
        </section>
    @else
        <div class="alert alert-success" role="status">Todas as etapas estão completas e a proposta pode seguir para revisão.</div>
    @endif

    <section class="card bg-base-100"><div class="card-body gap-4">
        <h2 class="card-title">Dados iniciais e identificação</h2>
        <dl class="grid gap-4 sm:grid-cols-2"><div><dt class="text-sm text-base-content/70">Atividade</dt><dd>{{ $this->proposal->activity }}</dd></div><div><dt class="text-sm text-base-content/70">Unidade IATER</dt><dd>{{ $this->proposal->iater_unit }}</dd></div><div class="sm:col-span-2"><dt class="text-sm text-base-content/70">Finalidade</dt><dd>{{ $this->proposal->purpose }}</dd></div><div class="sm:col-span-2"><dt class="text-sm text-base-content/70">Mercado</dt><dd>{{ $this->proposal->identification?->market }}</dd></div><div class="sm:col-span-2"><dt class="text-sm text-base-content/70">Análise da localização</dt><dd>{{ $this->proposal->identification?->location_analysis }}</dd></div><div class="sm:col-span-2"><dt class="text-sm text-base-content/70">Considerações</dt><dd>{{ $this->proposal->identification?->considerations }}</dd></div></dl>
    </div></section>

    <section class="card bg-base-100"><div class="card-body gap-4">
        <h2 class="card-title">Resumo patrimonial</h2>
        @include('proposals.patrimony-totals', ['totals' => $this->summary['patrimony']])
        <div class="overflow-x-auto"><table class="table table-sm"><caption class="pb-2 text-left font-semibold">Dívidas agropecuárias</caption><thead><tr><th>Credor</th><th>Finalidade</th><th>Vencimento</th><th>Saldo</th></tr></thead><tbody>@forelse($this->proposal->debts as $debt)<tr><td>{{ $debt->creditor }}</td><td>{{ $debt->purpose }}</td><td>{{ $debt->due_date?->format('d/m/Y') }}</td><td>{{ number_format($debt->outstanding_balance ?? 0, 2, ',', '.') }}</td></tr>@empty<tr><td colspan="4">Nenhuma dívida informada.</td></tr>@endforelse</tbody></table></div>
    </div></section>

    <section class="card bg-base-100"><div class="card-body gap-4">
        <h2 class="card-title">Financiamento</h2>
        @if ($this->proposal->financing)
            <p>Linha: {{ $this->proposal->financing->creditLine->name }}</p>
            @include('proposals.schedule', ['financing' => $this->summary['financing']])
        @else
            <p>Nenhum cenário financeiro salvo.</p>
        @endif
    </div></section>

    <section class="card bg-base-100"><div class="card-body gap-4">
        <h2 class="card-title">Usos, fontes e fluxo de caixa</h2>
        @include('proposals.uses-sources', ['usesSources' => $this->summary['uses_sources']])
        @include('proposals.cash-summary', ['cashFlow' => $this->summary['cash_flow']])
        <div class="overflow-x-auto"><table class="table table-sm"><caption class="pb-2 text-left font-semibold">Capacidade de geração de emprego / pessoal</caption><thead><tr><th>Área</th><th>Fase atual</th><th>Expansão</th><th>Total</th></tr></thead><tbody>@forelse($this->proposal->jobs as $job)<tr><td>{{ $job->category->label() }}</td><td>{{ $job->current }}</td><td>{{ $job->expansion }}</td><td>{{ $job->current + $job->expansion }}</td></tr>@empty<tr><td colspan="4">Nenhuma capacidade de emprego informada.</td></tr>@endforelse</tbody></table></div>
    </div></section>

    <section class="card bg-base-100"><div class="card-body gap-4">
        <h2 class="card-title">Impressões disponíveis</h2>
        <div class="flex flex-wrap gap-3">
            @foreach (app(\App\Services\Proposals\ProposalDocuments::class)->available() as $document => $title)
                <a class="btn btn-outline btn-sm" target="_blank" href="{{ route('proposals.print', [$this->proposal, $document]) }}">{{ $title }}</a>
            @endforeach
        </div>
        <p class="text-sm text-base-content/70">O contrato permanece como ponto de extensão: o texto contratual definitivo ainda precisa ser fornecido pela instituição.</p>
    </div></section>

    <section class="card bg-base-100"><div class="card-body gap-4">
        <h2 class="card-title">Histórico da tramitação</h2>
        <div class="overflow-x-auto"><table class="table table-sm"><thead><tr><th>Data</th><th>Responsável</th><th>Alteração</th><th>Registro</th>@if(auth()->user()->isAdministrator())<th>IP</th>@endif</tr></thead><tbody>
            @forelse($this->history as $entry)
                <tr><td class="whitespace-nowrap">{{ $entry->created_at->format('d/m/Y H:i') }}</td><td>{{ $entry->user?->name ?? 'Sistema' }}</td><td>{{ $entry->from_status?->label() ?? 'Criação' }} → {{ $entry->to_status->label() }}</td><td>{{ $entry->reason ?: 'Sem observação.' }}</td>@if(auth()->user()->isAdministrator())<td class="font-mono text-xs">{{ $entry->ip_address ?: '—' }}</td>@endif</tr>
            @empty
                <tr><td colspan="{{ auth()->user()->isAdministrator() ? 5 : 4 }}">Nenhuma tramitação registrada.</td></tr>
            @endforelse
        </tbody></table></div>
    </div></section>

    @if ($this->availableTransitions !== [])
        <section class="card bg-base-100"><div class="card-body gap-4">
            <h2 class="card-title">Tramitação</h2>
            <p class="text-sm">Status atual: <strong>{{ $this->proposal->status->label() }}</strong>. Escolha a próxima ação; o motivo é exigido para devoluções, envios manuais e retornos do banco.</p>
            <x-proposal-field model="reason" label="Motivo, comprovante de envio ou resposta recebida" type="textarea" hint="Preencha quando a ação solicitar justificativa." />
            <div class="flex flex-wrap gap-3">
                    @foreach ($this->availableTransitions as $status)
                    @if ($status === \App\Enums\ProposalStatus::InReview)
                        @can('update', $this->proposal)
                            <button type="button" class="btn btn-primary" wire:confirm="Confirma a ação '{{ $this->transitionLabel($status) }}'?" wire:click="transitionStatus('{{ $status->value }}')">{{ $this->transitionLabel($status) }}</button>
                        @endcan
                    @else
                        @can('process', $this->proposal)
                            <button type="button" class="btn btn-outline" wire:confirm="Confirma a ação '{{ $this->transitionLabel($status) }}'?" wire:click="transitionStatus('{{ $status->value }}')">{{ $this->transitionLabel($status) }}</button>
                        @endcan
                    @endif
                @endforeach
            </div>
        </div></section>
    @endif
</div>
