<?php

namespace App\Models;

use App\Enums\ProposalStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProposalStatusHistory extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'from_status', 'to_status', 'reason', 'ip_address', 'user_agent'];

    protected function casts(): array
    {
        return [
            'from_status' => ProposalStatus::class,
            'to_status' => ProposalStatus::class,
        ];
    }

    public function proposal(): BelongsTo
    {
        return $this->belongsTo(Proposal::class, 'proposal_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
