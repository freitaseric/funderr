<?php

declare(strict_types=1);

namespace Funderr\Controller;

use Funderr\Application\System\SystemService;
use Funderr\Http\Request;
use Funderr\Http\Response;
use Funderr\Http\View;

final class DashboardController
{
    public function __construct(
        private readonly SystemService $system,
        private readonly string $templatesPath,
    ) {
    }

    public function index(Request $request): Response
    {
        return View::render($this->templatesPath . '/dashboard.php', [
            'dashboard' => $this->system->dashboard(),
        ]);
    }
}
