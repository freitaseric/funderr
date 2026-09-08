<div class="flex flex-col gap-6">
    <x-proposal-context :proposal="$this->proposal" :step="$this->step()" /><x-proposal-feedback />
    <form wire:submit="save" class="flex flex-col gap-6"><fieldset class="flex flex-col gap-5" @disabled(!auth()->user()->can('update', $this->proposal))>
        <section class="card bg-base-100"><div class="card-body gap-4"><h2 class="card-title">Identificação da proposta</h2><p class="text-sm text-base-content/70"><span aria-hidden="true" class="text-error">*</span> indica campo obrigatório. Informe zero quando não houver pessoas ou faturamento.</p>
            <x-proposal-field model="data.purpose" label="Finalidade do projeto" type="textarea" hint="A finalidade é compartilhada com os dados iniciais." :required="true" />
            <x-proposal-field model="data.market" label="Mercado" type="textarea" hint="Descreva fornecedores, consumidores e concorrência." :required="true" />
            <x-proposal-field model="data.last_year_revenue" label="Faturamento do último ano (R$)" type="number" :money="true" :required="true" />
            <x-proposal-field model="data.location_analysis" label="Análise da localização" type="textarea" hint="Comente as vantagens e desvantagens do local." :required="true" />
            <x-proposal-field model="data.considerations" label="Considerações" type="textarea" hint="Experiência do proponente e outras observações relevantes." />
        </div></section>
        <section class="card bg-base-100"><div class="card-body gap-4"><h2 class="card-title">Capacidade de geração de emprego / pessoal</h2>
            @foreach(\App\Enums\JobCategory::cases() as $category)<div wire:key="jobs-{{ $category->value }}" class="grid items-end gap-3 sm:grid-cols-4"><h3>{{ $category->label() }}</h3><x-proposal-field :model="'jobs.'.$category->value.'.current'" label="Fase atual" type="number" step="1" :live="true" :required="true" /><x-proposal-field :model="'jobs.'.$category->value.'.expansion'" label="Expansão" type="number" step="1" :live="true" :required="true" /><p class="pb-3">Total: {{ $this->employment['rows'][$category->value] }}</p></div>@endforeach
            <p class="font-semibold">Total de pessoas: {{ $this->employment['total'] }}</p>
        </div></section>
        <section class="card bg-base-100"><div class="card-body gap-4"><div class="flex flex-wrap items-center justify-between gap-3"><h2 class="card-title">Investimentos a realizar e fontes adicionais</h2><button type="button" wire:click="calculate" class="btn btn-outline btn-sm">Calcular</button></div><p>Os valores realizados são preenchidos automaticamente a partir do levantamento patrimonial, das dívidas e do financiamento. Informe apenas os investimentos e recursos que ainda serão realizados.</p>
            <div class="grid gap-4 sm:grid-cols-2">@foreach(array_slice(\App\Enums\PatrimonyCategory::cases(), 0, 6) as $category)<x-proposal-field :model="'sources.'.$category->value.'.planned'" :label="$category->label().' — a realizar (R$)'" type="number" :money="true" :live="true" />@endforeach
            <x-proposal-field model="sources.OWN.planned" label="Recursos próprios a aplicar (R$)" type="number" :money="true" :live="true" />
            <x-proposal-field model="sources.OTHER.realized" label="Outras fontes já realizadas (R$)" type="number" :money="true" :live="true" />
            <x-proposal-field model="sources.OTHER.planned" label="Outras fontes a realizar (R$)" type="number" :money="true" :live="true" />
            </div>
            <p wire:loading wire:target="calculate" class="text-sm opacity-70">Atualizando cálculo…</p>
            @include('proposals.uses-sources', ['usesSources' => $this->usesSources])
        </div></section>
    </fieldset><x-proposal-actions :proposal="$this->proposal" /></form>
</div>
