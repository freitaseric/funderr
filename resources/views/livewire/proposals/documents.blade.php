<div class="flex flex-col gap-6">
    <x-proposal-context :proposal="$this->proposal" :step="$this->step()" /><x-proposal-feedback />
    <section class="card bg-base-100" wire:poll.5s><div class="card-body gap-4">
        <h2 class="card-title">Contrato e documentação</h2>
        <p class="text-sm text-base-content/70">Gere o contrato, imprima-o, recolha a assinatura física e anexe o arquivo assinado. Os demais documentos são anexados conforme a necessidade do processo.</p>
        @php($contract = $this->proposal->documents()->where('type', \App\Enums\ProposalDocumentType::AterContract)->latest('id')->first())
        <div class="flex flex-wrap items-center gap-3">
            <button type="button" class="btn btn-primary" wire:click="generateContract" wire:loading.attr="disabled">Gerar contrato de assistência técnica</button>
            @if($contract?->status === \App\Enums\ProposalDocumentStatus::Ready)
                <a class="btn btn-outline" target="_blank" href="{{ route('proposals.documents.download', [$this->proposal, $contract]) }}">Baixar / imprimir contrato</a>
            @else
                <span class="text-sm text-base-content/70">Status do contrato: {{ $contract?->status->value ?? 'não solicitado' }}</span>
            @endif
        </div>
    </div></section>
    <section class="card bg-base-100"><div class="card-body gap-4">
        <h2 class="card-title">Anexar documento</h2>
        <div class="grid gap-4 sm:grid-cols-2">
            <label class="fieldset"><span class="label">Categoria</span><select class="select select-bordered" wire:model="type">@foreach(\App\Enums\ProposalDocumentType::cases() as $documentType) @if(!in_array($documentType, [\App\Enums\ProposalDocumentType::AterContract, \App\Enums\ProposalDocumentType::Dossier], true))<option value="{{ $documentType->value }}">{{ $documentType->label() }}</option>@endif @endforeach</select></label>
            <label class="fieldset"><span class="label">Arquivo (PDF, JPEG ou PNG)</span><input type="file" class="file-input file-input-bordered" wire:model="file" accept=".pdf,.jpg,.jpeg,.png" /></label>
        </div>
        <button type="button" class="btn btn-outline self-start" wire:click="upload" wire:loading.attr="disabled">Enviar documento</button>
        @error('file')<p class="text-sm text-error">{{ $message }}</p>@enderror
        <div class="overflow-x-auto"><table class="table table-sm"><thead><tr><th>Documento</th><th>Revisão</th><th>Status</th><th>Ação</th></tr></thead><tbody>@forelse($this->proposal->documents()->latest('id')->get() as $document)<tr wire:key="document-{{ $document->id }}"><td>{{ $document->type->label() }} @if($document->original_name)<span class="text-xs text-base-content/60">({{ $document->original_name }})</span>@endif</td><td>{{ $document->source_revision }}</td><td>{{ $document->status->value }}</td><td>@if($document->status === \App\Enums\ProposalDocumentStatus::Ready)<a class="link" href="{{ route('proposals.documents.download', [$this->proposal, $document]) }}">Baixar</a>@endif</td></tr>@empty<tr><td colspan="4">Nenhum documento anexado.</td></tr>@endforelse</tbody></table></div>
    </div></section>
    <button type="button" class="btn btn-primary self-start" wire:click="finish" wire:loading.attr="disabled">Concluir etapa de documentação</button>
</div>
