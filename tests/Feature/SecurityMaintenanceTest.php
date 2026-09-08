<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Beneficiary;
use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SecurityMaintenanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_mascara_dados_pessoais_sem_alterar_o_valor_original(): void
    {
        $beneficiary = Beneficiary::factory()->create([
            'cpf' => '12345678909',
            'phone' => '95991234567',
            'spouse_cpf' => '98765432100',
        ]);

        $this->assertSame('123.456.789-09', $beneficiary->formattedCpf());
        $this->assertSame('***.***.789-09', $beneficiary->maskedCpf());
        $this->assertSame('(**) *****-4567', $beneficiary->maskedPhone($beneficiary->phone));
        $this->assertSame('***.***.321-00', $beneficiary->maskedSpouseCpf());
        $this->assertSame('12345678909', $beneficiary->fresh()->cpf);
    }

    public function test_comando_atribui_apenas_registros_legados(): void
    {
        $technician = User::factory()->create(['role' => UserRole::Technician, 'must_change_password' => false]);
        $legacyBeneficiary = Beneficiary::factory()->create(['created_by' => null]);
        $ownedBeneficiary = Beneficiary::factory()->create(['created_by' => $technician->id]);
        $legacyProperty = Property::query()->create([
            'created_by' => null, 'beneficiary_id' => $legacyBeneficiary->id, 'denomination' => 'Legada',
            'address' => 'Vicinal', 'municipality' => 'Boa Vista', 'state' => 'RR', 'total_area' => 80,
            'occupancy_type' => 'PROPRIA', 'exploration_years' => 5, 'document_type' => 'TITULO_DEFINITIVO',
        ]);

        $this->artisan('funderr:assign-legacy-owner', ['user' => $technician->id])->assertExitCode(0);

        $this->assertSame($technician->id, $legacyBeneficiary->fresh()->created_by);
        $this->assertSame($technician->id, $legacyProperty->fresh()->created_by);
        $this->assertSame($technician->id, $ownedBeneficiary->fresh()->created_by);
    }
}
