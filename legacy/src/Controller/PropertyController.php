<?php

declare(strict_types=1);

namespace Funderr\Controller;

use Funderr\Application\Beneficiary\BeneficiaryService;
use Funderr\Application\Exception\ValidationException;
use Funderr\Application\Property\PropertyService;
use Funderr\Http\Flash;
use Funderr\Http\Request;
use Funderr\Http\Response;
use Funderr\Http\View;

final class PropertyController
{
    public function __construct(
        private readonly PropertyService $properties,
        private readonly BeneficiaryService $beneficiaries,
        private readonly string $templatesPath,
    ) {
    }

    public function index(Request $request): Response
    {
        $editId = filter_var($request->query('edit'), FILTER_VALIDATE_INT);

        return View::render($this->templatesPath . '/properties/index.php', [
            'properties' => $this->properties->list(),
            'beneficiaries' => $this->beneficiaries->list(),
            'municipalities' => $this->properties->municipalities(),
            'editing' => $editId ? $this->properties->find($editId) : null,
        ]);
    }

    public function save(Request $request): Response
    {
        try {
            $id = $this->properties->save($request->postData());
            Flash::success('Propriedade salva com sucesso.');

            return Response::redirect('/properties?edit=' . $id);
        } catch (ValidationException $exception) {
            Flash::error($exception->getMessage());

            return Response::redirect('/properties');
        }
    }
}
