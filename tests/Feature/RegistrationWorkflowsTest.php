<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Livewire\Beneficiaries\Form as BeneficiaryForm;
use App\Livewire\Properties\Form as PropertyForm;
use App\Models\Beneficiary;
use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Livewire\Features\SupportLockedProperties\CannotUpdateLockedPropertyException;
use Livewire\Livewire;
use PHPUnit\Framework\Attributes\TestWith;
use Tests\TestCase;

class RegistrationWorkflowsTest extends TestCase
{
    use RefreshDatabase;

    private function technician(): User
    {
        return User::factory()->create(['role' => UserRole::Technician, 'must_change_password' => false]);
    }

    private function beneficiaryData(): array
    {
        return [
            'name' => 'Beneficiário de teste', 'cpf' => fake('pt_BR')->cpf(),
            'phone' => '(95) 99123-4567', 'birthDate' => '1990-01-01',
            'placeOfBirth' => 'Boa Vista', 'maritalStatus' => 'SOLTEIRO',
            'educationLevel' => 'MEDIO_COMPLETO', 'dependents' => 0, 'address' => 'Endereço de teste',
            'references' => [
                ['name' => 'Referência A', 'phone' => '(95) 3222-1234'],
                ['name' => 'Referência B', 'phone' => '(95) 99123-4567'],
            ],
        ];
    }

    private function propertyData(?User $owner = null): array
    {
        return [
            'beneficiaryId' => (string) Beneficiary::factory()->create(['created_by' => $owner?->id])->id,
            'denomination' => 'Sítio de teste', 'address' => 'Endereço de teste',
            'municipality' => 'Boa Vista', 'totalArea' => '160,0000',
            'occupancyType' => 'PROPRIA', 'explorationYears' => 5,
            'documentType' => 'TITULO_DEFINITIVO', 'latitude' => '0', 'longitude' => '-60,1234567',
        ];
    }

    #[TestWith(['tecnico', true])]
    #[TestWith(['nucleo', false])]
    #[TestWith(['administrador', true])]
    public function test_permissoes_dos_cadastros_por_perfil(string $role, bool $allowed): void
    {
        $user = User::factory()->create(['role' => $role, 'must_change_password' => false]);
        $this->assertSame($allowed, Gate::forUser($user)->allows('manage-registrations'));
        $this->actingAs($user)->get(route('beneficiaries.create'))->assertStatus($allowed ? 200 : 403);
        $this->get(route('properties.create'))->assertStatus($allowed ? 200 : 403);
        $this->get(route('beneficiaries.index'))->assertOk();
        $this->get(route('properties.index'))->assertOk();
    }

    public function test_visitante_nao_acessa_cadastros(): void
    {
        $this->get(route('beneficiaries.create'))->assertRedirect(route('login'));
        $this->get(route('properties.create'))->assertRedirect(route('login'));
    }

    public function test_bloqueia_gravacao_apos_perda_de_permissao(): void
    {
        $user = $this->technician();
        $component = Livewire::actingAs($user)->test(BeneficiaryForm::class);
        $user->forceFill(['role' => UserRole::Core])->save();
        $component->call('save')->assertForbidden();
        $this->assertDatabaseCount('beneficiaries', 0);
    }

    public function test_bloqueia_propriedade_apos_desativacao(): void
    {
        $user = $this->technician();
        $component = Livewire::actingAs($user)->test(PropertyForm::class);
        $user->forceFill(['disabled_at' => now()])->save();
        $component->call('save')->assertForbidden();
    }

