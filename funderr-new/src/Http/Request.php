<?php

declare(strict_types=1);

namespace Funderr\Http;

final class Request
{
    public function __construct(
        private readonly array $server,
        private readonly array $query = [],
        private readonly array $post = [],
        private readonly array $files = [],
        private readonly array $routeParameters = [],
    ) {
    }

    public static function capture(): self
    {
        return new self(
            server: $_SERVER,
            query: $_GET,
            post: $_POST,
            files: $_FILES,
        );
    }

    public function withRouteParameters(array $parameters): self
    {
        return new self(
            server: $this->server,
            query: $this->query,
            post: $this->post,
            files: $this->files,
            routeParameters: $parameters,
        );
    }

    public function method(): string
    {
        $method = $this->server['REQUEST_METHOD'] ?? 'GET';

        return is_string($method) ? strtoupper($method) : 'GET';
    }

    public function uri(): string
    {
        $uri = $this->server['REQUEST_URI'] ?? '/';

        return is_string($uri) ? $uri : '/';
    }

    public function path(): string
    {
        $path = parse_url($this->uri(), PHP_URL_PATH);

        return is_string($path) ? $path : '/';
    }

    public function input(string $key, mixed $default = null): mixed
    {
        return $this->post[$key] ?? $this->query[$key] ?? $default;
    }

    public function post(string $key, mixed $default = null): mixed
    {
        return $this->post[$key] ?? $default;
    }

    public function query(string $key, mixed $default = null): mixed
    {
        return $this->query[$key] ?? $default;
    }

    public function route(string $key, mixed $default = null): mixed
    {
        return $this->routeParameters[$key] ?? $default;
    }

    public function postData(): array
    {
        return $this->post;
    }

    public function routeParameters(): array
    {
        return $this->routeParameters;
    }

    public function file(string $key): ?array
    {
        $file = $this->files[$key] ?? null;

        return is_array($file) ? $file : null;
    }
}
