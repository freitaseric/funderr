<?php

namespace App\Actions\Fortify;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\UpdatesUserPasswords;

class UpdateUserPassword implements UpdatesUserPasswords
{
    use PasswordValidationRules;

    /**
     * @param  array<string, string>  $input
     *
     * @throws ValidationException
     */
    public function update(User $user, array $input): void
    {
        Validator::make(
            $input,
            [
                'current_password' => [
                    'required',
                    'string',
                    'current_password:web',
                ],

                'password' => [
                    ...$this->passwordRules(),
                    'different:current_password',
                ],
            ],
            [
                'current_password.current_password' => 'A senha atual informada está incorreta.',

                'password.different' => 'A nova senha deve ser diferente da senha atual.',
            ],
        )->validateWithBag('updatePassword');

        $user->forceFill([
            'password' => Hash::make($input['password']),
            'must_change_password' => false,
            'temporary_password_expires_at' => null,
        ])->save();
    }
}
