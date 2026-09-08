<?php

namespace App\Services\Proposals;

use App\Models\Proposal;
use Illuminate\Support\Arr;
use Illuminate\View\View;

class ProposalDocuments
{
    /** @return array<string, string> */
    public function available(): array
    {
        return [
            'patrimony-part-01' => 'Levantamento Patrimonial Agropecuário — Parte 01',
            'patrimony-part-02' => 'Levantamento Patrimonial Agropecuário — Parte 02',
            'financing' => 'Financiamento do Plano',
            'identification' => 'Identificação da Proposta',
            'cash-flow' => 'Resumo do Fluxo de Caixa',
            'process-flow' => 'Fluxo do Processo',
        ];
    }

    public function render(Proposal $proposal, string $document): View
    {
        abort_unless(Arr::has($this->available(), $document), 404);

        $summary = app(ProposalCalculator::class)->summary($proposal);

        return view('proposals.documents.summary', [
            'document' => $document,
            'title' => $this->available()[$document],
            'proposal' => $proposal,
            'summary' => $summary,
        ]);
    }
}
