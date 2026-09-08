@props(['proposal' => null])
@if (!$proposal || auth()->user()->can('update', $proposal))
    <div x-data="{ confirming: false }" class="flex flex-col gap-4 border-t border-base-300 pt-5">
        <div class="flex flex-wrap justify-end gap-3">
        <span wire:loading wire:target="save" role="status">Salvando…</span>
        <button class="btn btn-outline" type="submit" wire:loading.attr="disabled" wire:target="save">Salvar rascunho</button>
        <button class="btn btn-primary" type="button" @click="confirming = true" wire:loading.attr="disabled" wire:target="save">Concluir etapa e continuar</button>
        </div>
        <div x-show="confirming" x-cloak class="rounded-lg border border-warning/40 bg-warning/10 p-4" role="dialog" aria-label="Confirmar conclusão da etapa">
            <p class="font-semibold">Confirme a conclusão desta etapa</p>
            <p class="mt-1 text-sm">Os dados serão salvos e você seguirá para a próxima etapa. Você poderá voltar depois para corrigir a proposta enquanto ela estiver editável.</p>
            <div class="mt-3 flex flex-wrap justify-end gap-3">
                <button class="btn btn-ghost" type="button" @click="confirming = false">Voltar e corrigir</button>
                <button class="btn btn-primary" type="button" wire:click="save(true)" wire:loading.attr="disabled" wire:target="save" @click="confirming = false">Concluir etapa</button>
            </div>
        </div>
    </div>
@endif
