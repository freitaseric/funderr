<?php

namespace App\Policies;

use App\Models\Proposal;
use App\Models\User;

class ProposalPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isActive() && ! $user->must_change_password;
    }

    public function view(User $user, Proposal $proposal): bool
    {
        if (! $this->viewAny($user)) {
            return false;
        }

        return $user->isAdministrator()
            || $user->isCore()
            || $proposal->created_by === $user->id
            || ($user->isTechnician() && filled($user->iater_unit) && $proposal->iater_unit === $user->iater_unit);
    }

    public function create(User $user): bool
    {
        return $this->viewAny($user) && $user->canActAsTechnician();
    }

    public function update(User $user, Proposal $proposal): bool
    {
        if (! $this->viewAny($user)) {
            return false;
        }

        if ($user->isAdministrator()) {
            return true;
        }

        return $user->isTechnician()
            && $this->view($user, $proposal)
            && $proposal->status->editable();
    }

    public function process(User $user, Proposal $proposal): bool
    {
        return $this->view($user, $proposal) && $user->canActAsCore();
    }
}
