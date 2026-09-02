<?php

declare(strict_types=1);

namespace Funderr\Controller;

use Funderr\Application\Beneficiary\BeneficiaryService;
use Funderr\Application\CreditLine\CreditLineService;
use Funderr\Application\Document\DocumentService;
use Funderr\Application\Exception\ValidationException;
use Funderr\Application\Property\PropertyService;
use Funderr\Application\Proposal\ProposalService;
use Funderr\Application\Support\Input;
use Funderr\Http\Flash;
use Funderr\Http\Request;
use Funderr\Http\Response;
use Funderr\Http\View;

final class ProposalController
{
    public function __construct(
        private readonly ProposalService $proposals,
        private readonly BeneficiaryService $beneficiaries,
        private readonly PropertyService $properties,
        private readonly CreditLineService $creditLines,
        private readonly DocumentService $documents,
        private readonly string $templatesPath,
    ) {
    }

    public function index(Request $request): Response
    {
        return View::render($this->templatesPath . '/proposals/index.php', [
            'proposals' => $this->proposals->list(),
            'beneficiaries' => $this->beneficiaries->list(),
            'properties' => $this->properties->list(),
        ]);
    }

    public function create(Request $request): Response
    {
        try {
            $id = $this->proposals->create($request->postData());
            Flash::success('Processo criado.');

            return Response::redirect('/proposals/' . $id);
        } catch (ValidationException $exception) {
            Flash::error($exception->getMessage());

            return Response::redirect('/proposals');
        }
    }

    public function show(Request $request): Response
    {
        $id = $this->routeId($request);
        $proposal = $this->proposals->find($id);
        if ($proposal === null) return Response::text('404 - Processo não encontrado', 404);

        return View::render($this->templatesPath . '/proposals/show.php', [
            'proposal' => $proposal,
            'creditLines' => $this->creditLines->list(true),
            'beneficiaries' => $this->beneficiaries->list(),
            'properties' => $this->properties->list(),
        ]);
    }

    public function action(Request $request): Response
    {
        $id = $this->routeId($request);
        $action = (string) $request->route('action');
        $data = $request->postData();

        try {
            match ($action) {
                'save-general' => $this->proposals->updateGeneral($id, $data),
                'status' => $this->proposals->changeStatus($id, $data),
                'add-patrimony-item' => $this->proposals->addPatrimonyItem($id, $data),
                'add-debt' => $this->proposals->addDebt($id, $data),
                'confirm-debts' => $this->proposals->confirmPatrimonyDebts($id, Input::bool($data, 'confirmed')),
                'complete-patrimony' => $this->proposals->completePatrimony($id),
                'save-identification' => $this->proposals->saveIdentification($id, $data),
                'add-use-source' => $this->proposals->addUseSource($id, $data),
                'complete-identification' => $this->proposals->completeIdentification($id),
                'add-cash-flow-item' => $this->proposals->addCashFlowItem($id, $data),
                'confirm-cash-flow' => $this->proposals->confirmCashFlow($id, Input::bool($data, 'confirmed')),
                'complete-cash-flow' => $this->proposals->completeCashFlow($id),
                'save-financing' => $this->proposals->saveFinancing($id, $data),
                'add-guarantee' => $this->proposals->addGuarantee($id, $data),
                'confirm-guarantees' => $this->proposals->confirmFinancing($id, 'garantias_confirmadas', Input::bool($data, 'confirmed')),
                'confirm-schedule' => $this->proposals->confirmFinancing($id, 'cronograma_confirmado', Input::bool($data, 'confirmed')),
                'complete-financing' => $this->proposals->completeFinancing($id),
                'upload-document' => $this->documents->upload($id, Input::string($data, 'tipo'), $request->file('document')),
                default => throw new ValidationException(['action' => 'Ação desconhecida.']),
            };
            Flash::success('Alteração salva.');
        } catch (ValidationException $exception) {
            Flash::error($exception->getMessage());
        }

        return Response::redirect('/proposals/' . $id);
    }

    public function remove(Request $request): Response
    {
        $id = $this->routeId($request);
        try {
            $this->proposals->removeChild(
                $id,
                (string) $request->route('kind'),
                Input::int($request->postData(), 'child_id'),
            );
            Flash::success('Item removido.');
        } catch (ValidationException $exception) {
            Flash::error($exception->getMessage());
        }

        return Response::redirect('/proposals/' . $id);
    }

    public function confirmDocument(Request $request): Response
    {
        $id = $this->routeId($request);
        try {
            $this->documents->confirm(
                $id,
                (int) $request->route('documentId'),
                Input::string($request->postData(), 'verified_data'),
            );
            Flash::success('Documento confirmado.');
        } catch (ValidationException $exception) {
            Flash::error($exception->getMessage());
        }

        return Response::redirect('/proposals/' . $id);
    }

    public function deleteDocument(Request $request): Response
    {
        $id = $this->routeId($request);
        try {
            $this->documents->delete($id, (int) $request->route('documentId'));
            Flash::success('Documento excluído.');
        } catch (ValidationException $exception) {
            Flash::error($exception->getMessage());
        }

        return Response::redirect('/proposals/' . $id);
    }

    private function routeId(Request $request): int
    {
        $id = filter_var($request->route('id'), FILTER_VALIDATE_INT);

        return $id === false ? 0 : $id;
    }
}
