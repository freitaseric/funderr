<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'cpf', 'role', 'iater_unit', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    public function temporaryPasswordHasExpired(): bool
    {
        return $this->must_change_password
            && $this->temporary_password_expires_at !== null
            && $this->temporary_password_expires_at->isPast();
    }

    public function isActive(): bool
    {
        return $this->disabled_at === null;
    }

    public function canActAsTechnician(): bool
    {
        return $this->isTechnician()
            || $this->isAdministrator();
    }

    public function isTechnician(): bool
    {
        return $this->role === UserRole::Technician;
    }

    public function isAdministrator(): bool
    {
        return $this->role === UserRole::Administrator;
    }

    public function canActAsCore(): bool
    {
        return $this->isCore()
            || $this->isAdministrator();
    }

    public function isCore(): bool
    {
        return $this->role === UserRole::Core;
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'must_change_password' => 'boolean',
            'disabled_at' => 'datetime',
            'temporary_password_expires_at' => 'datetime',
            'role' => UserRole::class,
        ];
    }
}
