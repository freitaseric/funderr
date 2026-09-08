@props(['proposal', 'step'])
<header class="flex flex-col gap-4">
    <a href="{{ route('proposals.index') }}" class="link w-fit">← Propostas</a>
    <div class="flex flex-wrap justify-between gap-3">
        <div><h1 class="text-2xl font-bold">{{ $proposal->number }}</h1><p>{{ $proposal->beneficiary->name }} · {{ auth()->user()->isAdministrator() ? $proposal->beneficiary->formattedCpf() : $proposal->beneficiary->maskedCpf() }}</p><p class="text-sm text-base-content/70">{{ $proposal->property->denomination }} · {{ $proposal->property->municipality->label() }} · {{ $proposal->proposal_date->format('d/m/Y') }}</p></div>
        <span class="badge badge-outline">{{ $proposal->status->label() }}</span>
    </div>
    <nav aria-label="Etapas da proposta" class="flex flex-wrap gap-2">
        @foreach (\App\Enums\ProposalStep::cases() as $stage)
            <a href="{{ route('proposals.edit', [$proposal, $stage->value]) }}" class="btn btn-sm {{ $stage === $step ? 'btn-primary' : 'btn-ghost' }}" @if($stage === $step) aria-current="step" @endif>
                {{ $stage->position() + 1 }}. {{ $stage->label() }}
                @if(in_array($stage->value, $proposal->completed_steps ?? [], true))<span aria-label="Concluída">✓</span>@endif
            </a>
        @endforeach
    </nav>
    @cannot('update', $proposal)<p class="alert">Consulta da proposta. A edição fica disponível aos técnicos e administradores durante rascunho ou devolução.</p>@endcannot
</header>
