<?php

namespace App\Policies;

use App\Models\Property;
use App\Models\User;

class PropertyPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->active($user) && ($user->isAdministrator() || $user->isTechnician() || $user->isCore());
    }

    public function view(User $user, Property $property): bool
    {
        if (! $this->viewAny($user)) {
            return false;
        }

        return $user->isAdministrator() || $user->isCore() || $property->created_by === null || $property->created_by === $user->id;
    }

    public function create(User $user): bool
    {
        return $this->active($user) && $user->canActAsTechnician();
    }

    public function update(User $user, Property $property): bool
    {
        return $this->create($user) && ($user->isAdministrator() || $property->created_by === $user->id);
    }

    private function active(User $user): bool
    {
        return $user->isActive() && ! $user->must_change_password;
    }
}
