<?php

namespace Tests\Feature;

use App\Enums\CashFlowType;
use App\Enums\PatrimonyCategory;
use App\Services\Proposals\ProposalCalculator;
use Tests\TestCase;

class ProposalCalculationsTest extends TestCase
{
    public function test_calcula_item_e_patrimonio_agropecuario_liquido_sem_bens_urbanos(): void
    {
        $calculator = app(ProposalCalculator::class);
        $totals = $calculator->patrimony([
            ['category' => PatrimonyCategory::Land, 'quantity' => '10', 'unit_value' => '1000'],
            ['category' => PatrimonyCategory::Buildings, 'quantity' => '1', 'unit_value' => '5000'],
            ['category' => PatrimonyCategory::UrbanAssets, 'quantity' => '1', 'unit_value' => '8000'],
        ], [['outstanding_balance' => '2500']]);

        $this->assertSame('15000.00', $totals['gross']);
        $this->assertSame('8000.00', $totals['urban']);
        $this->assertSame('12500.00', $totals['net']);
        $this->assertSame('23000.00', $totals['total']);
    }

    public function test_calcula_sac_anual_com_carencia_e_ater_no_principal(): void
    {
        $schedule = app(ProposalCalculator::class)->financing([
            'proposal_value' => '21000', 'financeable_percentage' => '100', 'ater_percentage' => '1.5',
            'annual_interest_rate' => '3', 'term_years' => 7, 'grace_years' => 2, 'grace_interest' => 'PAY',
        ]);

        $this->assertSame('21000.00', $schedule['financed']);
        $this->assertSame('315.00', $schedule['ater']);
        $this->assertSame('21315.00', $schedule['project']);
        $this->assertSame('639.45', $schedule['schedule'][1]['payment']);
        $this->assertSame('4263.00', $schedule['schedule'][3]['principal']);
        $this->assertSame('0.00', $schedule['schedule'][7]['closing']);
    }

    public function test_resumo_de_caixa_subtrai_a_prestacao_sem_redigitacao(): void
    {
        $summary = app(ProposalCalculator::class)->cashFlow([
            ['type' => CashFlowType::Revenue, 'quantity' => '2', 'unit_value' => '100', 'year_2' => '300'],
            ['type' => CashFlowType::VariableCost, 'quantity' => '1', 'unit_value' => '40', 'year_2' => '50'],
            ['type' => CashFlowType::FixedCost, 'quantity' => '1', 'unit_value' => '10', 'year_2' => '20'],
        ], [1 => ['payment' => 25.0], 2 => ['payment' => 30.0]]);

        $this->assertSame('200.00', $summary[1]['revenue']);
        $this->assertSame('50.00', $summary[1]['total_cost']);
        $this->assertSame('125.00', $summary[1]['net_profit']);
        $this->assertSame('200.00', $summary[2]['net_profit']);
    }

    public function test_calcula_primeiro_ano_com_valor_monetario_formatado(): void
    {
        $summary = app(ProposalCalculator::class)->cashFlow([
            ['type' => CashFlowType::Revenue, 'quantity' => '1', 'unit_value' => 'R$ 27.570,00'],
        ], []);

        $this->assertSame('27570.00', $summary[1]['revenue']);
    }

    public function test_interpreta_formatos_monetarios_brasileiros_sem_float(): void
    {
        foreach (['18000', '18.000,00', '18000,00', 'R$ 18.000,00'] as $value) {
            $this->assertSame('18000.00', ProposalCalculator::itemTotal('1', $value));
        }
    }
}
