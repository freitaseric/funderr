<?php

namespace App\Models;

use App\Enums\CashFlowType;
use App\Services\Proposals\ProposalCalculator;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CashFlowItem extends Model
{
    use HasFactory;

    protected $fillable = ['type', 'description', 'unit', 'quantity', 'unit_value', 'year_2', 'year_3', 'year_4', 'year_5', 'year_6', 'year_7'];

    protected function casts(): array
    {
        return [
            'type' => CashFlowType::class,
            'quantity' => 'decimal:4',
            'unit_value' => 'decimal:2',
            'year_2' => 'decimal:2',
            'year_3' => 'decimal:2',
            'year_4' => 'decimal:2',
            'year_5' => 'decimal:2',
            'year_6' => 'decimal:2',
            'year_7' => 'decimal:2',
        ];
    }

    public function proposal(): BelongsTo
    {
        return $this->belongsTo(Proposal::class, 'proposal_id');
    }

    public function total(): string
    {
        return ProposalCalculator::itemTotal($this->quantity, $this->unit_value);
    }
}
