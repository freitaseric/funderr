<?php

namespace App\Console\Commands;

use App\Actions\IssueTemporaryPassword;
use App\Enums\UserRole;
use App\Models\User;
use App\Rules\Cpf;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;

class CreateFunderrAdmin extends Command
{
    protected $signature = 'funderr:create-admin';

    protected $description = 'Cria um administrador do FUNDERR';

    public function handle(): int
    {
        $name = trim((string) $this->ask('Nome'));

        $cpfInput = trim((string) $this->ask('CPF'));

        $cpf = preg_replace('/\D/', '', $cpfInput);

        if (Validator::make(['cpf' => $cpf], ['cpf' => ['required', new Cpf]])->fails()) {
            $this->error('Informe um CPF válido.');

            return self::FAILURE;
        }

        if (User::query()->where('cpf', $cpf)->exists()) {
            $this->error('Já existe um usuário com este CPF.');

            return self::FAILURE;
        }

        $emailInput = trim(
            (string) $this->ask('E-mail (opcional)')
        );

        $email = $emailInput !== ''
            ? $emailInput
            : null;

        if (
            $email !== null
            && User::query()->where('email', $email)->exists()
        ) {
            $this->error('Já existe um usuário com este e-mail.');

            return self::FAILURE;
        }

        $user = new User([
            'name' => $name,
            'cpf' => $cpf,
            'email' => $email,
            'role' => UserRole::Administrator,
        ]);

        $temporaryPassword = app(IssueTemporaryPassword::class)->handle($user);

        $this->newLine();

        $this->info('Administrador criado com sucesso.');

        $this->newLine();

        $this->table(
            ['Campo', 'Valor'],
            [
                ['Nome', $user->name],
                ['CPF', $this->formatCpf($user->cpf)],
                ['Perfil', $user->role->label()],
                ['Senha temporária', $temporaryPassword],
            ],
        );

        $this->newLine();

        $this->warn(
            'A senha temporária expira em 24 horas. O usuário deverá alterá-la no primeiro acesso.'
        );

        return self::SUCCESS;
    }

    private function formatCpf(string $cpf): string
    {
        return sprintf(
            '%s.%s.%s-%s',
            substr($cpf, 0, 3),
            substr($cpf, 3, 3),
            substr($cpf, 6, 3),
            substr($cpf, 9, 2),
        );
    }
}
