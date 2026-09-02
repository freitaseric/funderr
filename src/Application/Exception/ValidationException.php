<?php

declare(strict_types=1);

namespace Funderr\Application\Exception;

use InvalidArgumentException;

final class ValidationException extends InvalidArgumentException
{
    /** @param array<string, string> $errors */
    public function __construct(
        private readonly array $errors,
    ) {
        parent::__construct(reset($errors) ?: 'Os dados informados são inválidos.');
    }

    /** @return array<string, string> */
    public function errors(): array
    {
        return $this->errors;
    }
}