    public function test_tecnico_nao_acessa_beneficiario_ou_propriedade_de_outro_tecnico(): void
    {
        $owner = $this->technician();
        $other = $this->technician();
        $beneficiary = Beneficiary::factory()->create(['created_by' => $owner->id]);
        $property = Property::query()->create([
            'created_by' => $owner->id,
            'beneficiary_id' => $beneficiary->id,
            'denomination' => 'Sítio protegido',
            'address' => 'Vicinal protegida',
            'municipality' => 'Boa Vista',
            'state' => 'RR',
            'total_area' => 80,
            'occupancy_type' => 'PROPRIA',
            'exploration_years' => 5,
            'document_type' => 'TITULO_DEFINITIVO',
        ]);

        $this->actingAs($other)
            ->get(route('beneficiaries.show', $beneficiary))
            ->assertForbidden();
        $this->get(route('beneficiaries.edit', $beneficiary))->assertForbidden();
        $this->get(route('properties.show', $property))->assertForbidden();
        $this->get(route('properties.edit', $property))->assertForbidden();
    }

    public function test_nao_permite_trocar_identificador_do_beneficiario(): void
    {
        $owner = $this->technician();
        $beneficiary = Beneficiary::factory()->create(['created_by' => $owner->id]);
        $component = Livewire::actingAs($owner)->test(BeneficiaryForm::class, ['beneficiary' => $beneficiary]);
        $this->expectException(CannotUpdateLockedPropertyException::class);
        $component->set('beneficiaryId', $beneficiary->id + 1);
    }

    public function test_cadastra_e_edita_beneficiario_com_referencias_e_mascaras(): void
    {
        $data = $this->beneficiaryData();
        Livewire::actingAs($this->technician())->test(BeneficiaryForm::class)->set($data)->call('save')->assertHasNoErrors();
        $beneficiary = Beneficiary::firstOrFail();
        $this->assertSame(preg_replace('/\D/', '', $data['cpf']), $beneficiary->cpf);
        $this->assertSame('95991234567', $beneficiary->phone);
        $this->assertSame(['9532221234', '95991234567'], $beneficiary->references->pluck('phone')->all());
        Livewire::test(BeneficiaryForm::class, ['beneficiary' => $beneficiary])->set('name', 'Nome atualizado')->call('save')->assertHasNoErrors();
        $this->assertSame('Nome atualizado', $beneficiary->fresh()->name);
        $this->assertDatabaseCount('beneficiary_references', 2);
    }

    #[TestWith(['cpf', '11111111111'])]
    #[TestWith(['cpf', '12345678901'])]
    #[TestWith(['birthDate', '2999-01-01'])]
    #[TestWith(['dependents', 32768])]
    #[TestWith(['references.0.phone', '123'])]
    public function test_rejeita_dados_invalidos_sem_gravacao(string $field, mixed $value): void
    {
        Livewire::actingAs($this->technician())->test(BeneficiaryForm::class)->set($this->beneficiaryData())
            ->set($field, $value)->call('save')->assertHasErrors([$field]);
        $this->assertDatabaseCount('beneficiaries', 0);
        $this->assertDatabaseCount('beneficiary_references', 0);
    }

    public function test_exige_conjuge_e_rejeita_cpf_duplicado(): void
    {
        $existing = Beneficiary::factory()->create();
        Livewire::actingAs($this->technician())->test(BeneficiaryForm::class)->set($this->beneficiaryData())
            ->set('cpf', $existing->cpf)->set('maritalStatus', 'CASADO')->call('save')
            ->assertHasErrors(['cpf', 'spouseName', 'spouseCpf']);
    }

    public function test_salva_coordenadas_e_calcula_area_sem_divergencia(): void
    {
        $owner = $this->technician();
        $data = $this->propertyData($owner);
        $component = Livewire::actingAs($owner)->test(PropertyForm::class)->set($data);
        $component->assertSet('availableArea', 80.0)->assertSet('fiscalModules', 2.0)->call('save')->assertHasNoErrors();
        $property = Property::firstOrFail();
        $this->assertSame('0.0000000', $property->latitude);
        $this->assertSame('-60.1234567', $property->longitude);
        $this->assertSame(80.0, $property->availableArea());
        $this->assertSame(2.0, $property->fiscalModules());
        $this->get(route('properties.show', $property))->assertOk()->assertSee('0,0000000');
        Livewire::actingAs($owner)->test(PropertyForm::class, ['property' => $property])->set('totalArea', '200')->call('save')->assertHasNoErrors();
        $this->assertSame(100.0, $property->fresh()->availableArea());
    }

