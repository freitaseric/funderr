<?php

declare(strict_types=1);

namespace Funderr\Http;

final class Response
{
    public function __construct(
        private readonly string $body = '',
        private readonly int $status = 200,
        private readonly array $headers = [],
    ) {
    }

    public static function html(string $body, int $status = 200): self
    {
        return new self(
            body: $body,
            status: $status,
            headers: ['Content-Type' => 'text/html; charset=UTF-8'],
        );
    }

    public static function text(string $body, int $status = 200): self
    {
        return new self(
            body: $body,
            status: $status,
            headers: ['Content-Type' => 'text/plain; charset=UTF-8'],
        );
    }

    public static function json(array $data, int $status = 200): self
    {
        return new self(
            body: json_encode($data, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE),
            status: $status,
            headers: ['Content-Type' => 'application/json; charset=UTF-8'],
        );
    }

    public static function redirect(string $location, int $status = 303): self
    {
        return new self(
            status: $status,
            headers: ['Location' => $location],
        );
    }

    public function body(): string
    {
        return $this->body;
    }

    public function status(): int
    {
        return $this->status;
    }

    public function headers(): array
    {
        return $this->headers;
    }

    public function send(): void
    {
        http_response_code($this->status);

        foreach ($this->headers as $name => $value) {
            header("{$name}: {$value}");
        }

        echo $this->body;
    }
}
