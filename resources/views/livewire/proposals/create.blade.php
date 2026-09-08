<div class="flex flex-col gap-6">
    @if($proposalId)<x-proposal-context :proposal="$this->proposal" :step="$this->step()" />@else<a href="{{ route('proposals.index') }}" class="link">← Propostas</a><h1 class="text-3xl font-bold">Nova proposta</h1><p>Selecione os cadastros existentes. O número e a data serão gerados ao salvar.</p>@endif
    <x-proposal-feedback />
    <form wire:submit="save" class="flex flex-col gap-6">
        <fieldset class="card bg-base-100" @disabled($proposalId && !auth()->user()->can('update', $this->proposal))><div class="card-body grid gap-4 md:grid-cols-2">
            <div class="flex flex-col gap-3">
                <label for="proposal-beneficiary">Beneficiário <span aria-hidden="true" class="text-error">*</span></label>
                <x-searchable-select
                    id="proposal-beneficiary"
                    model="data.beneficiary_id"
                    :value="$data['beneficiary_id']"
                    :options="$this->beneficiaries->map(fn ($beneficiary) => ['value' => $beneficiary->id, 'label' => $beneficiary->name.' — '.(auth()->user()->isAdministrator() ? $beneficiary->formattedCpf() : $beneficiary->maskedCpf())])->all()"
                    search-model="search"
                    search-placeholder="Buscar por nome ou CPF"
                    :live="true"
                />
                <p class="text-sm">Exibindo até 20 resultados mais relevantes, além do beneficiário selecionado.</p>
            </div>
            <div class="flex flex-col gap-3">
                <label for="proposal-property">Propriedade do beneficiário <span aria-hidden="true" class="text-error">*</span></label>
                <x-searchable-select
                    id="proposal-property"
                    model="data.property_id"
                    :value="$data['property_id']"
                    :options="$this->properties->map(fn ($property) => ['value' => $property->id, 'label' => $property->denomination.' — '.$property->municipality->label()])->all()"
                    search-model="propertySearch"
                    search-placeholder="Buscar por denominação ou município"
                    :disabled="! $data['beneficiary_id']"
                />
                @if($data['beneficiary_id'] && $this->properties->isEmpty())<p>Cadastre uma propriedade para esse beneficiário antes de continuar.</p><a href="{{ route('properties.create') }}" class="link">Cadastrar propriedade</a>@endif
            </div>
            <div class="grid gap-4 sm:grid-cols-2"><div><label for="activity-category">Categoria principal <span aria-hidden="true" class="text-error">*</span></label><x-searchable-select id="activity-category" model="activityCategory" :value="$activityCategory" :options="collect($activityCategories)->map(fn ($item) => ['value' => $item->value, 'label' => $item->label()])->all()" :live="true" placeholder="Selecione a categoria" search-placeholder="Pesquisar categoria" /></div><div><label for="activity-detail">Detalhamento <span aria-hidden="true" class="text-error">*</span></label><x-searchable-select id="activity-detail" model="activityDetail" :value="$activityDetail" :options="collect($activityDetails)->map(fn ($item) => ['value' => $item, 'label' => $item])->all()" placeholder="Selecione o detalhamento" search-placeholder="Pesquisar atividade" :disabled="$activityCategory === ''" /></div></div>
            <div class="fieldset"><label class="fieldset-label" for="iater-unit">Unidade IATER</label><input id="iater-unit" value="{{ auth()->user()->iater_unit ?? 'Não definida' }}" class="input w-full" disabled><p class="text-sm text-base-content/70">Preenchida automaticamente a partir da unidade do usuário logado.</p></div>
            <div class="md:col-span-2"><x-proposal-field model="data.purpose" label="Finalidade do financiamento" type="textarea" :required="true" /></div>
        </div></fieldset>
        <x-proposal-actions :proposal="$proposalId ? $this->proposal : null" />
    </form>
</div>
