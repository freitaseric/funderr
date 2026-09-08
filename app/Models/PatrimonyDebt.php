<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatrimonyDebt extends Model
{
    use HasFactory;

    protected $fillable = ['creditor', 'purpose', 'due_date', 'outstanding_balance'];

    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'outstanding_balance' => 'decimal:2',
        ];
    }

    public function proposal(): BelongsTo
    {
        return $this->belongsTo(Proposal::class, 'proposal_id');
    }
}
