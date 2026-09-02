<?php

declare(strict_types=1);

namespace Funderr\Controller;

use Funderr\Application\CreditLine\CreditLineService;
use Funderr\Application\Exception\ValidationException;
use Funderr\Http\Flash;
use Funderr\Http\Request;
use Funderr\Http\Response;
use Funderr\Http\View;

final class CreditLineController
{
    public function __construct(
        private readonly CreditLineService $creditLines,
        private readonly string $templatesPath,
    ) {
    }

    public function index(Request $request): Response
    {
        $lines = $this->creditLines->list();
        $editId = filter_var($request->query('edit'), FILTER_VALIDATE_INT);
        $editing = null;
        foreach ($lines as $line) {
            if ((int) $line['id'] === $editId) $editing = $line;
        }

        return View::render($this->templatesPath . '/credit-lines/index.php', [
            'creditLines' => $lines,
            'editing' => $editing,
        ]);
    }

    public function save(Request $request): Response
    {
        try {
            $this->creditLines->save($request->postData());
            Flash::success('Linha de crédito salva.');
        } catch (ValidationException $exception) {
            Flash::error($exception->getMessage());
        }

        return Response::redirect('/credit-lines');
    }
}
