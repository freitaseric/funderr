<div class="overflow-x-auto"><table class="table table-sm"><caption class="pb-3 text-left font-semibold">Resumo anual (R$)</caption><thead><tr><th>Descrição</th>@foreach($cashFlow as $year => $row)<th>Ano {{ $year }}</th>@endforeach</tr></thead><tbody>
@foreach(['revenue' => 'Receitas', 'variable_cost' => 'Custos variáveis', 'fixed_cost' => 'Custos fixos', 'total_cost' => 'Total de custos', 'amortization' => 'Amortização (prestação com juros)', 'net_profit' => 'Lucro líquido'] as $field => $label)
<tr @if($field === 'net_profit') class="font-bold" @endif><th>{{ $label }}</th>@foreach($cashFlow as $row)<td class="whitespace-nowrap {{ $row[$field] < 0 ? 'text-error' : '' }}">{{ number_format($row[$field], 2, ',', '.') }}</td>@endforeach</tr>
@endforeach</tbody></table></div>
