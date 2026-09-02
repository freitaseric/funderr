<?php

declare(strict_types=1);

namespace Funderr\Http;

use InvalidArgumentException;
use RuntimeException;

final class Router
{
    /** @var array<string, list<array{path: string, pattern: string, parameters: list<string>, handler: callable}>> */
    private array $routes = [];

    public function get(
        string $path,
        callable $handler,
    ): void {
        $this->add('GET', $path, $handler);
    }

    public function post(
        string $path,
        callable $handler,
    ): void {
        $this->add('POST', $path, $handler);
    }

    public function dispatch(
        Request $request,
    ): Response {
        $path = $this->normalizePath($request->path());
        $route = $this->match($request->method(), $path);

        if ($route === null) {
            $allowedMethods = $this->allowedMethods($path);

            if ($allowedMethods !== []) {
                return new Response(
                    body: '405 - Método não permitido',
                    status: 405,
                    headers: [
                        'Content-Type' => 'text/plain; charset=UTF-8',
                        'Allow' => implode(', ', $allowedMethods),
                    ],
                );
            }

            return Response::text(
                '404 - Página não encontrada',
                404,
            );
        }

        $response = ($route['handler'])(
            $request->withRouteParameters($route['parameters'])
        );

        if (!$response instanceof Response) {
            throw new RuntimeException(
                'O handler da rota precisa retornar uma Response.'
            );
        }

        return $response;
    }

    private function add(string $method, string $path, callable $handler): void
    {
        $path = $this->normalizePath($path);
        [$pattern, $parameters] = $this->compilePath($path);
        $this->routes[$method] ??= [];

        foreach ($this->routes[$method] as $route) {
            if ($route['path'] === $path) {
                throw new InvalidArgumentException(
                    "A rota {$method} {$path} já foi registrada."
                );
            }
        }

        $route = [
            'path' => $path,
            'pattern' => $pattern,
            'parameters' => $parameters,
            'handler' => $handler,
        ];

        if ($parameters === []) {
            array_unshift($this->routes[$method], $route);

            return;
        }

        $this->routes[$method][] = $route;
    }

    /** @return array{handler: callable, parameters: array<string, string>}|null */
    private function match(string $method, string $path): ?array
    {
        foreach ($this->routes[$method] ?? [] as $route) {
            $matches = [];

            if (preg_match($route['pattern'], $path, $matches) !== 1) {
                continue;
            }

            $parameters = [];

            foreach ($route['parameters'] as $parameter) {
                $parameters[$parameter] = rawurldecode($matches[$parameter]);
            }

            return [
                'handler' => $route['handler'],
                'parameters' => $parameters,
            ];
        }

        return null;
    }

    /** @return list<string> */
    private function allowedMethods(string $path): array
    {
        $methods = [];

        foreach (array_keys($this->routes) as $method) {
            if ($this->match($method, $path) !== null) {
                $methods[] = $method;
            }
        }

        sort($methods);

        return $methods;
    }

    /** @return array{string, list<string>} */
    private function compilePath(string $path): array
    {
        if ($path === '/') {
            return ['~^/$~D', []];
        }

        $parameters = [];
        $segments = explode('/', trim($path, '/'));
        $compiledSegments = [];

        foreach ($segments as $segment) {
            if (preg_match('/^\{([A-Za-z_][A-Za-z0-9_]*)\}$/', $segment, $matches) === 1) {
                $parameter = $matches[1];

                if (in_array($parameter, $parameters, true)) {
                    throw new InvalidArgumentException(
                        "O parâmetro {{$parameter}} está duplicado na rota {$path}."
                    );
                }

                $parameters[] = $parameter;
                $compiledSegments[] = "(?P<{$parameter}>[^/]+)";

                continue;
            }

            if (str_contains($segment, '{') || str_contains($segment, '}')) {
                throw new InvalidArgumentException("Parâmetro inválido na rota {$path}.");
            }

            $compiledSegments[] = preg_quote($segment, '~');
        }

        return ['~^/' . implode('/', $compiledSegments) . '$~D', $parameters];
    }

    private function normalizePath(string $path): string
    {
        $path = '/' . ltrim($path, '/');

        return $path === '/' ? $path : rtrim($path, '/');
    }
}
