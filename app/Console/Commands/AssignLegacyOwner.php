<?php

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Models\Beneficiary;
use App\Models\Property;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class AssignLegacyOwner extends Command
{
    protected $signature = 'funderr:assign-legacy-owner
                            {user : ID do técnico que assumirá os registros}
                            {--model=all : all, beneficiaries ou properties}
                            {--dry-run : apenas mostra a quantidade, sem alterar dados}';

    protected $description = 'Atribui registros legados sem responsável a um técnico';

    public function handle(): int
    {
        $user = User::query()->find($this->argument('user'));
        $model = (string) $this->option('model');

        if (! $user || $user->role !== UserRole::Technician || ! $user->isActive()) {
            $this->error('Informe o ID de um técnico ativo.');

            return self::FAILURE;
        }

        if (! in_array($model, ['all', 'beneficiaries', 'properties'], true)) {
            $this->error('O parâmetro --model deve ser all, beneficiaries ou properties.');

            return self::FAILURE;
        }

        $counts = [
            'beneficiaries' => in_array($model, ['all', 'beneficiaries'], true)
                ? Beneficiary::query()->whereNull('created_by')->count()
                : 0,
            'properties' => in_array($model, ['all', 'properties'], true)
                ? Property::query()->whereNull('created_by')->count()
                : 0,
        ];

        $this->table(['Registro', 'Sem responsável'], [
            ['Beneficiários', $counts['beneficiaries']],
            ['Propriedades', $counts['properties']],
        ]);

        if ($this->option('dry-run')) {
            return self::SUCCESS;
        }

        DB::transaction(function () use ($user, $counts): void {
            if ($counts['beneficiaries'] > 0) {
                Beneficiary::query()->whereNull('created_by')->update(['created_by' => $user->id]);
            }

            if ($counts['properties'] > 0) {
                Property::query()->whereNull('created_by')->update(['created_by' => $user->id]);
            }
        });

        $this->info('Registros legados atribuídos ao técnico '.$user->name.'.');

        return self::SUCCESS;
    }
}
