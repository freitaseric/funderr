<?php

namespace App\Services\Proposals;

use App\Enums\CashFlowType;
use App\Enums\PatrimonyCategory;
use App\Models\Proposal;
use App\Support\Money;

class ProposalCalculator
{
    public static function money(mixed $value): Money
    {
        return Money::from($value);
    }

    public static function number(mixed $value): string
    {
        if ($value === null || $value === '') {
            return '0';
        }
        $value = trim((string) $value);
        if (str_contains($value, ',')) {
            $value = str_replace('.', '', $value);
            $value = str_replace(',', '.', $value);
        } elseif (preg_match('/^\d{1,3}(?:\.\d{3})+$/', $value)) {
            $value = str_replace('.', '', $value);
        }

        return is_numeric($value) ? $value : '0';
    }

    public static function itemTotal(mixed $quantity, mixed $unitValue): string
    {
        return Money::from($unitValue)->multiplyDecimal(self::number($quantity), 4)->toDecimal();
    }

    private static function add(Money ...$values): Money
    {
        $result = Money::zero();
        foreach ($values as $value) {
            $result = $result->add($value);
        }

        return $result;
    }

    private static function decimal(mixed $value): string
    {
        return self::number($value);
    }

    public function patrimony(iterable $items, iterable $debts): array
    {
        $categories = array_fill_keys(array_column(PatrimonyCategory::cases(), 'value'), Money::zero());
        foreach ($items as $item) {
            $category = $item['category'] instanceof PatrimonyCategory ? $item['category']->value : $item['category'];
            $categories[$category] = $categories[$category]->add(Money::from(self::itemTotal($item['quantity'] ?? null, $item['unit_value'] ?? null)));
        }
        $urban = $categories[PatrimonyCategory::UrbanAssets->value];
        $gross = Money::zero();
        foreach ($categories as $category => $value) {
            if ($category !== PatrimonyCategory::UrbanAssets->value) {
                $gross = $gross->add($value);
            }
        }
        $debt = Money::zero();
        foreach ($debts as $item) {
            $debt = $debt->add(Money::from($item['outstanding_balance'] ?? null));
        }
        $total = $gross->add($urban);

        return ['categories' => array_map(fn (Money $value): string => $value->toDecimal(), $categories), 'gross' => $gross->toDecimal(), 'urban' => $urban->toDecimal(), 'debts' => $debt->toDecimal(), 'net' => $gross->subtract($debt)->toDecimal(), 'total' => $total->toDecimal()];
    }

    public function financing(array $scenario): array
    {
        $value = Money::from($scenario['proposal_value'] ?? null);
        $financed = $value->multiplyDecimal(self::decimal($scenario['financeable_percentage'] ?? 0), 4)->divide(100);
        $ater = $value->multiplyDecimal(self::decimal($scenario['ater_percentage'] ?? 0), 4)->divide(100);
        $project = $financed->add($ater);
        $term = (int) ($scenario['term_years'] ?? 0);
        $grace = (int) ($scenario['grace_years'] ?? 0);
        $result = ['financed' => $financed->toDecimal(), 'ater' => $ater->toDecimal(), 'project' => $project->toDecimal(), 'installments' => max(0, $term - $grace), 'schedule' => []];
        if ($term < 1 || $term > 7 || $grace < 0 || $grace >= $term || ! $project->isPositive()) {
            return $result;
        }
        $balance = $project;
        $amortization = Money::zero();
        $rate = self::decimal($scenario['annual_interest_rate'] ?? 0);
        for ($year = 1; $year <= $term; $year++) {
            $opening = $balance;
            $interest = $opening->multiplyDecimal($rate, 4)->divide(100);
            if ($year === $grace + 1) {
                $amortization = $balance->divide($term - $grace);
            }
            $principal = $year <= $grace ? Money::zero() : ($year === $term ? $opening : ($amortization->isGreaterThanOrEqual($balance) ? $balance : $amortization));
            if ($year <= $grace && ($scenario['grace_interest'] ?? 'PAY') === 'CAPITALIZE') {
                $balance = $balance->add($interest);
                $payment = Money::zero();
            } else {
                $payment = $interest->add($principal);
                $balance = $balance->subtract($principal);
            }
            $result['schedule'][$year] = ['year' => $year, 'opening' => $opening->toDecimal(), 'interest' => $interest->toDecimal(), 'principal' => $principal->toDecimal(), 'payment' => $payment->toDecimal(), 'closing' => ($balance->isNegative() ? Money::zero() : $balance)->toDecimal(), 'amortized_percentage' => $opening->isPositive() && $principal->isPositive() ? round(100 / ($term - $grace), 4) : 0.0];
        }

        return $result;
    }

