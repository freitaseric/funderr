<?php
use Funderr\Http\View;
$pageTitle = 'Auditoria - FUNDERR';
require __DIR__ . '/_header.php';
?>
<main><h1>Auditoria</h1>
    <form method="get" action="/audit">
        <label>Entidade <input name="entidade" value="<?= View::escape($filters['entidade']) ?>"></label>
        <label>Ação <input name="acao" value="<?= View::escape($filters['acao']) ?>"></label>
        <label>Dispositivo <input name="dispositivo" value="<?= View::escape($filters['dispositivo']) ?>"></label>
        <button type="submit">Filtrar</button>
    </form>
    <table><thead><tr><th>Data</th><th>Dispositivo</th><th>Identificação</th><th>Ação</th><th>Entidade</th><th>ID</th><th>Metadados</th></tr></thead><tbody>
    <?php if ($logs === []): ?><tr class="empty-state"><td colspan="7"><strong>Nenhum evento encontrado</strong><small>As ações realizadas no sistema aparecerão aqui. Se houver filtros ativos, tente removê-los.</small></td></tr><?php endif; ?>
    <?php foreach ($logs as $log): ?><tr><td><?= View::escape($log['created_at']) ?></td><td><?= View::escape($log['device_name'] ?? $log['user_name'] ?? 'Sistema') ?></td><td><code><?= View::escape(isset($log['device_id']) && $log['device_id'] !== null ? substr($log['device_id'], 0, 12) : '—') ?></code></td><td><?= View::escape($log['acao']) ?></td><td><?= View::escape($log['entidade']) ?></td><td><?= View::escape($log['entity_id']) ?></td><td><pre><?= View::escape($log['metadata'] ?? '') ?></pre></td></tr><?php endforeach; ?>
    </tbody></table>
</main>
<?php require __DIR__ . '/_footer.php'; ?>
