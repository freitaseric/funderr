<?php

declare(strict_types=1);

use Funderr\Domain\Beneficiary\Beneficiary;

function escape(string $value): string
{
    return htmlspecialchars(
        $value,
        ENT_QUOTES,
        'UTF-8',
    );
}
?>

<!DOCTYPE html>
<html lang="pt-BR">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Beneficiários - FUNDERR</title>
</head>

<body>
    <main>
        <h1>Beneficários</h1>
        <?php if ($error !== null): ?>
            <p>
                <?= escape($error) ?>
            </p>
        <?php endif; ?>

        <!-- TODO: Tem que fazer o fluxo de adição de beneficiários -->

        <section>
            <h2>Beneficiários Cadastrados</h2>

            <?php if ($beneficiaries === []): ?>
                <p>
                    Nenhum beneficiário cadastrado.
                </p>
            <?php else: ?>
                <!-- TODO: Tem que finalizar essa tabela -->
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nome</th>
                            <th>CPF</th>
                            <th>Criado em</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($beneficiaries as $beneficiary): ?>
                            <tr>
                                <td>
                                    <?= $beneficiary->id ?>
                                </td>
                                <td>
                                    <?= escape($beneficiary->nome) ?>
                                </td>
                                <td>
                                    <?= escape($beneficiary->cpf) ?>
                                </td>
                                <td>
                                    <?= escape($beneficiary->createdAt ?? '') ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </section>
    </main>
</body>

</html>
