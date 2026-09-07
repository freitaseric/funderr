<?php

declare(strict_types=1);

namespace Funderr\Http;

use RuntimeException;
use Throwable;

final class View
{
    public static function render(
        string $templatePath,
        array $data = [],
        int $status = 200,
    ): Response {
        if (!is_file($templatePath)) {
            throw new RuntimeException("Template não encontrado: {$templatePath}");
        }

        ob_start();

        try {
            (static function (string $__templatePath, array $__data): void {
                extract($__data, EXTR_SKIP);
                require $__templatePath;
            })($templatePath, $data);
            $content = ob_get_clean();
        } catch (Throwable $throwable) {
            ob_end_clean();

            throw $throwable;
        }

        if ($content === false) {
            throw new RuntimeException('Não foi possível renderizar o template.');
        }

        return Response::html($content, $status);
    }

    public static function escape(mixed $value): string
    {
        return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
    }
}
