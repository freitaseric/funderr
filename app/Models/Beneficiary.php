<?php

namespace App\Models;

use App\Enums\EducationLevel;
use App\Enums\MaritalStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Beneficiary extends Model
{
    use HasFactory;

    protected $fillable = [
        'created_by',
        'name',
        'nickname',
        'cpf',
        'rg',
        'phone',
        'birth_date',
        'place_of_birth',
        'marital_status',
        'education_level',
        'dependents',
        'address',
        'spouse_name',
        'spouse_cpf',
        'spouse_rg',
        'position',
    ];

    public function references(): HasMany
    {
        return $this->hasMany(BeneficiaryReference::class)
            ->orderBy('position');
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

        return $query->where('created_by', $user->id);
    }

    public function properties(): HasMany
    {
        return $this->hasMany(Property::class);
    }

    public function formattedCpf(): string
    {
        return self::formatCpf($this->cpf);
    }

    public function maskedCpf(): string
    {
        if (strlen($this->cpf) !== 11) {
            return 'CPF não informado';
        }

        return '***.***.'.substr($this->cpf, 6, 3).'-'.substr($this->cpf, 9, 2);
    }

    private static function formatCpf(string $cpf): string
    {
        return preg_replace(
            '/(\d{3})(\d{3})(\d{3})(\d{2})/',
            '$1.$2.$3-$4',
            $cpf
        ) ?? $cpf;
    }

    public function formattedSpouseCpf(): ?string
    {
        if (! $this->spouse_cpf) {
            return null;
        }

        return self::formatCpf($this->spouse_cpf);
    }

    public function maskedSpouseCpf(): ?string
    {
        if (! $this->spouse_cpf || strlen($this->spouse_cpf) !== 11) {
            return $this->spouse_cpf ? 'CPF não informado' : null;
        }

        return '***.***.'.substr($this->spouse_cpf, 6, 3).'-'.substr($this->spouse_cpf, 9, 2);
    }

    public function maskedPhone(string $phone): string
    {
        if (strlen($phone) === 11) {
            return '(**) *****-'.substr($phone, -4);
        }

        if (strlen($phone) === 10) {
            return '(**) ****-'.substr($phone, -4);
        }

        return 'Telefone não informado';
    }

    public function formattedPhone(): string
    {
        if (strlen($this->phone) === 11) {
            return preg_replace(
                '/(\d{2})(\d{5})(\d{4})/',
                '($1) $2-$3',
                $this->phone
            ) ?? $this->phone;
        }

        return preg_replace(
            '/(\d{2})(\d{4})(\d{4})/',
            '($1) $2-$3',
            $this->phone
        ) ?? $this->phone;
    }

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'marital_status' => MaritalStatus::class,
            'education_level' => EducationLevel::class,
            'dependents' => 'integer',
        ];
    }
}
