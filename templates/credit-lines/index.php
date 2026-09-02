<?php
use Funderr\Http\Csrf;
use Funderr\Http\View;
$pageTitle = 'Linhas de crédito - FUNDERR';
$form = $editing ?? [];
require dirname(__DIR__) . '/_header.php';
?>
<main>
    <h1>Linhas de crédito</h1>
    <section><h2><?= $editing ? 'Editar linha' : 'Nova linha' ?></h2>
        <form method="post" action="/credit-lines"><?= Csrf::field() ?>
            <input type="hidden" name="id" value="<?= View::escape($form['id'] ?? '') ?>">
            <p><label>Código * <input name="codigo" required value="<?= View::escape($form['codigo'] ?? '') ?>"></label></p>
            <p><label>Nome * <input name="nome" required value="<?= View::escape($form['nome'] ?? '') ?>"></label></p>
            <p><label><input type="checkbox" name="ativo" <?= !isset($form['ativo']) || $form['ativo'] ? 'checked' : '' ?>> Ativa</label></p>
            <p><label>Teto <input type="number" step="0.01" min="0" name="teto_financiamento" required value="<?= View::escape($form['teto_financiamento'] ?? '50000') ?>"></label></p>
            <p><label>Juros anuais (%) <input type="number" step="0.01" min="0" name="taxa_juros_anual" required value="<?= View::escape($form['taxa_juros_anual'] ?? '2') ?>"></label></p>
            <p><label>Prazo máximo (anos) <input type="number" min="1" name="prazo_max_anos" required value="<?= View::escape($form['prazo_max_anos'] ?? '5') ?>"></label></p>
            <p><label>Carência máxima (anos) <input type="number" min="0" name="carencia_max_anos" required value="<?= View::escape($form['carencia_max_anos'] ?? '1') ?>"></label></p>
            <p><label>Percentual financiável máximo <input type="number" step="0.01" min="0" max="100" name="percentual_financiavel_max" required value="<?= View::escape($form['percentual_financiavel_max'] ?? '100') ?>"></label></p>
            <p><label>Percentual ATER padrão <input type="number" step="0.01" min="0" name="percentual_ater_padrao" required value="<?= View::escape($form['percentual_ater_padrao'] ?? '2.5') ?>"></label></p>
            <p><label>Observações <textarea name="observacoes"><?= View::escape($form['observacoes'] ?? '') ?></textarea></label></p>
            <button type="submit">Salvar linha</button>
        </form>
    </section>
    <table><thead><tr><th>Código</th><th>Nome</th><th>Ativa</th><th>Teto</th><th>Juros</th><th>Prazo</th><th>Ação</th></tr></thead><tbody>
    <?php if ($creditLines === []): ?><tr class="empty-state"><td colspan="7"><strong>Nenhuma linha de crédito cadastrada</strong><small>Cadastre uma linha para habilitar a configuração de financiamentos.</small></td></tr><?php endif; ?>
    <?php foreach ($creditLines as $line): ?><tr><td><?= View::escape($line['codigo']) ?></td><td><?= View::escape($line['nome']) ?></td><td><?= $line['ativo'] ? 'Sim' : 'Não' ?></td><td><?= View::escape($line['teto_financiamento']) ?></td><td><?= View::escape($line['taxa_juros_anual']) ?>%</td><td><?= $line['prazo_max_anos'] ?> anos</td><td><a href="/credit-lines?edit=<?= $line['id'] ?>">Editar</a></td></tr><?php endforeach; ?>
    </tbody></table>
</main>
<?php require dirname(__DIR__) . '/_footer.php'; ?>
