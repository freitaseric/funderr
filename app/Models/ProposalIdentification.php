<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProposalIdentification extends Model
{
    use HasFactory;

    protected $fillable = ['market', 'last_year_revenue', 'location_analysis', 'considerations'];

    protected function casts(): array
    {
        return [
            'last_year_revenue' => 'decimal:2',
        ];
    }

    public function proposal(): BelongsTo
    {
        return $this->belongsTo(Proposal::class, 'proposal_id');
    }
}
