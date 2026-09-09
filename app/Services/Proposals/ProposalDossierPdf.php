<?php

namespace App\Services\Proposals;

use App\Enums\ProposalDocumentType;
use App\Models\Proposal;
use App\Models\ProposalDocument;
use Illuminate\Support\Facades\Storage;
use setasign\Fpdi\Fpdi;

class ProposalDossierPdf
{
    public function build(Proposal $proposal): string
    {
        $pdf = new Fpdi('P', 'mm', 'A4');
        $pdf->SetAutoPageBreak(true, 15);
        $pdf->AddPage();
        $pdf->SetFont('Arial', 'B', 16);
        $pdf->Cell(0, 10, $this->latin1('DOSSIER DA PROPOSTA '.$proposal->number), 0, 1);
        $pdf->SetFont('Arial', '', 11);
        $lines = [
            'Revisão: '.$proposal->revision,
            'Beneficiário: '.$proposal->beneficiary?->name,
            'CPF: '.$proposal->beneficiary?->cpf,
            'Propriedade: '.$proposal->property?->denomination,
            'Município: '.$proposal->property?->municipality?->value.' / '.$proposal->property?->state,
            'Atividade: '.$proposal->activity,
            'Finalidade: '.$proposal->purpose,
            'Valor da proposta: R$ '.number_format((float) ($proposal->financing?->proposal_value ?? 0), 2, ',', '.'),
            '',
            'Documentos incorporados abaixo:',
        ];
        foreach ($lines as $line) {
            $pdf->MultiCell(0, 7, $this->latin1((string) $line));
        }

        foreach ($proposal->documents->where('status', 'READY')->where('type', '!=', ProposalDocumentType::Dossier) as $document) {
            $this->append($pdf, $document);
        }

        return $pdf->Output('S');
    }

    private function append(Fpdi $pdf, ProposalDocument $document): void
    {
        $disk = Storage::disk($document->disk);
        if (! $disk->exists($document->path)) {
            return;
        }
        $path = $disk->path($document->path);
        if ($document->mime_type === 'application/pdf') {
            $pages = $pdf->setSourceFile($path);
            for ($page = 1; $page <= $pages; $page++) {
                $pdf->AddPage();
                $pdf->useTemplate($pdf->importPage($page), 0, 0, 210, 297);
            }

            return;
        }
        $pdf->AddPage();
        $pdf->Image($path, 10, 10, 190, 0, strtoupper(pathinfo($path, PATHINFO_EXTENSION)) === 'PNG' ? 'PNG' : 'JPG');
    }

    private function latin1(string $value): string
    {
        return iconv('UTF-8', 'windows-1252//TRANSLIT//IGNORE', $value) ?: $value;
    }
}