    #[TestWith(['PROPRIA', 'TITULO_DEFINITIVO', true])]
    #[TestWith(['ARRENDADA', 'CONTRATO_ARRENDAMENTO', true])]
    #[TestWith(['POSSE', 'CONTRATO_COMPRA_VENDA', true])]
    #[TestWith(['COMODATO', 'CONTRATO_COMODATO', true])]
    #[TestWith(['CONCESSAO', 'CCU', true])]
    #[TestWith(['ASSENTAMENTO', 'SIPRA', true])]
    #[TestWith(['PROPRIA', 'CONTRATO_ARRENDAMENTO', false])]
    #[TestWith(['ASSENTAMENTO', 'ESCRITURA_PUBLICA', false])]
    public function test_exige_documento_compativel_com_a_forma_de_ocupacao(string $occupancyType, string $documentType, bool $valid): void
    {
        $owner = $this->technician();
        $component = Livewire::actingAs($owner)->test(PropertyForm::class)
            ->set($this->propertyData($owner))
            ->set('occupancyType', $occupancyType)
            ->set('documentType', $documentType)
            ->call('save');

        if ($valid) {
            $component->assertHasNoErrors();
            $this->assertDatabaseHas('properties', ['occupancy_type' => $occupancyType, 'document_type' => $documentType]);

            return;
        }

        $component->assertHasErrors(['documentType']);
        $this->assertDatabaseCount('properties', 0);
    }

    #[TestWith(['totalArea', '100000000'])]
    #[TestWith(['totalArea', '0'])]
    #[TestWith(['totalArea', '1.12345'])]
    #[TestWith(['explorationYears', 32768])]
    #[TestWith(['latitude', '91'])]
    #[TestWith(['longitude', '-181'])]
    #[TestWith(['longitude', ''])]
    public function test_rejeita_propriedade_fora_dos_limites(string $field, mixed $value): void
    {
        $owner = $this->technician();
        Livewire::actingAs($owner)->test(PropertyForm::class)->set($this->propertyData($owner))
            ->set($field, $value)->call('save')->assertHasErrors([$field]);
        $this->assertDatabaseCount('properties', 0);
    }

    public function test_busca_beneficiario_limita_resultados_e_preserva_selecao(): void
    {
        $owner = $this->technician();
        Beneficiary::factory()->count(25)->create(['created_by' => $owner->id]);
        $selected = Beneficiary::factory()->create(['created_by' => $owner->id, 'name' => 'Selecionado de teste']);
        Livewire::actingAs($owner)->test(PropertyForm::class)
            ->assertViewHas('beneficiaries', fn ($items) => $items->count() === 20)
            ->set('beneficiaryId', (string) $selected->id)
            ->set('beneficiarySearch', 'inexistente')
            ->assertViewHas('beneficiaries', fn ($items) => $items->count() === 1 && $items->first()->is($selected))
            ->set('beneficiarySearch', $selected->formattedCpf())
            ->assertViewHas('beneficiaries', fn ($items) => $items->count() === 1);
    }

    public function test_busca_beneficiario_prioriza_correspondencia_exata_no_nome(): void
    {
        $owner = $this->technician();
        Beneficiary::factory()->create(['created_by' => $owner->id, 'name' => 'Ana do Norte']);
        $exact = Beneficiary::factory()->create(['created_by' => $owner->id, 'name' => 'Ana']);
        Beneficiary::factory()->create(['created_by' => $owner->id, 'name' => 'Maria Ana']);

        Livewire::actingAs($owner)->test(PropertyForm::class)
            ->set('beneficiarySearch', 'Ana')
            ->assertViewHas('beneficiaries', fn ($items) => $items->first()->is($exact));
    }
}
