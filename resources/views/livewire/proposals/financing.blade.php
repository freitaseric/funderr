<div class="flex flex-col gap-6">
    <x-proposal-context :proposal="$this->proposal" :step="$this->step()"/>
    <x-proposal-feedback/>
    <form wire:submit="save" class="flex flex-col gap-6">
        <fieldset class="flex flex-col gap-5" @disabled(!auth()->user()->can('update', $this->proposal))>
            <section class="card bg-base-100">
                <div class="card-body gap-4"><h2 class="card-title">Cenário financeiro</h2>
                    <label for="credit-line">Linha de crédito <span aria-hidden="true" class="text-error">*</span></label>
                    <x-searchable-select id="credit-line" model="data.credit_line_id" :value="$data['credit_line_id']"
                                         :options="$lines->map(fn ($line) => ['value' => $line->id, 'label' => $line->name])->all()"
                                         search-model="creditLineSearch" search-placeholder="Buscar por nome"
                                         :live="true"/>
                    <p class="text-sm">Exibindo até 20 linhas de crédito mais relevantes, além da linha selecionada.</p>
                    @if($lines->isEmpty())
                        <p>Nenhuma linha ativa. Solicite o cadastro ao administrador.</p>
                    @endif
                    @foreach($lines as $line)
                        @if((string)$line->id === (string)$data['credit_line_id'])
                            <div class="rounded-lg bg-base-200 p-4 text-sm"><p>Teto:
                                    R$ {{ number_format($line->financing_limit, 2, ',', '.') }} · Prazo
                                    máximo: {{ $line->max_term_years }} anos · Carência
                                    máxima: {{ $line->max_grace_years }} anos</p>
                                <p>{{ $line->notes }}</p></div>
                        @endif
                    @endforeach
                    @if($lines->firstWhere('id', $data['credit_line_id'])?->requires_guarantor)
                        <section class="rounded-lg border border-warning/40 bg-warning/10 p-4">
                            <h3 class="font-semibold">Avalista obrigatório</h3>
                            <p class="mb-3 text-sm">Esta linha de crédito exige aval pessoal. Informe os dados completos
                                do avalista para continuar.</p>
                            <div class="grid gap-4 sm:grid-cols-3">
                                <x-proposal-field model="guarantor.name" label="Nome completo do avalista" :required="true"/>
                                <div class="fieldset"><label class="fieldset-label" for="guarantor-cpf">CPF do
                                        avalista</label><input id="guarantor-cpf" wire:model="guarantor.cpf"
                                                               x-mask="999.999.999-99" inputmode="numeric"
                                                               class="input w-full @error('guarantor.cpf') input-error @enderror"
                                                               @error('guarantor.cpf') aria-invalid="true"
                                                               aria-describedby="guarantor-cpf-error" @enderror>@error('guarantor.cpf')
                                    <p id="guarantor-cpf-error" class="text-sm text-error"
                                       role="alert">{{ $message }}</p>@enderror</div>
                                <div class="fieldset"><label class="fieldset-label" for="guarantor-phone">Telefone do avalista</label><input id="guarantor-phone" wire:model="guarantor.phone" x-mask:dynamic="$input.replace(/\D/g, '').length > 10 ? '(99) 99999-9999' : '(99) 9999-9999'" inputmode="tel" placeholder="(95) 99999-9999" class="input w-full @error('guarantor.phone') input-error @enderror" @error('guarantor.phone') aria-invalid="true" aria-describedby="guarantor-phone-error" @enderror>@error('guarantor.phone')<p id="guarantor-phone-error" class="text-sm text-error" role="alert">{{ $message }}</p>@enderror</div>
                            </div>
                        </section>
                    @endif
                    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <x-proposal-field model="data.proposal_value" label="Valor da proposta (R$)" type="number"
                                          :money="true" :live="true" :required="true"/>
                        <x-proposal-field model="data.financeable_percentage" label="Percentual financiável (%)"
                                          type="number" :live="true" :required="true"/>
                        <x-proposal-field model="data.ater_percentage" label="Assistência técnica (%)" type="number"
                                          :live="true" :required="true"/>
                        <x-proposal-field model="data.annual_interest_rate" label="Taxa de juros anual (%)"
                                          type="number" step="0.5" :live="true" :required="true"/>
                        <x-proposal-field model="data.term_years" label="Prazo total (anos)" type="number" step="1"
                                          :live="true" :required="true"/>
                        <x-proposal-field model="data.grace_years" label="Carência (anos)" type="number" step="1"
                                          :live="true" :required="true"/>
                        <div class="fieldset"><label for="grace-interest">Juros durante a carência</label>
                            <x-searchable-select id="grace-interest" model="data.grace_interest"
                                                 :value="$data['grace_interest']"
                                                 :options="[['value' => 'PAY', 'label' => 'Pagar anualmente'], ['value' => 'CAPITALIZE', 'label' => 'Capitalizar no saldo']]"
                                                 search-placeholder="Pesquisar opção" :live="true"/>
                        </div>
                    </div>
                    <p class="text-sm">Periodicidade anual · {{ $this->calculation['installments'] }} parcelas de
                        principal após a carência.</p>
                    <dl class="grid gap-4 sm:grid-cols-3">@foreach(['financed' => 'Valor financiável', 'ater' => 'Valor ATER', 'project' => 'Valor do projeto com ATER'] as $key => $label)
                            <div>
                                <dt>{{ $label }}</dt>
                                <dd class="text-xl font-bold">
                                    R$ {{ number_format($this->calculation[$key], 2, ',', '.') }}</dd>
                            </div>
                        @endforeach</dl>
                    @include('proposals.schedule', ['financing' => $this->calculation])
                </div>
            </section>
        </fieldset>
        <x-proposal-actions :proposal="$this->proposal"/>
    </form>
</div>
