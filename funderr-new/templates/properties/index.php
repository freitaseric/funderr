<?php
use Funderr\Http\Csrf;
use Funderr\Http\View;
$pageTitle = 'Propriedades - FUNDERR';
$form = $editing ?? [];
require dirname(__DIR__) . '/_header.php';
?>
<main>
    <h1>Propriedades</h1>
    <section>
        <h2><?= $editing === null ? 'Nova propriedade' : 'Editar propriedade' ?></h2>
        <form method="post" action="/properties">
            <?= Csrf::field() ?>
            <input type="hidden" name="id" value="<?= View::escape($form['id'] ?? '') ?>">
            <p><label>Beneficiário *
                <select name="beneficiary_id" required <?= $editing === null ? '' : 'readonly' ?>>
                    <option value="">Selecione</option>
                    <?php foreach ($beneficiaries as $beneficiary): ?>
                        <option value="<?= $beneficiary->id ?>" <?= (int) ($form['beneficiary_id'] ?? 0) === $beneficiary->id ? 'selected' : '' ?>><?= View::escape($beneficiary->nome) ?></option>
                    <?php endforeach; ?>
                </select>
            </label></p>
            <p><label>Denominação * <input name="denominacao" required value="<?= View::escape($form['denominacao'] ?? '') ?>"></label></p>
            <p><label>Endereço <input name="endereco" value="<?= View::escape($form['endereco'] ?? '') ?>"></label></p>
            <p><label>Município <select name="municipio"><option value="">Selecione</option><?php foreach ($municipalities as $municipality): ?><option <?= ($form['municipio'] ?? '') === $municipality ? 'selected' : '' ?>><?= View::escape($municipality) ?></option><?php endforeach; ?></select></label></p>
            <p><label>Área total <input type="number" step="0.01" min="0" name="area_total" value="<?= View::escape($form['area_total'] ?? '0') ?>"></label></p>
            <p><label>Área disponível <input type="number" step="0.01" min="0" name="area_disponivel" value="<?= View::escape($form['area_disponivel'] ?? '') ?>"></label></p>
            <p><label>Área legal <input type="number" step="0.01" min="0" name="area_legal" value="<?= View::escape($form['area_legal'] ?? '') ?>"></label></p>
            <p><label>Forma de ocupação <select name="forma_ocupacao"><option value="">Selecione</option><?php foreach (['PROPRIA' => 'Própria', 'ARRENDADA' => 'Arrendada', 'POSSE' => 'Posse', 'COMODATO' => 'Comodato', 'CONCESSAO' => 'Concessão de uso', 'ASSENTAMENTO' => 'Assentamento'] as $value => $label): ?><option value="<?= $value ?>" <?= ($form['forma_ocupacao'] ?? '') === $value ? 'selected' : '' ?>><?= View::escape($label) ?></option><?php endforeach; ?></select></label></p>
            <p><label>Tempo de exploração <input name="tempo_exploracao" value="<?= View::escape($form['tempo_exploracao'] ?? '') ?>"></label></p>
            <p><label>Módulo <input name="modulo" value="<?= View::escape($form['modulo'] ?? '') ?>"></label></p>
            <p><label>Documento existente <select name="documento_existente"><option value="">Selecione</option><?php foreach (['TITULO_DEFINITIVO' => 'Título definitivo', 'ESCRITURA_PUBLICA' => 'Escritura pública', 'CONTRATO_COMPRA_VENDA' => 'Contrato de compra e venda', 'CONTRATO_ARRENDAMENTO' => 'Contrato de arrendamento', 'TERMO_POSSE' => 'Termo de posse', 'CCU' => 'Contrato de concessão de uso (CCU)', 'OUTRO' => 'Outro documento', 'SEM_DOCUMENTO' => 'Sem documento'] as $value => $label): ?><option value="<?= $value ?>" <?= ($form['documento_existente'] ?? '') === $value ? 'selected' : '' ?>><?= View::escape($label) ?></option><?php endforeach; ?></select></label></p>
            <p><label>Latitude <input type="number" step="any" name="latitude" value="<?= View::escape($form['latitude'] ?? '') ?>"></label></p>
            <p><label>Longitude <input type="number" step="any" name="longitude" value="<?= View::escape($form['longitude'] ?? '') ?>"></label></p>
            <p><label>Confrontação Norte <input name="confrontacao_norte" value="<?= View::escape($form['confrontacao_norte'] ?? '') ?>"></label></p>
            <p><label>Confrontação Sul <input name="confrontacao_sul" value="<?= View::escape($form['confrontacao_sul'] ?? '') ?>"></label></p>
            <p><label>Confrontação Leste <input name="confrontacao_leste" value="<?= View::escape($form['confrontacao_leste'] ?? '') ?>"></label></p>
            <p><label>Confrontação Oeste <input name="confrontacao_oeste" value="<?= View::escape($form['confrontacao_oeste'] ?? '') ?>"></label></p>
            <p><label>Administração <textarea name="administracao"><?= View::escape($form['administracao'] ?? '') ?></textarea></label></p>
            <button type="submit">Salvar propriedade</button>
        </form>
    </section>
    <section>
        <h2>Propriedades cadastradas</h2>
        <table><thead><tr><th>Denominação</th><th>Beneficiário</th><th>Município</th><th>Área</th><th>Completude</th><th>Ação</th></tr></thead><tbody>
        <?php if ($properties === []): ?><tr class="empty-state"><td colspan="6"><strong>Nenhuma propriedade cadastrada</strong><small>Preencha o formulário acima para vincular a primeira propriedade a um beneficiário.</small></td></tr><?php endif; ?>
        <?php foreach ($properties as $property): ?><tr>
            <td><?= View::escape($property['denominacao']) ?></td><td><?= View::escape($property['beneficiary_nome']) ?></td>
            <td><?= View::escape($property['municipio']) ?></td><td><?= View::escape($property['area_total']) ?></td>
            <td><?= $property['percentual_completude'] ?>%<?php if ($property['pendencias'] !== []): ?> — <?= View::escape(implode(', ', $property['pendencias'])) ?><?php endif; ?></td>
            <td><a href="/properties?edit=<?= $property['id'] ?>">Editar</a></td>
        </tr><?php endforeach; ?>
        </tbody></table>
    </section>
</main>
<?php require dirname(__DIR__) . '/_footer.php'; ?>
