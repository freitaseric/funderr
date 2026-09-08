<x-layout title="Início — FUNDERR">
    <div class="flex flex-col gap-8">
        <header class="flex flex-wrap items-center justify-between gap-4 border-b border-base-300 pb-5">
            <div class="flex items-center gap-3">
                <img src="{{ asset('funderr-logo.png') }}" alt="FUNDERR" class="size-11 rounded-xl object-contain">
                <div>
                    <p class="text-xl font-bold tracking-tight">FUNDERR</p>
                    <p class="text-sm text-base-content/70">IATER · Crédito rural</p>
                </div>
            </div>

            <div class="flex flex-wrap items-center gap-3">
                <span class="badge badge-outline">{{ auth()->user()->role->label() }}</span>
                <form method="POST" action="{{ route('logout') }}">
                    @csrf
                    <button type="submit" class="btn btn-ghost btn-sm">Sair</button>
                </form>
            </div>
        </header>

        <section class="overflow-hidden rounded-2xl bg-primary text-primary-content" aria-labelledby="welcome-title">
            <div class="grid gap-8 p-6 sm:p-8 md:grid-cols-5 md:items-center">
                <div class="flex flex-col gap-4 md:col-span-3">
                    <p class="text-sm font-medium uppercase tracking-widest">Central de propostas</p>
                    <h1 id="welcome-title" class="text-3xl font-semibold tracking-tight sm:text-4xl">
                        Olá, {{ auth()->user()->name }}.
                    </h1>
                    <p class="max-w-lg text-base leading-relaxed">
                        @if (auth()->user()->canActAsTechnician())
                            Elabore, acompanhe e conclua as propostas de crédito rural em um único fluxo.
                        @else
                            Acompanhe as propostas em revisão, registre a tramitação e consulte os dados que as compõem.
                        @endif
                    </p>
                    <div class="flex flex-wrap gap-3 pt-2">
                        <a href="{{ route('proposals.index') }}" class="btn border-base-100 bg-base-100 text-base-content hover:border-base-200 hover:bg-base-200">Ver propostas</a>
                        @if (auth()->user()->canActAsTechnician())
                            <a href="{{ route('proposals.create') }}" class="btn btn-ghost border-primary-content/40 text-primary-content"><span aria-hidden="true">+</span> Nova proposta</a>
                        @endif
                    </div>
                </div>

                <div class="flex flex-col gap-4 rounded-xl bg-base-100 p-5 text-base-content shadow-sm md:col-span-2">
                    <div>
                        <p class="font-semibold">Fluxo de elaboração</p>
                        <p class="mt-1 text-sm text-base-content/70">Dados salvos por etapa, sem redigitação.</p>
                    </div>
                    <ol class="grid gap-2 text-sm">
                        @foreach (['Dados iniciais', 'Patrimônio', 'Financiamento', 'Identificação', 'Fluxo de caixa', 'Revisão'] as $position => $step)
                            <li class="flex items-center gap-3"><span class="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{{ $position + 1 }}</span>{{ $step }}</li>
                        @endforeach
                    </ol>
                </div>
            </div>
        </section>

        <nav aria-labelledby="modules-title" class="flex flex-col gap-4">
            <div>
                <h2 id="modules-title" class="text-xl font-semibold">Cadastros que apoiam a proposta</h2>
                <p class="mt-1 text-sm text-base-content/70">Mantenha os dados reutilizáveis atualizados antes de iniciar a elaboração.</p>
            </div>

            <div class="grid gap-4 sm:grid-cols-2 {{ auth()->user()->isAdministrator() ? 'lg:grid-cols-3' : '' }}">
                <a href="{{ route('beneficiaries.index') }}" class="card border border-base-300 bg-base-100 shadow-sm transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                    <div class="card-body gap-4">
                        <span class="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary" aria-hidden="true">
                            <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="9" cy="8" r="3"/><path d="M3 21v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M21 21v-2a6 6 0 0 0-4-5.65"/>
                            </svg>
                        </span>
                        <div>
                            <h3 class="card-title">Beneficiários</h3>
                            <p class="mt-2 text-sm leading-relaxed text-base-content/70">Dados pessoais, contatos e referências usados na identificação da proposta.</p>
                        </div>
                        <span class="mt-auto pt-2 text-sm font-semibold text-primary">Consultar beneficiários <span aria-hidden="true">→</span></span>
                    </div>
                </a>

                <a href="{{ route('properties.index') }}" class="card border border-base-300 bg-base-100 shadow-sm transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                    <div class="card-body gap-4">
                        <span class="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary" aria-hidden="true">
                            <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                                <path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-7h6v7"/>
                            </svg>
                        </span>
                        <div>
                            <h3 class="card-title">Propriedades</h3>
                            <p class="mt-2 text-sm leading-relaxed text-base-content/70">Área, localização e exploração vinculadas ao beneficiário da proposta.</p>
                        </div>
                        <span class="mt-auto pt-2 text-sm font-semibold text-primary">Consultar propriedades <span aria-hidden="true">→</span></span>
                    </div>
                </a>

                @if (auth()->user()->isAdministrator())
                    <a href="{{ route('admin.users.index') }}" class="card border border-base-300 bg-base-100 shadow-sm transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                        <div class="card-body gap-4">
                            <span class="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary" aria-hidden="true">
                                <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="m12 3 8 4v5c0 5-8 9-8 9s-8-4-8-9V7l8-4Z"/><path d="m8 12 3 3 5-5"/>
                                </svg>
                            </span>
                            <div>
                                <h3 class="card-title">Usuários</h3>
                                <p class="mt-2 text-sm leading-relaxed text-base-content/70">Gerencie contas, perfis de acesso e senhas da equipe.</p>
                            </div>
                            <span class="mt-auto pt-2 text-sm font-semibold text-primary">Gerenciar usuários <span aria-hidden="true">→</span></span>
                        </div>
                    </a>
                    <a href="{{ route('admin.credit-lines.index') }}" class="card border border-base-300 bg-base-100 shadow-sm transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                        <div class="card-body gap-4"><span class="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary" aria-hidden="true">₿</span><div><h3 class="card-title">Linhas de crédito</h3><p class="mt-2 text-sm leading-relaxed text-base-content/70">Configure limites, juros, prazos e percentuais das linhas disponíveis.</p></div><span class="mt-auto pt-2 text-sm font-semibold text-primary">Configurar linhas <span aria-hidden="true">→</span></span></div>
                    </a>
                @endif
            </div>
        </nav>

        <aside class="flex flex-col gap-2 rounded-xl border border-base-300 p-5 sm:flex-row sm:items-start sm:gap-6" aria-labelledby="guidance-title">
            <h2 id="guidance-title" class="shrink-0 font-semibold">{{ auth()->user()->canActAsTechnician() ? 'Próximo passo' : 'Acompanhamento' }}</h2>
            <p class="text-sm leading-relaxed text-base-content/70">
                @if (auth()->user()->canActAsTechnician())
                    Comece uma proposta quando o beneficiário e uma propriedade vinculada já estiverem cadastrados. Você poderá salvar rascunhos e retomar qualquer etapa.
                @else
                    Consulte as propostas em revisão para liberar, devolver, registrar o envio manual ou a resposta da Desenvolve RR.
                @endif
            </p>
        </aside>

        <footer class="pb-2 text-center text-xs text-base-content/60">
            Instituto de Assistência Técnica e Extensão Rural · Roraima
        </footer>
    </div>
</x-layout>