    public function cashFlow(iterable $items, array $schedule): array
    {
        $years = [];
        for ($year = 1; $year <= 7; $year++) {
            $totals = array_fill_keys(array_column(CashFlowType::cases(), 'value'), Money::zero());
            foreach ($items as $item) {
                $type = $item['type'] instanceof CashFlowType ? $item['type']->value : $item['type'];
                $amount = Money::from($year === 1 ? self::itemTotal($item['quantity'] ?? null, $item['unit_value'] ?? null) : ($item['year_'.$year] ?? null));
                $totals[$type] = $totals[$type]->add($amount);
            }
            $revenue = $totals['REVENUE'];
            $variable = $totals['VARIABLE_COST'];
            $fixed = $totals['FIXED_COST'];
            $payment = Money::from($schedule[$year]['payment'] ?? null);
            $cost = $variable->add($fixed);
            $years[$year] = ['year' => $year, 'revenue' => $revenue->toDecimal(), 'variable_cost' => $variable->toDecimal(), 'fixed_cost' => $fixed->toDecimal(), 'total_cost' => $cost->toDecimal(), 'amortization' => $payment->toDecimal(), 'net_profit' => $revenue->subtract($cost)->subtract($payment)->toDecimal()];
        }

        return $years;
    }

    public function usesAndSources(array $patrimony, array $financing, iterable $entries): array
    {
        $manual = [];
        foreach ($entries as $entry) {
            $manual[$entry['category']] = $entry;
        } $uses = [];
        foreach (PatrimonyCategory::cases() as $category) {
            if ($category === PatrimonyCategory::UrbanAssets) {
                continue;
            } $realized = Money::from($patrimony['categories'][$category->value]);
            $planned = Money::from($manual[$category->value]['planned'] ?? 0);
            $uses[] = ['label' => $category->label(), 'realized' => $realized->toDecimal(), 'planned' => $planned->toDecimal(), 'total' => $realized->add($planned)->toDecimal()];
        }
        $ater = Money::from($financing['ater']);
        $uses[] = ['label' => 'Assistência técnica financiada', 'realized' => '0.00', 'planned' => $ater->toDecimal(), 'total' => $ater->toDecimal()];
        $net = Money::from($patrimony['net']);
        $own = Money::from($manual['OWN']['planned'] ?? 0);
        $otherRealized = Money::from($manual['OTHER']['realized'] ?? 0);
        $otherPlanned = Money::from($manual['OTHER']['planned'] ?? 0);
        $debt = Money::from($patrimony['debts']);
        $project = Money::from($financing['project']);
        $sources = [['label' => 'Recursos próprios', 'realized' => $net->toDecimal(), 'planned' => $own->toDecimal(), 'total' => $net->add($own)->toDecimal()], ['label' => 'Dívidas agropecuárias', 'realized' => $debt->toDecimal(), 'planned' => '0.00', 'total' => $debt->toDecimal()], ['label' => 'Desenvolve RR', 'realized' => '0.00', 'planned' => $project->toDecimal(), 'total' => $project->toDecimal()], ['label' => 'Outros', 'realized' => $otherRealized->toDecimal(), 'planned' => $otherPlanned->toDecimal(), 'total' => $otherRealized->add($otherPlanned)->toDecimal()]];
        $sum = fn (array $rows): Money => array_reduce($rows, fn (Money $total, array $row): Money => $total->add(Money::from($row['total'])), Money::zero());
        $usesTotal = $sum($uses);
        $sourcesTotal = $sum($sources);

        return ['uses' => $uses, 'sources' => $sources, 'uses_total' => $usesTotal->toDecimal(), 'sources_total' => $sourcesTotal->toDecimal(), 'difference' => $sourcesTotal->subtract($usesTotal)->toDecimal()];
    }

    public function summary(Proposal $proposal): array
    {
        $proposal->loadMissing(['beneficiary.references', 'property', 'creator', 'patrimonyItems', 'debts', 'financing.creditLine', 'identification', 'jobs', 'useSources', 'cashFlowItems', 'history.user']);
        $patrimony = $this->patrimony($proposal->patrimonyItems, $proposal->debts);
        $financing = $this->financing($proposal->financing?->toArray() ?? []);

        return ['patrimony' => $patrimony, 'financing' => $financing, 'uses_sources' => $this->usesAndSources($patrimony, $financing, $proposal->useSources), 'cash_flow' => $this->cashFlow($proposal->cashFlowItems, $financing['schedule'])];
    }
}
