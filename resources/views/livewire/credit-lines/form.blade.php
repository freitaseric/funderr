<form wire:submit="save" class="card bg-base-100 shadow">
    <div class="card-body gap-5">
        <x-proposal-feedback />
        <x-proposal-field model="name" label="Nome *"/>
        <label class="label cursor-pointer justify-start gap-3"><input type="checkbox" wire:model="active"
                                                                       class="checkbox"> <span>Linha ativa para novas propostas</span></label>
        <label class="label cursor-pointer justify-start gap-3"><input type="checkbox" wire:model="requiresGuarantor"
                                                                       class="checkbox"> <span>Exige avalista para a proposta</span></label>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <x-proposal-field model="financingLimit" label="Teto de financiamento (R$)" type="number" :money="true"
                              step="0.01" :required="true"/>
            <x-proposal-field model="annualInterestRate" label="Taxa anual (%)" type="number" step="0.5"/>
            <x-proposal-field model="maxFinanceablePercentage" label="Financiável máximo (%)" type="number"
                              step="1"/>
            <x-proposal-field model="defaultAterPercentage" label="ATER padrão (%)" type="number" step="0.5"/>
            <x-proposal-field model="maxTermYears" label="Prazo máximo (anos)" type="number" step="1"/>
            <x-proposal-field model="maxGraceYears" label="Carência máxima (anos)" type="number" step="1"/>
        </div>
        <x-proposal-field model="notes" label="Observações" type="textarea"/>
        <div class="card-actions justify-end border-t border-base-300 pt-4"><a
                href="{{ route('admin.credit-lines.index') }}" class="btn btn-ghost">Cancelar</a>
            <button class="btn btn-primary" wire:loading.attr="disabled">Salvar linha</button>
        </div>
    </div>
</form>
