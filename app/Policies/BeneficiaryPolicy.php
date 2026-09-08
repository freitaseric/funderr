<?php

namespace App\Policies;

use App\Models\Beneficiary;
use App\Models\User;

class BeneficiaryPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->active($user) && ($user->isAdministrator() || $user->isTechnician() || $user->isCore());
    }

    public function view(User $user, Beneficiary $beneficiary): bool
    {
        if (! $this->viewAny($user)) {
            return false;
        }

        return $user->isAdministrator() || $user->isCore() || $beneficiary->created_by === $user->id;
    }

    public function create(User $user): bool
    {
        return $this->active($user) && $user->canActAsTechnician();
    }

    public function update(User $user, Beneficiary $beneficiary): bool
    {
        return $this->create($user) && ($user->isAdministrator() || $beneficiary->created_by === $user->id);
    }

    private function active(User $user): bool
    {
        return $user->isActive() && ! $user->must_change_password;
    }
}
