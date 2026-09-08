<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CreditLine extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'active', 'requires_guarantor', 'financing_limit', 'annual_interest_rate', 'max_term_years', 'max_grace_years', 'max_financeable_percentage', 'default_ater_percentage', 'notes'];

    protected function casts(): array
    {
        return [
            'active' => 'boolean',
            'requires_guarantor' => 'boolean',
            'financing_limit' => 'decimal:2',
            'annual_interest_rate' => 'decimal:4',
            'max_term_years' => 'integer',
            'max_grace_years' => 'integer',
            'max_financeable_percentage' => 'decimal:4',
            'default_ater_percentage' => 'decimal:4',
        ];
    }
}
