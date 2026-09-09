<?php

namespace Tests\Feature;

use App\Enums\Municipality;
use App\Enums\OccupancyType;
use App\Enums\PropertyDocumentType;
use App\Enums\ProposalDocumentStatus;
use App\Enums\ProposalDocumentType;
use App\Enums\ProposalStatus;
use App\Enums\ProposalStep;
use App\Enums\UserRole;
use App\Jobs\GenerateAterContract;
use App\Jobs\GenerateProposalDossier;
use App\Models\Beneficiary;
use App\Models\Property;
use App\Models\Proposal;
use App\Models\User;
use App\Services\Proposals\PdfDocument;
use App\Services\Proposals\ProposalDossierPdf;
use App\Services\Proposals\ProposalWorkflow;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class ProposalDocumentsWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_contract_and_dossier_jobs_create_private_real_pdfs_and_finish_review(): void
    {
        Storage::fake('local');
        $core = User::factory()->create(['role' => UserRole::Core, 'must_change_password' => false]);
        $beneficiary = Beneficiary::factory()->create();
        $property = Property::query()->create([
            'beneficiary_id' => $beneficiary->id, 'denomination' => 'Sítio Esperança', 'address' => 'Vicinal 1',
            'municipality' => Municipality::BoaVista, 'state' => 'RR', 'total_area' => 80,
            'occupancy_type' => OccupancyType::Own, 'exploration_years' => 5, 'document_type' => PropertyDocumentType::DefinitiveTitle,
        ]);
        $proposal = Proposal::query()->create([
            'number' => 'FDR-2026-000101', 'proposal_date' => today(), 'beneficiary_id' => $beneficiary->id,
            'property_id' => $property->id, 'created_by' => $core->id, 'activity' => 'Pecuária', 'purpose' => 'Produção',
            'iater_unit' => 'Boa Vista', 'status' => ProposalStatus::InReview, 'current_step' => ProposalStep::Review, 'revision' => 4,
        ]);
        $contract = $proposal->documents()->create([
            'type' => ProposalDocumentType::AterContract, 'status' => ProposalDocumentStatus::Pending, 'disk' => 'local',
            'path' => 'proposals/1/contract.pdf', 'source_revision' => 4, 'created_by' => $core->id,
        ]);

        (new GenerateAterContract($proposal->id, 4, $contract->id))->handle(app(PdfDocument::class));

        $contract->refresh();
        $this->assertSame(ProposalDocumentStatus::Ready, $contract->status);
        Storage::disk('local')->assertExists($contract->path);
        $this->assertStringStartsWith('%PDF-', Storage::disk('local')->get($contract->path));

        $dossier = $proposal->documents()->create([
            'type' => ProposalDocumentType::Dossier, 'status' => ProposalDocumentStatus::Pending, 'disk' => 'local',
            'path' => 'proposals/1/dossier.pdf', 'source_revision' => 4, 'created_by' => $core->id,
        ]);
        (new GenerateProposalDossier($proposal->id, 4, $dossier->id))->handle(app(ProposalDossierPdf::class));

        $this->assertSame(ProposalStatus::ReadyForSend, $proposal->fresh()->status);
        $this->assertSame(ProposalDocumentStatus::Ready, $dossier->fresh()->status);
        Storage::disk('local')->assertExists($dossier->path);
    }

    public function test_invalid_status_transition_and_download_authorization_are_rejected(): void
    {
        $technician = User::factory()->create(['role' => UserRole::Technician, 'must_change_password' => false]);
        $core = User::factory()->create(['role' => UserRole::Core, 'must_change_password' => false]);
        $beneficiary = Beneficiary::factory()->create();
        $property = Property::query()->create([
            'beneficiary_id' => $beneficiary->id, 'denomination' => 'Sítio Teste', 'address' => 'Vicinal 2',
            'municipality' => Municipality::BoaVista, 'state' => 'RR', 'total_area' => 10,
            'occupancy_type' => OccupancyType::Own, 'exploration_years' => 2, 'document_type' => PropertyDocumentType::DefinitiveTitle,
        ]);
        $proposal = Proposal::query()->create([
            'number' => 'FDR-2026-000102', 'proposal_date' => today(), 'beneficiary_id' => $beneficiary->id,
            'property_id' => $property->id, 'created_by' => $technician->id, 'status' => ProposalStatus::Released,
            'current_step' => ProposalStep::Review,
        ]);

        $this->expectException(ValidationException::class);
        $this->actingAs($core);
        app(ProposalWorkflow::class)->transition($proposal, 0, ProposalStatus::Sent, null);
    }
}
