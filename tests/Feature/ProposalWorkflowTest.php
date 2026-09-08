<?php

namespace Tests\Feature;

use App\Enums\Municipality;
use App\Enums\OccupancyType;
use App\Enums\PropertyDocumentType;
use App\Enums\ProposalStatus;
use App\Enums\ProposalStep;
use App\Enums\UserRole;
use App\Livewire\Proposals\CashFlow;
use App\Livewire\Proposals\Create;
use App\Livewire\Proposals\Identification;
use App\Livewire\Proposals\Review;
use App\Models\Beneficiary;
use App\Models\Property;
use App\Models\Proposal;
use App\Models\User;
use App\Services\Proposals\ProposalWorkflow;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Livewire\Livewire;
use Tests\TestCase;

class ProposalWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private function user(UserRole $role): User
    {
        return User::factory()->create(['role' => $role, 'must_change_password' => false]);
    }

    private function property(Beneficiary $beneficiary): Property
    {
        return Property::query()->create([
            'beneficiary_id' => $beneficiary->id,
            'denomination' => 'Sítio Esperança',
            'address' => 'Vicinal 1',
            'municipality' => Municipality::BoaVista,
            'state' => 'RR',
            'total_area' => 80,
            'occupancy_type' => OccupancyType::Own,
            'exploration_years' => 5,
            'document_type' => PropertyDocumentType::DefinitiveTitle,
        ]);
    }

    private function initialData(Beneficiary $beneficiary, Property $property): array
    {
        return [
            'beneficiary_id' => (string) $beneficiary->id,
            'property_id' => (string) $property->id,
            'activity' => 'Pecuária',
            'purpose' => 'Ampliação da produção rural.',
            'iater_unit' => 'Cantá — Sede',
        ];
    }

    public function test_tecnico_cria_proposta_com_beneficiario_e_propriedade_vinculados(): void
    {
        $beneficiary = Beneficiary::factory()->create();
        $property = $this->property($beneficiary);

        Livewire::actingAs($this->user(UserRole::Technician))->test(Create::class)
            ->set('data', $this->initialData($beneficiary, $property))
            ->call('save', true)
            ->assertHasNoErrors();

        $proposal = Proposal::firstOrFail();
        $this->assertSame($beneficiary->id, $proposal->beneficiary_id);
        $this->assertSame($property->id, $proposal->property_id);
        $this->assertSame(ProposalStep::Patrimony, $proposal->current_step);
        $this->assertSame(ProposalStatus::Draft, $proposal->status);
        $this->assertMatchesRegularExpression('/^FDR-'.now()->year.'-\d{6}$/', $proposal->number);
    }

    public function test_abre_nova_proposta_sem_consultar_propriedades_antes_do_beneficiario(): void
    {
        $this->actingAs($this->user(UserRole::Technician))
            ->get(route('proposals.create'))
            ->assertOk();
    }

    public function test_rejeita_propriedade_de_outro_beneficiario(): void
    {
        $beneficiary = Beneficiary::factory()->create();
        $foreignProperty = $this->property(Beneficiary::factory()->create());

        Livewire::actingAs($this->user(UserRole::Technician))->test(Create::class)
            ->set('data', $this->initialData($beneficiary, $foreignProperty))
            ->call('save')
            ->assertHasErrors(['property_id']);

        $this->assertDatabaseCount('proposals', 0);
    }

    public function test_administrador_pode_criar_e_tramitar_qualquer_proposta(): void
    {
        $administrator = $this->user(UserRole::Administrator);
        $beneficiary = Beneficiary::factory()->create();
        $proposal = Proposal::query()->create([
            'number' => 'FDR-2026-000001', 'proposal_date' => today(), 'beneficiary_id' => $beneficiary->id,
            'property_id' => $this->property($beneficiary)->id, 'created_by' => $this->user(UserRole::Technician)->id,
            'activity' => 'Pecuária', 'purpose' => 'Ampliação', 'iater_unit' => 'Boa Vista',
            'status' => ProposalStatus::InReview, 'current_step' => ProposalStep::Review,
            'completed_steps' => array_column(ProposalStep::cases(), 'value'),
        ]);

        $this->assertTrue($administrator->can('update', $proposal));
        $this->assertTrue($administrator->can('process', $proposal));
    }

    public function test_nucleo_nao_edita_rascunho_mas_pode_devolver_proposta_em_revisao(): void
    {
        $beneficiary = Beneficiary::factory()->create();
        $proposal = Proposal::query()->create([
            'number' => 'FDR-2026-000002', 'proposal_date' => today(), 'beneficiary_id' => $beneficiary->id,
            'property_id' => $this->property($beneficiary)->id, 'created_by' => $this->user(UserRole::Technician)->id,
            'status' => ProposalStatus::InReview, 'current_step' => ProposalStep::Review,
        ]);
        $core = $this->user(UserRole::Core);

        $this->assertFalse($core->can('update', $proposal));
        $this->actingAs($core);
        app(ProposalWorkflow::class)->transition($proposal, 0, ProposalStatus::Returned, 'Falta comprovante.');

        $this->assertSame(ProposalStatus::Returned, $proposal->fresh()->status);
        $this->assertDatabaseHas('proposal_status_histories', ['proposal_id' => $proposal->id, 'to_status' => ProposalStatus::Returned->value]);
    }

    public function test_tramitacao_registra_ip_e_navegador_na_auditoria(): void
    {
        $core = $this->user(UserRole::Core);
        $beneficiary = Beneficiary::factory()->create();
        $proposal = Proposal::query()->create([
            'number' => 'FDR-2026-000007', 'proposal_date' => today(), 'beneficiary_id' => $beneficiary->id,
            'property_id' => $this->property($beneficiary)->id, 'created_by' => $this->user(UserRole::Technician)->id,
            'activity' => 'Horticultura', 'purpose' => 'Produção', 'iater_unit' => 'Boa Vista',
            'status' => ProposalStatus::InReview, 'current_step' => ProposalStep::Review,
        ]);

        $this->actingAs($core)->withHeader('User-Agent', 'Teste de auditoria')->withServerVariables(['REMOTE_ADDR' => '192.0.2.10']);
        app(ProposalWorkflow::class)->transition($proposal, 0, ProposalStatus::Returned, 'Corrigir documento.');

        $this->assertDatabaseHas('proposal_status_histories', [
            'proposal_id' => $proposal->id,
            'to_status' => ProposalStatus::Returned->value,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Symfony',
        ]);
    }

    public function test_tecnico_nao_acessa_proposta_de_outra_unidade_nem_seus_documentos(): void
    {
        $owner = $this->user(UserRole::Technician);
        $owner->forceFill(['iater_unit' => 'Unidade proprietária'])->save();
        $other = $this->user(UserRole::Technician);
        $other->forceFill(['iater_unit' => 'Outra unidade'])->save();
        $beneficiary = Beneficiary::factory()->create();
        $proposal = Proposal::query()->create([
            'number' => 'FDR-2026-000006', 'proposal_date' => today(), 'beneficiary_id' => $beneficiary->id,
            'property_id' => $this->property($beneficiary)->id, 'created_by' => $owner->id,
            'activity' => 'Horticultura', 'purpose' => 'Produção', 'iater_unit' => $owner->iater_unit,
            'status' => ProposalStatus::Draft, 'current_step' => ProposalStep::Initial,
        ]);

        $this->actingAs($other)
            ->get(route('proposals.edit', [$proposal, ProposalStep::Review->value]))
            ->assertForbidden();
        $this->get(route('proposals.print', [$proposal, 'cash-flow']))->assertForbidden();
        $this->get(route('proposals.index'))->assertDontSee($proposal->number);

        $this->expectException(AuthorizationException::class);
        app(ProposalWorkflow::class)->transition($proposal, 0, ProposalStatus::InReview, null);
    }

    public function test_documento_de_fluxo_de_caixa_e_renderizado_a_partir_da_proposta(): void
    {
        $technician = $this->user(UserRole::Technician);
        $beneficiary = Beneficiary::factory()->create();
        $proposal = Proposal::query()->create([
            'number' => 'FDR-2026-000003', 'proposal_date' => today(), 'beneficiary_id' => $beneficiary->id,
            'property_id' => $this->property($beneficiary)->id, 'created_by' => $technician->id,
            'status' => ProposalStatus::Draft, 'current_step' => ProposalStep::Initial,
        ]);

        $this->actingAs($technician)
            ->get(route('proposals.print', [$proposal, 'cash-flow']))
            ->assertOk()
            ->assertSee('Resumo do Fluxo de Caixa');

        Livewire::actingAs($technician)->test(Review::class, ['proposal' => $proposal])
            ->assertOk()
            ->assertSee('Dados iniciais e identificação');
    }

    public function test_fluxo_de_caixa_trata_anos_vazios_como_zero(): void
    {
        $data = [
            'items' => [
                'receita-1' => [
                    'type' => 'REVENUE', 'description' => 'Hortaliças', 'unit' => 'KG', 'quantity' => '1', 'unit_value' => '1800000',
                    'year_2' => '', 'year_3' => '0', 'year_4' => '0,00', 'year_5' => null, 'year_6' => null, 'year_7' => null,
                ],
                'custo-1' => [
                    'type' => 'FIXED_COST', 'description' => 'Energia', 'unit' => 'MÊS', 'quantity' => '1', 'unit_value' => '10000',
                    'year_2' => '', 'year_3' => '0', 'year_4' => '0,00', 'year_5' => null, 'year_6' => null, 'year_7' => null,
                ],
            ],
        ];

        $validated = app(ProposalWorkflow::class)->validate(ProposalStep::CashFlow, $data, true);

        $this->assertSame('0.00', $validated['items']['receita-1']['year_2']);
        $this->assertSame('0.00', $validated['items']['receita-1']['year_7']);
        $this->assertSame('0.00', $validated['items']['custo-1']['year_4']);
    }

    public function test_erros_de_itens_do_fluxo_de_caixa_nao_exibem_uuid(): void
    {
        $uuid = '8831ec80-1d6e-4681-801a-624ef1988614';

        try {
            app(ProposalWorkflow::class)->validate(ProposalStep::CashFlow, [
                'items' => [$uuid => ['type' => 'REVENUE', 'description' => 'Venda', 'unit' => '', 'quantity' => '1', 'unit_value' => '100']],
            ], true);
            $this->fail('A validação deveria falhar.');
        } catch (ValidationException $exception) {
            $message = implode(' ', $exception->errors()['items.'.$uuid.'.unit'] ?? []);
            $this->assertStringNotContainsString($uuid, $message);
            $this->assertStringContainsString('unidade', $message);
        }
    }

    public function test_empregos_zerados_sao_persistidos_e_reabertos(): void
    {
        $technician = $this->user(UserRole::Technician);
        $beneficiary = Beneficiary::factory()->create();
        $proposal = Proposal::query()->create([
            'number' => 'FDR-2026-000004', 'proposal_date' => today(), 'beneficiary_id' => $beneficiary->id,
            'property_id' => $this->property($beneficiary)->id, 'created_by' => $technician->id,
            'activity' => 'Horticultura', 'purpose' => 'Produção', 'iater_unit' => 'Boa Vista',
            'status' => ProposalStatus::Draft, 'current_step' => ProposalStep::Identification,
            'completed_steps' => [ProposalStep::Initial->value, ProposalStep::Patrimony->value, ProposalStep::Financing->value],
        ]);

        Livewire::actingAs($technician)->test(Identification::class, ['proposal' => $proposal])
            ->set('data.purpose', 'Produção de hortaliças.')
            ->set('data.market', 'Venda local.')
            ->set('data.location_analysis', 'Acesso adequado.')
            ->call('save', true)
            ->assertHasNoErrors();

        $this->assertDatabaseCount('proposal_jobs', 4);
        $this->assertDatabaseHas('proposal_jobs', ['proposal_id' => $proposal->id, 'category' => 'ADMINISTRATIVE', 'current' => 0, 'expansion' => 0]);
        $this->assertDatabaseHas('proposal_jobs', ['proposal_id' => $proposal->id, 'category' => 'TECHNICAL', 'current' => 0, 'expansion' => 0]);
    }

    public function test_anos_vazios_do_fluxo_sao_persistidos_como_zero(): void
    {
        $technician = $this->user(UserRole::Technician);
        $beneficiary = Beneficiary::factory()->create();
        $proposal = Proposal::query()->create([
            'number' => 'FDR-2026-000005', 'proposal_date' => today(), 'beneficiary_id' => $beneficiary->id,
            'property_id' => $this->property($beneficiary)->id, 'created_by' => $technician->id,
            'activity' => 'Horticultura', 'purpose' => 'Produção', 'iater_unit' => 'Boa Vista',
            'status' => ProposalStatus::Draft, 'current_step' => ProposalStep::CashFlow,
            'completed_steps' => [ProposalStep::Initial->value, ProposalStep::Patrimony->value, ProposalStep::Financing->value, ProposalStep::Identification->value],
        ]);

        Livewire::actingAs($technician)->test(CashFlow::class, ['proposal' => $proposal])
            ->set('items', [
                'revenue-1' => ['type' => 'REVENUE', 'description' => 'Hortaliças', 'unit' => 'KG', 'quantity' => '1', 'unit_value' => '1800000', 'year_2' => '', 'year_3' => null, 'year_4' => null, 'year_5' => null, 'year_6' => null, 'year_7' => null],
                'cost-1' => ['type' => 'FIXED_COST', 'description' => 'Energia', 'unit' => 'MÊS', 'quantity' => '1', 'unit_value' => '10000', 'year_2' => '', 'year_3' => null, 'year_4' => null, 'year_5' => null, 'year_6' => null, 'year_7' => null],
            ])
            ->call('save', true)
            ->assertHasNoErrors();

        $this->assertDatabaseHas('cash_flow_items', ['proposal_id' => $proposal->id, 'year_2' => '0.00', 'year_7' => '0.00']);
    }
}
