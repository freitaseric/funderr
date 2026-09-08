<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinancingScenario extends Model
{
    use HasFactory;

    protected $fillable = ['credit_line_id', 'proposal_value', 'financeable_percentage', 'ater_percentage', 'annual_interest_rate', 'term_years', 'grace_years', 'grace_interest', 'periodicity'];

    protected function casts(): array
    {
        return [
            'proposal_value' => 'decimal:2',
            'financeable_percentage' => 'decimal:4',
            'ater_percentage' => 'decimal:4',
            'annual_interest_rate' => 'decimal:4',
            'term_years' => 'integer',
            'grace_years' => 'integer',
        ];
    }

    public function proposal(): BelongsTo
    {
        return $this->belongsTo(Proposal::class, 'proposal_id');
    }

    public function creditLine(): BelongsTo
    {
        return $this->belongsTo(CreditLine::class, 'credit_line_id');
    }
}
