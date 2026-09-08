<?php

namespace App\Actions;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class IssueTemporaryPassword
{
    public function handle(User $user): string
    {
        $password = Str::password(16, symbols: false);

        DB::transaction(function () use ($user, $password): void {
            $user->forceFill([
                'password' => $password,
                'must_change_password' => true,
                'temporary_password_expires_at' => now()->addDay(),
                'remember_token' => Str::random(60),
            ])->save();

            if (config('session.driver') === 'database') {
                DB::table('sessions')->where('user_id', $user->id)->delete();
            }
        });

        return $password;
    }
}
