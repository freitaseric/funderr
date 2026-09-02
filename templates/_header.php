<?php

declare(strict_types=1);

use Funderr\Http\Flash;
use Funderr\Http\Csrf;
use Funderr\Http\View;

$success = Flash::take('success');
$error = Flash::take('error');
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= View::escape($pageTitle ?? 'FUNDERR') ?></title>
    <link rel="icon" type="image/png" href="/favicon.png">
    <link rel="stylesheet" href="/app.css">
    <meta name="csrf-token" content="<?= View::escape(Csrf::token()) ?>">
</head>
<body>
    <header>
        <a class="brand" href="/" aria-label="FUNDERR — Página inicial">
            <img src="/funderr-logo.png" alt="" width="48" height="48">
            <span>
                <strong>FUNDERR</strong>
                <small>Desenvolvimento Rural de Roraima</small>
            </span>
        </a>
        <nav aria-label="Navegação principal">
            <a href="/">Painel</a> |
            <a href="/proposals">Processos</a> |
            <a href="/beneficiaries">Beneficiários</a> |
            <a href="/properties">Propriedades</a> |
            <a href="/credit-lines">Linhas de crédito</a> |
            <a href="/documents">Documentos</a> |
            <a href="/audit">Auditoria</a> |
            <a href="/config">Configurações</a>
        </nav>
    </header>
    <aside class="presence-bar" data-presence aria-live="polite"></aside>
    <?php if ($success !== null): ?><p role="status"><?= View::escape($success) ?></p><?php endif; ?>
    <?php if ($error !== null): ?><p role="alert"><?= View::escape($error) ?></p><?php endif; ?>
