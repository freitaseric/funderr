<?php

declare(strict_types=1);

namespace Funderr\Controller;

use Funderr\Application\Beneficiary\BeneficiaryService;
use Funderr\Application\Exception\ValidationException;
use Funderr\Http\Request;
use Funderr\Http\Response;
use Funderr\Http\View;

final class BeneficiaryController
{
    public function __construct(
        private readonly BeneficiaryService $beneficiaryService,
        private readonly string $templatesPath,
    ) {
    }

    public function index(
        Request $request,
    ): Response {
        $editId = filter_var($request->query('edit'), FILTER_VALIDATE_INT);
        $values = [];

        if ($editId) {
            $editing = $this->beneficiaryService->find($editId);
            if ($editing !== null) {
                $values = get_object_vars($editing);
                foreach ($this->beneficiaryService->references($editId) as $index => $reference) {
                    $number = $index + 1;
                    $values["reference_{$number}_name"] = $reference['nome'];
                    $values["reference_{$number}_phone"] = $reference['telefone'];
                }
            }
        }

        return $this->renderIndex(values: $values);
    }

    public function show(Request $request): Response
    {
        $id = filter_var($request->route('id'), FILTER_VALIDATE_INT);

        if ($id === false || $id < 1) {
            return Response::text('404 - Beneficiário não encontrado', 404);
        }

        $beneficiary = $this->beneficiaryService->find($id);

        if ($beneficiary === null) {
            return Response::text('404 - Beneficiário não encontrado', 404);
        }

        return View::render(
            $this->templatesPath . '/beneficiaries/show.php',
            [
                'beneficiary' => $beneficiary,
                'references' => $this->beneficiaryService->references($id),
            ],
        );
    }

    public function store(Request $request): Response
    {
        try {
            $beneficiary = $this->beneficiaryService->save($request->postData());
        } catch (ValidationException $exception) {
            return $this->renderIndex(
                error: $exception->getMessage(),
                values: $request->postData(),
                status: 422,
            );
        }

        return Response::redirect('/beneficiaries/' . $beneficiary->id);
    }

    private function renderIndex(
        ?string $error = null,
        array $values = [],
        int $status = 200,
    ): Response {
        return View::render(
            $this->templatesPath . '/beneficiaries/index.php',
            [
                'beneficiaries' => $this->beneficiaryService->listDetailed(),
                'error' => $error,
                'values' => $values,
            ],
            $status,
        );
    }
}
