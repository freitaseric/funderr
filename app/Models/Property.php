<?php

namespace App\Models;

use App\Enums\Municipality;
use App\Enums\OccupancyType;
use App\Enums\PropertyDocumentType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Property extends Model
{
    protected $fillable = [
        'created_by',
        'beneficiary_id',
        'denomination',
        'address',
        'municipality',
        'state',
        'total_area',
        'occupancy_type',
        'exploration_years',
        'document_type',
        'latitude',
        'longitude',
    ];

    public function beneficiary(): BelongsTo
    {
        return $this->belongsTo(Beneficiary::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if ($user->isAdministrator() || $user->isCore()) {
            return $query;
        }

        return $query->where(function (Builder $query) use ($user): void {
            $query->where('created_by', $user->id)->orWhereNull('created_by');
        });
    }

    public static function calculateAvailableArea(float $totalArea): float
    {
        return $totalArea * 0.5;
    }

    public static function calculateFiscalModules(float $totalArea, Municipality $municipality): float
    {
        return $totalArea / $municipality->fiscalModuleHectares();
    }

    public function availableArea(): float
    {
        return self::calculateAvailableArea((float) $this->total_area);
    }

    public function fiscalModules(): float
    {
        return self::calculateFiscalModules((float) $this->total_area, $this->municipality);
    }

    public function fiscalModuleHectares(): int
    {
        return $this->municipality
            ->fiscalModuleHectares();
    }

    protected function casts(): array
    {
        return [
            'municipality' => Municipality::class,

            'occupancy_type' => OccupancyType::class,

            'document_type' => PropertyDocumentType::class,

            'total_area' => 'decimal:4',

            'exploration_years' => 'integer',

            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
        ];
    }
}
