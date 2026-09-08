<?php
use Funderr\Http\Csrf;
use Funderr\Http\View;
$pageTitle = 'Processos - FUNDERR';
require dirname(__DIR__) . '/_header.php';
?>
<main>
    <h1>Processos</h1>
    <section><h2>Novo processo</h2>
        <p>A propriedade selecionada deve pertencer ao beneficiário. O servidor valida esse vínculo.</p>
        <form method="post" action="/proposals"><?= Csrf::field() ?>
            <p><label>Beneficiário * <select name="beneficiary_id" required><option value="">Selecione</option><?php foreach ($beneficiaries as $beneficiary): ?><option value="<?= $beneficiary->id ?>"><?= View::escape($beneficiary->nome) ?></option><?php endforeach; ?></select></label></p>
            <p><label>Propriedade * <select name="property_id" required><option value="">Selecione</option><?php foreach ($properties as $property): ?><option value="<?= $property['id'] ?>"><?= View::escape($property['denominacao']) ?> — <?= View::escape($property['beneficiary_nome']) ?></option><?php endforeach; ?></select></label></p>
            <p><label>Data * <input type="date" name="data" required value="<?= date('Y-m-d') ?>"></label></p>
            <p><label>Atividade * <input name="atividade" required value="Agricultura Familiar Diversificada"></label></p>
            <button type="submit">Criar processo</button>
        </form>
    </section>
    <section><h2>Processos cadastrados</h2>
        <table><thead><tr><th>Número</th><th>Beneficiário</th><th>Propriedade</th><th>Atividade</th><th>Status</th><th>Completude</th><th>Ação</th></tr></thead><tbody>
        <?php if ($proposals === []): ?><tr class="empty-state"><td colspan="7"><strong>Nenhum processo cadastrado</strong><small>Selecione um beneficiário e uma propriedade no formulário acima para iniciar a primeira elaboração.</small></td></tr><?php endif; ?>
        <?php foreach ($proposals as $proposal): ?><tr>
            <td><?= View::escape($proposal['numero']) ?></td><td><?= View::escape($proposal['beneficiary_nome']) ?></td>
            <td><?= View::escape($proposal['property_denominacao']) ?></td><td><?= View::escape($proposal['atividade']) ?></td>
            <td><?= View::escape($proposal['status']) ?></td><td><?= $proposal['percentual_global'] ?>%</td>
            <td><a href="/proposals/<?= $proposal['id'] ?>">Abrir elaboração</a></td>
        </tr><?php endforeach; ?>
        </tbody></table>
    </section>
</main>
<?php require dirname(__DIR__) . '/_footer.php'; ?>
