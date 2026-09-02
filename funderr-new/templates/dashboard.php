<?php
use Funderr\Http\View;

$pageTitle = 'Painel - FUNDERR';
require __DIR__ . '/_header.php';
?>
<main>
    <h1>Painel</h1>
    <dl>
        <dt>Beneficiários</dt><dd><?= $dashboard['beneficiaries'] ?></dd>
        <dt>Propriedades</dt><dd><?= $dashboard['properties'] ?></dd>
        <dt>Processos</dt><dd><?= $dashboard['proposals'] ?></dd>
        <dt>Em análise</dt><dd><?= $dashboard['in_analysis'] ?></dd>
        <dt>Aprovados ou concluídos</dt><dd><?= $dashboard['approved'] ?></dd>
        <dt>Documentos</dt><dd><?= $dashboard['documents'] ?></dd>
    </dl>
    <h2>Processos atualizados recentemente</h2>
    <?php if ($dashboard['recent'] === []): ?>
        <div class="empty-panel"><strong>Nenhum processo cadastrado</strong><small>Crie o primeiro processo para acompanhar aqui as atualizações mais recentes.</small></div>
    <?php else: ?>
        <table>
            <thead><tr><th>Número</th><th>Beneficiário</th><th>Status</th><th>Ação</th></tr></thead>
            <tbody>
            <?php foreach ($dashboard['recent'] as $proposal): ?>
                <tr>
                    <td><?= View::escape($proposal['numero']) ?></td>
                    <td><?= View::escape($proposal['beneficiary_nome']) ?></td>
                    <td><?= View::escape($proposal['status']) ?></td>
                    <td><a href="/proposals/<?= $proposal['id'] ?>">Abrir</a></td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif; ?>
</main>
<?php require __DIR__ . '/_footer.php'; ?>
