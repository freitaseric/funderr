<?php

namespace App\Models;

use App\Enums\ProposalStatus;
use App\Enums\ProposalStep;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Proposal extends Model
{
    use HasFactory;

    protected $fillable = ['beneficiary_id', 'property_id', 'created_by', 'number', 'proposal_date', 'activity', 'purpose', 'iater_unit', 'current_step', 'status', 'completed_steps', 'revision'];

    protected function casts(): array
    {
        return [
            'proposal_date' => 'date',
            'current_step' => ProposalStep::class,
            'status' => ProposalStatus::class,
            'completed_steps' => 'array',
            'revision' => 'integer',
        ];
    }

    public function beneficiary(): BelongsTo
    {
        return $this->belongsTo(Beneficiary::class, 'beneficiary_id');
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class, 'property_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function patrimonyItems(): HasMany
    {
        return $this->hasMany(PatrimonyItem::class, 'proposal_id');
    }

    public function debts(): HasMany
    {
        return $this->hasMany(PatrimonyDebt::class, 'proposal_id');
    }

    public function financing(): HasOne
    {
        return $this->hasOne(FinancingScenario::class, 'proposal_id');
    }

    public function guarantees(): HasMany
    {
        return $this->hasMany(Guarantee::class, 'proposal_id');
    }

    public function identification(): HasOne
    {
        return $this->hasOne(ProposalIdentification::class, 'proposal_id');
    }

    public function jobs(): HasMany
    {
        return $this->hasMany(ProposalJob::class, 'proposal_id');
    }

    public function useSources(): HasMany
    {
        return $this->hasMany(ProposalUseSource::class, 'proposal_id');
    }

    public function cashFlowItems(): HasMany
    {
        return $this->hasMany(CashFlowItem::class, 'proposal_id');
    }

    public function history(): HasMany
    {
        return $this->hasMany(ProposalStatusHistory::class, 'proposal_id');
    }

    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if ($user->isAdministrator() || $user->isCore()) {
            return $query;
        }

        return $query->where(function (Builder $query) use ($user): void {
            $query->where('created_by', $user->id)
                ->orWhere(function (Builder $query) use ($user): void {
                    $query->whereNotNull('iater_unit')
                        ->where('iater_unit', $user->iater_unit);
                });
        });
    }
}
