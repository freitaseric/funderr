<?php
use Funderr\Http\View;
$pageTitle = 'Documentos - FUNDERR';
require __DIR__ . '/_header.php';
?>
<main><h1>Documentos gerais</h1>
    <p>Os documentos são anexados dentro do processo correspondente.</p>
    <table><thead><tr><th>Processo</th><th>Tipo</th><th>Arquivo</th><th>Tamanho</th><th>Status</th><th>Ações</th></tr></thead><tbody>
    <?php if ($documents === []): ?><tr class="empty-state"><td colspan="6"><strong>Nenhum documento anexado</strong><small>Abra um processo para adicionar os documentos necessários à elaboração.</small></td></tr><?php endif; ?>
    <?php foreach ($documents as $document): ?><tr>
        <td><?= View::escape($document['proposal_numero']) ?></td><td><?= View::escape($document['tipo']) ?></td>
        <td><?= View::escape($document['nome_arquivo']) ?></td><td><?= number_format((int) $document['tamanho_bytes'] / 1024, 1, ',', '.') ?> KB</td>
        <td><?= View::escape($document['status']) ?></td><td><a href="/documents/<?= $document['id'] ?>/download">Baixar</a> | <a href="/proposals/<?= $document['proposal_id'] ?>">Abrir processo</a></td>
    </tr><?php endforeach; ?>
    </tbody></table>
</main>
<?php require __DIR__ . '/_footer.php'; ?>
