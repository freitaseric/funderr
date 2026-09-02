<?php

declare(strict_types=1);

namespace Funderr\Controller;

use Funderr\Application\Audit\AuditService;
use Funderr\Application\System\SystemService;
use Funderr\Http\Flash;
use Funderr\Http\Request;
use Funderr\Http\Response;
use Funderr\Http\View;

final class SystemController
{
    public function __construct(
        private readonly SystemService $system,
        private readonly AuditService $audit,
        private readonly string $templatesPath,
    ) {
    }

    public function audit(Request $request): Response
    {
        $filters = [
            'entidade' => (string) $request->query('entidade', ''),
            'acao' => (string) $request->query('acao', ''),
            'dispositivo' => (string) $request->query('dispositivo', ''),
        ];

        return View::render($this->templatesPath . '/audit.php', [
            'logs' => $this->audit->list($filters),
            'filters' => $filters,
        ]);
    }

    public function config(Request $request): Response
    {
        return View::render($this->templatesPath . '/config.php', [
            'preferences' => $this->system->preferences(),
        ]);
    }

    public function updateConfig(Request $request): Response
    {
        $this->system->updatePreferences($request->postData());
        Flash::success('Preferências deste dispositivo atualizadas.');

        return Response::redirect('/config');
    }

    public function presence(Request $request): Response
    {
        return Response::json([
            'devices' => $this->system->heartbeat((string) $request->post('path', '/')),
        ]);
    }

    public function health(Request $request): Response
    {
        return Response::json([
            'status' => 'ok',
            'app' => 'FUNDERR',
            'version' => 'php',
            'timestamp' => date(DATE_ATOM),
        ]);
    }

    public function geocode(Request $request): Response
    {
        $query = mb_strtolower((string) $request->query('address', ''));
        $coordinates = [
            'boa vista' => [2.8235, -60.6758], 'cantá' => [2.6111, -60.6019],
            'mucajaí' => [2.4303, -60.9103], 'alto alegre' => [2.9886, -61.2953],
            'bonfim' => [3.3619, -59.8336], 'rorainópolis' => [0.9442, -60.4208],
            'pacaraima' => [4.4789, -61.1467], 'caracaraí' => [1.8153, -61.1278],
            'amajari' => [3.6558, -61.4228], 'normandia' => [3.8828, -59.6278],
            'iracema' => [2.1814, -61.0422], 'caroebe' => [0.8833, -59.6958],
            'são joão da baliza' => [0.9508, -59.9111], 'são luiz' => [0.9856, -60.0983],
            'uiramutã' => [4.5958, -60.1658],
        ];
        [$latitude, $longitude] = $coordinates['boa vista'];
        foreach ($coordinates as $municipality => $location) {
            if (str_contains($query, $municipality)) {
                [$latitude, $longitude] = $location;
                break;
            }
        }

        return Response::json(['results' => [[
            'geometry' => ['location' => ['lat' => $latitude, 'lng' => $longitude]],
            'formatted_address' => ((string) $request->query('address', 'Roraima')) . ', RR, Brasil',
        ]]]);
    }
}
