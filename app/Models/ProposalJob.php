<?php

namespace App\Models;

use App\Enums\JobCategory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProposalJob extends Model
{
    use HasFactory;

    protected $fillable = ['category', 'current', 'expansion'];

    protected function casts(): array
    {
        return [
            'category' => JobCategory::class,
            'current' => 'integer',
            'expansion' => 'integer',
        ];
    }

    public function proposal(): BelongsTo
    {
        return $this->belongsTo(Proposal::class, 'proposal_id');
    }
}
