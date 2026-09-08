<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProposalUseSource extends Model
{
    use HasFactory;

    protected $fillable = ['category', 'planned', 'realized'];

    protected function casts(): array
    {
        return [
            'planned' => 'decimal:2',
            'realized' => 'decimal:2',
        ];
    }

    public function proposal(): BelongsTo
    {
        return $this->belongsTo(Proposal::class, 'proposal_id');
    }
}
