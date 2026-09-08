<?php

namespace App\Models;

use App\Enums\PatrimonyCategory;
use App\Services\Proposals\ProposalCalculator;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatrimonyItem extends Model
{
    use HasFactory;

    protected $fillable = ['category', 'description', 'unit', 'quantity', 'unit_value'];

    protected function casts(): array
    {
        return [
            'category' => PatrimonyCategory::class,
            'quantity' => 'decimal:4',
            'unit_value' => 'decimal:2',
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
