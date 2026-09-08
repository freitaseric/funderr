<?php

use Funderr\Http\Csrf;
use Funderr\Http\View;

$pageTitle = 'Processo ' . $proposal['numero'] . ' - FUNDERR';
$actionUrl = static fn(string $action): string => '/proposals/' . $proposal['id'] . '/actions/' . $action;
$identification = $proposal['identification'] ?? [];
$financing = $proposal['financing'] ?? [];
$patrimonyCategories = ['TERRA_COBERTURAS' => 'Terras e coberturas vegetais', 'CONSTRUCOES_CIVIS' => 'Construções civis', 'ESTRUTURA_AGROPECUARIA' => 'Estrutura agropecuária', 'INFRAESTRUTURA' => 'Infraestrutura', 'MAQUINAS_EQUIPAMENTOS' => 'Máquinas e equipamentos', 'SEMOVENTES' => 'Animais (semoventes)', 'OUTROS_BENS_URBANOS' => 'Outros bens urbanos'];
$units = ['UNIDADE' => 'Unidade', 'HECTARE' => 'Hectare (ha)', 'METRO_QUADRADO' => 'Metro quadrado (m²)', 'QUILOGRAMA' => 'Quilograma (kg)', 'TONELADA' => 'Tonelada (t)', 'LITRO' => 'Litro (l)', 'CABECA' => 'Cabeça', 'MES' => 'Mês', 'ANO' => 'Ano'];
$useSourceCategories = ['INVESTIMENTO_FIXO' => 'Investimento fixo', 'INVESTIMENTO_SEMIFIXO' => 'Investimento semifixo', 'CUSTEIO' => 'Custeio', 'CAPITAL_PROPRIO' => 'Capital próprio', 'FINANCIAMENTO' => 'Financiamento', 'OUTRAS_FONTES' => 'Outras fontes'];
$cashFlowTypes = ['RECEITA' => 'Receita', 'CUSTO_VARIAVEL' => 'Custo variável', 'CUSTO_FIXO' => 'Custo fixo'];
$guaranteeTypes = ['AVAL_PESSOAL' => 'Aval pessoal', 'BEM' => 'Bem em garantia', 'OUTRA' => 'Outra garantia'];
$documentTypes = ['CPF_RG' => 'CPF e RG', 'COMPROVANTE_RESIDENCIA' => 'Comprovante de residência', 'CERTIDAO_CASAMENTO' => 'Certidão de casamento', 'CAF_DAP' => 'CAF/DAP', 'CAR_RORAIMA' => 'CAR de Roraima', 'TITULO_TERRA' => 'Título da terra', 'ORCAMENTO' => 'Orçamento', 'PROJETO_TECNICO' => 'Projeto técnico', 'OUTRO' => 'Outro documento'];
$jobsByCategory = [];
foreach ($proposal['jobs'] as $job) $jobsByCategory[$job['categoria']] = $job;
require dirname(__DIR__) . '/_header.php';
?>
<main>
    <p><a href="/proposals">← Voltar para processos</a></p>
    <h1>Processo <?= View::escape($proposal['numero']) ?></h1>
    <dl>
        <dt>Status</dt><dd><?= View::escape($proposal['status']) ?></dd>
        <dt>Data</dt><dd><?= View::escape($proposal['data']) ?></dd>
        <dt>Atividade</dt><dd><?= View::escape($proposal['atividade']) ?></dd>
        <dt>Completude global</dt><dd><?= $proposal['completion']['global'] ?>%</dd>
    </dl>
    <details>
        <summary>Editar dados gerais</summary>
        <form method="post" action="<?= $actionUrl('save-general') ?>"><?= Csrf::field() ?>
            <p><label>Beneficiário <select name="beneficiary_id"><?php foreach ($beneficiaries as $beneficiary): ?><option value="<?= $beneficiary->id ?>" <?= $beneficiary->id === (int)$proposal['beneficiary_id'] ? 'selected' : '' ?>><?= View::escape($beneficiary->nome) ?></option><?php endforeach; ?></select></label></p>
            <p><label>Propriedade <select name="property_id"><?php foreach ($properties as $property): ?><option value="<?= $property['id'] ?>" <?= (int)$property['id'] === (int)$proposal['property_id'] ? 'selected' : '' ?>><?= View::escape($property['denominacao']) ?> — <?= View::escape($property['beneficiary_nome']) ?></option><?php endforeach; ?></select></label></p>
            <p><label>Data <input type="date" name="data" required value="<?= View::escape($proposal['data']) ?>"></label></p>
            <p><label>Atividade <input name="atividade" required value="<?= View::escape($proposal['atividade']) ?>"></label></p>
            <button>Salvar dados gerais</button>
        </form>
    </details>

    <section>
        <h2>Etapas</h2>
        <table><thead><tr><th>Etapa</th><th>Status</th><th>Completude</th></tr></thead><tbody>
        <?php foreach ($proposal['completion']['stages'] as $stage => $state): ?>
            <tr><td><?= View::escape($stage) ?></td><td><?= View::escape($state['status']) ?></td><td><?= $state['percent'] ?>%</td></tr>
        <?php endforeach; ?>
        </tbody></table>
    </section>

    <section>
        <h2>Situação global</h2>
        <form method="post" action="<?= $actionUrl('status') ?>"><?= Csrf::field() ?>
            <label>Novo status <select name="status">
                <?php foreach (['EM ELABORAÇÃO', 'EM ANÁLISE', 'APROVADO', 'RECUSADO', 'CONCLUÍDO'] as $status): ?>
                    <option <?= $proposal['status'] === $status ? 'selected' : '' ?>><?= View::escape($status) ?></option>
                <?php endforeach; ?>
            </select></label>
            <label>Motivo <input name="motivo"></label>
            <button type="submit">Alterar status</button>
        </form>
        <?php if ($proposal['history'] !== []): ?><h3>Histórico</h3><ol><?php foreach ($proposal['history'] as $history): ?><li><?= View::escape($history['changed_at']) ?>: <?= View::escape($history['status_anterior']) ?> → <?= View::escape($history['status_novo']) ?><?= $history['motivo'] ? ' — ' . View::escape($history['motivo']) : '' ?></li><?php endforeach; ?></ol><?php endif; ?>
    </section>

    <section>
        <h2>Beneficiário</h2>
        <dl><dt>Nome</dt><dd><?= View::escape($proposal['beneficiary_nome']) ?></dd><dt>CPF</dt><dd><?= View::escape($proposal['beneficiary_cpf']) ?></dd><dt>Telefone</dt><dd><?= View::escape($proposal['beneficiary_telefone']) ?></dd></dl>
        <p><a href="/beneficiaries/<?= $proposal['beneficiary_id'] ?>">Abrir cadastro do beneficiário</a></p>
    </section>

    <section>
        <h2>Propriedade</h2>
        <dl><dt>Denominação</dt><dd><?= View::escape($proposal['property_denominacao']) ?></dd><dt>Município</dt><dd><?= View::escape($proposal['property_municipio']) ?></dd><dt>Endereço</dt><dd><?= View::escape($proposal['property_endereco']) ?></dd><dt>Área total</dt><dd><?= View::escape($proposal['property_area_total']) ?></dd></dl>
        <p><a href="/properties?edit=<?= $proposal['property_id'] ?>">Abrir propriedade</a></p>
    </section>

    <section>
        <h2>Levantamento patrimonial — <?= View::escape($proposal['patrimonio_status']) ?></h2>
        <h3>Bens</h3>
        <table><thead><tr><th>Categoria</th><th>Especificação</th><th>Unidade</th><th>Quantidade</th><th>Valor unitário</th><th>Total</th><th>Ação</th></tr></thead><tbody>
        <?php if ($proposal['patrimony_items'] === []): ?><tr class="empty-state"><td colspan="7"><strong>Nenhum bem informado</strong><small>Use o formulário abaixo para adicionar os bens que compõem o patrimônio.</small></td></tr><?php endif; ?>
        <?php foreach ($proposal['patrimony_items'] as $item): ?><tr><td><?= View::escape($patrimonyCategories[$item['categoria']] ?? $item['categoria']) ?></td><td><?= View::escape($item['especificacao']) ?></td><td><?= View::escape($units[$item['unidade']] ?? $item['unidade']) ?></td><td><?= View::escape($item['quantidade']) ?></td><td><?= View::escape($item['valor_unitario']) ?></td><td><?= View::escape($item['valor_total']) ?></td><td><form method="post" action="/proposals/<?= $proposal['id'] ?>/remove/patrimony-item"><?= Csrf::field() ?><input type="hidden" name="child_id" value="<?= $item['id'] ?>"><button type="submit">Excluir</button></form></td></tr><?php endforeach; ?>
        </tbody></table>
        <form method="post" action="<?= $actionUrl('add-patrimony-item') ?>"><?= Csrf::field() ?>
            <label>Categoria <select name="categoria"><?php foreach ($patrimonyCategories as $value => $label): ?><option value="<?= $value ?>"><?= View::escape($label) ?></option><?php endforeach; ?></select></label>
            <label>Especificação <input name="especificacao" required></label><label>Unidade <select name="unidade"><?php foreach ($units as $value => $label): ?><option value="<?= $value ?>"><?= View::escape($label) ?></option><?php endforeach; ?></select></label>
            <label>Quantidade <input type="number" step="0.01" min="0" name="quantidade" required></label><label>Valor unitário <input type="number" step="0.01" min="0" name="valor_unitario" required></label>
            <button type="submit">Adicionar bem</button>
        </form>
        <h3>Dívidas</h3>
        <table><thead><tr><th>Credor</th><th>Finalidade</th><th>Vencimento</th><th>Saldo</th><th>Ação</th></tr></thead><tbody>
        <?php if ($proposal['patrimony_debts'] === []): ?><tr class="empty-state"><td colspan="5"><strong>Nenhuma dívida informada</strong><small>Adicione uma dívida abaixo ou confirme que a situação foi revisada.</small></td></tr><?php endif; ?>
        <?php foreach ($proposal['patrimony_debts'] as $debt): ?><tr><td><?= View::escape($debt['credor']) ?></td><td><?= View::escape($debt['finalidade']) ?></td><td><?= View::escape($debt['vencimento']) ?></td><td><?= View::escape($debt['saldo_devedor']) ?></td><td><form method="post" action="/proposals/<?= $proposal['id'] ?>/remove/debt"><?= Csrf::field() ?><input type="hidden" name="child_id" value="<?= $debt['id'] ?>"><button type="submit">Excluir</button></form></td></tr><?php endforeach; ?>
        </tbody></table>
        <form method="post" action="<?= $actionUrl('add-debt') ?>"><?= Csrf::field() ?><label>Credor <input name="credor" required></label><label>Finalidade <input name="finalidade" required></label><label>Vencimento <input type="date" name="vencimento" required></label><label>Saldo devedor <input type="number" step="0.01" min="0" name="saldo_devedor" required></label><button type="submit">Adicionar dívida</button></form>
        <dl><dt>Patrimônio rural bruto</dt><dd><?= View::escape($proposal['patrimony_totals']['bens']) ?></dd><dt>Outros bens urbanos</dt><dd><?= View::escape($proposal['patrimony_totals']['outros_bens_urbanos']) ?></dd><dt>Total informado</dt><dd><?= View::escape($proposal['patrimony_totals']['total_informado']) ?></dd><dt>Total de dívidas</dt><dd><?= View::escape($proposal['patrimony_totals']['dividas']) ?></dd><dt>Patrimônio líquido rural</dt><dd><?= View::escape($proposal['patrimony_totals']['liquido']) ?></dd></dl>
        <form method="post" action="<?= $actionUrl('confirm-debts') ?>"><?= Csrf::field() ?><label><input type="checkbox" name="confirmed" <?= $proposal['patrimonio_dividas_confirmadas'] ? 'checked' : '' ?>> Situação das dívidas revisada</label><button type="submit">Salvar confirmação</button></form>
        <form method="post" action="<?= $actionUrl('complete-patrimony') ?>"><?= Csrf::field() ?><button type="submit">Concluir patrimônio</button></form>
    </section>

    <section>
        <h2>Identificação da proposta — <?= View::escape($proposal['identificacao_status']) ?></h2>
        <form method="post" action="<?= $actionUrl('save-identification') ?>"><?= Csrf::field() ?>
            <p><label>Finalidade <textarea name="finalidade"><?= View::escape($identification['finalidade'] ?? '') ?></textarea></label></p>
            <p><label>Mercado <textarea name="mercado"><?= View::escape($identification['mercado'] ?? '') ?></textarea></label></p>
            <p><label>Faturamento do último ano <input type="number" step="0.01" min="0" name="faturamento_ultimo_ano" value="<?= View::escape($identification['faturamento_ultimo_ano'] ?? '0') ?>"></label></p>
            <p><label>Análise de localização <textarea name="analise_localizacao"><?= View::escape($identification['analise_localizacao'] ?? '') ?></textarea></label></p>
            <p><label>Considerações <textarea name="consideracoes"><?= View::escape($identification['consideracoes'] ?? '') ?></textarea></label></p>
            <table><thead><tr><th>Empregos</th><th>Fase atual</th><th>Expansão</th></tr></thead><tbody>
            <?php foreach (['ADMINISTRATIVOS','TECNICOS','PRODUTIVOS','OUTROS'] as $category): $job = $jobsByCategory[$category] ?? []; ?><tr><td><?= $category ?></td><td><input type="number" min="0" name="job_<?= $category ?>_atual" value="<?= View::escape($job['fase_atual'] ?? '0') ?>"></td><td><input type="number" min="0" name="job_<?= $category ?>_expansao" value="<?= View::escape($job['fase_expansao'] ?? '0') ?>"></td></tr><?php endforeach; ?>
            </tbody></table>
            <p><label><input type="checkbox" name="empregos_confirmados" <?= ($identification['empregos_confirmados'] ?? false) ? 'checked' : '' ?>> Empregos revisados</label></p>
            <p><label><input type="checkbox" name="usos_fontes_confirmados" <?= ($identification['usos_fontes_confirmados'] ?? false) ? 'checked' : '' ?>> Usos e fontes revisados</label></p>
            <button type="submit">Salvar identificação</button>
        </form>
        <h3>Usos e fontes</h3>
        <table><thead><tr><th>Tipo</th><th>Categoria</th><th>Realizado</th><th>A realizar</th><th>Total</th><th>Ação</th></tr></thead><tbody>
        <?php if ($proposal['use_sources'] === []): ?><tr class="empty-state"><td colspan="6"><strong>Nenhum uso ou fonte informado</strong><small>Adicione abaixo os recursos previstos e suas respectivas fontes.</small></td></tr><?php endif; ?>
        <?php foreach ($proposal['use_sources'] as $item): ?><tr><td><?= View::escape($item['tipo']) ?></td><td><?= View::escape($item['categoria']) ?></td><td><?= View::escape($item['realizado']) ?></td><td><?= View::escape($item['a_realizar']) ?></td><td><?= View::escape((float)$item['realizado'] + (float)$item['a_realizar']) ?></td><td><form method="post" action="/proposals/<?= $proposal['id'] ?>/remove/use-source"><?= Csrf::field() ?><input type="hidden" name="child_id" value="<?= $item['id'] ?>"><button>Excluir</button></form></td></tr><?php endforeach; ?>
        </tbody></table>
        <form method="post" action="<?= $actionUrl('add-use-source') ?>"><?= Csrf::field() ?><label>Tipo <select name="tipo"><option value="USO">Uso do recurso</option><option value="FONTE">Fonte do recurso</option></select></label><label>Categoria <select name="categoria"><?php foreach ($useSourceCategories as $value => $label): ?><option value="<?= $value ?>"><?= View::escape($label) ?></option><?php endforeach; ?></select></label><label>Realizado <input type="number" step="0.01" min="0" name="realizado"></label><label>A realizar <input type="number" step="0.01" min="0" name="a_realizar"></label><button>Adicionar</button></form>
        <form method="post" action="<?= $actionUrl('complete-identification') ?>"><?= Csrf::field() ?><button>Concluir identificação</button></form>
    </section>

    <section>
        <h2>Fluxo de caixa — <?= View::escape($proposal['fluxo_status']) ?></h2>
        <table><thead><tr><th>Tipo</th><th>Descrição</th><?php for ($year=1;$year<=7;$year++): ?><th>Ano <?= $year ?></th><?php endfor; ?><th>Ação</th></tr></thead><tbody>
        <?php if ($proposal['cash_flow_items'] === []): ?><tr class="empty-state"><td colspan="10"><strong>Nenhum item no fluxo de caixa</strong><small>Adicione receitas e custos para formar a projeção dos próximos sete anos.</small></td></tr><?php endif; ?>
        <?php foreach ($proposal['cash_flow_items'] as $item): ?><tr><td><?= View::escape($item['tipo']) ?></td><td><?= View::escape($item['descricao']) ?></td><?php for ($year=1;$year<=7;$year++): ?><td><?= View::escape($item['ano'.$year]) ?></td><?php endfor; ?><td><form method="post" action="/proposals/<?= $proposal['id'] ?>/remove/cash-flow-item"><?= Csrf::field() ?><input type="hidden" name="child_id" value="<?= $item['id'] ?>"><button>Excluir</button></form></td></tr><?php endforeach; ?>
        <tr><th colspan="2">Saldo operacional</th><?php foreach ($proposal['cash_flow']['saldo_operacional'] as $value): ?><th><?= View::escape($value) ?></th><?php endforeach; ?><th></th></tr>
        </tbody></table>
        <form method="post" action="<?= $actionUrl('add-cash-flow-item') ?>"><?= Csrf::field() ?>
            <label>Tipo <select name="tipo"><?php foreach ($cashFlowTypes as $value => $label): ?><option value="<?= $value ?>"><?= View::escape($label) ?></option><?php endforeach; ?></select></label><label>Descrição <input name="descricao" required></label><label>Unidade <select name="unidade"><?php foreach ($units as $value => $label): ?><option value="<?= $value ?>"><?= View::escape($label) ?></option><?php endforeach; ?></select></label><label>Quantidade <input type="number" step="0.01" min="0" name="quantidade" required></label><label>Valor unitário <input type="number" step="0.01" min="0" name="valor_unitario" required></label>
            <?php for ($year=2;$year<=7;$year++): ?><label>Ano <?= $year ?> <input type="number" step="0.01" min="0" name="ano<?= $year ?>" value="0"></label><?php endfor; ?><button>Adicionar item</button>
        </form>
        <form method="post" action="<?= $actionUrl('confirm-cash-flow') ?>"><?= Csrf::field() ?><label><input type="checkbox" name="confirmed" <?= $proposal['fluxo_projecao_confirmada'] ? 'checked' : '' ?>> Projeção de sete anos revisada</label><button>Salvar confirmação</button></form>
        <form method="post" action="<?= $actionUrl('complete-cash-flow') ?>"><?= Csrf::field() ?><button>Concluir fluxo de caixa</button></form>
    </section>

    <section>
        <h2>Financiamento — <?= View::escape($proposal['financiamento_status']) ?></h2>
        <?php if ($creditLines === []): ?><p>Cadastre uma linha de crédito ativa antes de configurar o financiamento.</p><?php else: ?>
        <form method="post" action="<?= $actionUrl('save-financing') ?>"><?= Csrf::field() ?>
            <p><label>Linha <select name="credit_line_id"><?php foreach ($creditLines as $line): ?><option value="<?= $line['id'] ?>" <?= (int)($financing['credit_line_id'] ?? 0)===(int)$line['id']?'selected':'' ?>><?= View::escape($line['nome']) ?></option><?php endforeach; ?></select></label></p>
            <p><label>Valor da proposta <input type="number" step="0.01" min="0" name="valor_proposta" required value="<?= View::escape($financing['valor_proposta'] ?? '') ?>"></label></p>
            <p><label>Percentual financiável <input type="number" step="0.01" min="0" max="100" name="percentual_financiavel" required value="<?= View::escape($financing['percentual_financiavel'] ?? '100') ?>"></label></p>
            <p><label>Percentual ATER <input type="number" step="0.01" min="0" name="percentual_ater" required value="<?= View::escape($financing['percentual_ater'] ?? '2.5') ?>"></label></p>
            <p><label>Juros anuais (%) <input type="number" step="0.01" min="0" name="taxa_juros_anual" required value="<?= View::escape($financing['taxa_juros_anual'] ?? '2') ?>"></label></p>
            <p><label>Prazo total <input type="number" min="1" name="prazo_total_anos" required value="<?= View::escape($financing['prazo_total_anos'] ?? '5') ?>"></label></p>
            <p><label>Carência <input type="number" min="0" name="carencia_anos" required value="<?= View::escape($financing['carencia_anos'] ?? '1') ?>"></label></p>
            <p><label>Juros na carência <select name="juros_carencia"><option value="PAGAR" <?= ($financing['juros_carencia']??'')==='PAGAR'?'selected':'' ?>>Pagar durante a carência</option><option value="CAPITALIZAR" <?= ($financing['juros_carencia']??'')==='CAPITALIZAR'?'selected':'' ?>>Incorporar ao saldo devedor</option></select></label></p>
            <button>Salvar financiamento</button>
        </form><?php endif; ?>
        <?php if ($financing !== []): ?>
            <dl><dt>Valor financiado</dt><dd><?= View::escape($financing['valor_financiado']) ?></dd><dt>Valor ATER</dt><dd><?= View::escape($financing['valor_ater']) ?></dd><dt>Valor do projeto</dt><dd><?= View::escape($financing['valor_projeto']) ?></dd></dl>
            <h3>Cronograma SAC e capacidade de pagamento</h3><table><thead><tr><th>Ano</th><th>Saldo inicial</th><th>Juros</th><th>Amortização</th><th>Prestação</th><th>Saldo final</th><th>Saldo operacional</th></tr></thead><tbody><?php foreach ($financing['schedule'] as $row): ?><tr><td><?= $row['ano'] ?></td><td><?= $row['saldo_inicial'] ?></td><td><?= $row['juros'] ?></td><td><?= $row['amortizacao'] ?></td><td><?= $row['prestacao'] ?></td><td><?= $row['saldo_final'] ?></td><td><?= $row['saldo_operacional'] ?></td></tr><?php endforeach; ?></tbody></table>
            <?php if ($financing['capacidade_insuficiente']): ?><p role="alert">Atenção: existem parcelas maiores que o saldo operacional projetado.</p><ul><?php foreach ($financing['capacity_alerts'] as $alert): ?><li>Ano <?= $alert['ano'] ?>: prestação <?= $alert['prestacao'] ?>; saldo operacional <?= $alert['saldo_operacional'] ?>.</li><?php endforeach; ?></ul><?php endif; ?>
            <h3>Garantias</h3><table><thead><tr><th>Tipo</th><th>Descrição</th><th>Garantidor</th><th>CPF</th><th>Valor</th><th>Ação</th></tr></thead><tbody><?php if ($proposal['guarantees'] === []): ?><tr class="empty-state"><td colspan="6"><strong>Nenhuma garantia informada</strong><small>Use o formulário abaixo para incluir as garantias do financiamento.</small></td></tr><?php endif; ?><?php foreach ($proposal['guarantees'] as $guarantee): ?><tr><td><?= View::escape($guarantee['tipo']) ?></td><td><?= View::escape($guarantee['descricao']) ?></td><td><?= View::escape($guarantee['garantidor_nome']??'') ?></td><td><?= View::escape($guarantee['garantidor_cpf']??'') ?></td><td><?= View::escape($guarantee['valor_estimado']??'') ?></td><td><form method="post" action="/proposals/<?= $proposal['id'] ?>/remove/guarantee"><?= Csrf::field() ?><input type="hidden" name="child_id" value="<?= $guarantee['id'] ?>"><button>Excluir</button></form></td></tr><?php endforeach; ?></tbody></table>
            <form method="post" action="<?= $actionUrl('add-guarantee') ?>"><?= Csrf::field() ?><label>Tipo <select name="tipo"><?php foreach ($guaranteeTypes as $value => $label): ?><option value="<?= $value ?>"><?= View::escape($label) ?></option><?php endforeach; ?></select></label><label>Descrição <input name="descricao" required></label><label>Garantidor <input name="garantidor_nome"></label><label>CPF <input name="garantidor_cpf" inputmode="numeric" data-mask="cpf" maxlength="14"></label><label>Telefone <input name="garantidor_telefone" inputmode="tel" data-mask="phone" maxlength="15"></label><label>Valor estimado <input type="number" step="0.01" min="0" name="valor_estimado"></label><button>Adicionar garantia</button></form>
            <form method="post" action="<?= $actionUrl('confirm-guarantees') ?>"><?= Csrf::field() ?><label><input type="checkbox" name="confirmed" <?= $financing['garantias_confirmadas']?'checked':'' ?>> Garantias revisadas</label><button>Salvar</button></form>
            <form method="post" action="<?= $actionUrl('confirm-schedule') ?>"><?= Csrf::field() ?><label><input type="checkbox" name="confirmed" <?= $financing['cronograma_confirmado']?'checked':'' ?>> Cronograma revisado</label><button>Salvar</button></form>
            <form method="post" action="<?= $actionUrl('complete-financing') ?>"><?= Csrf::field() ?><button>Concluir financiamento</button></form>
        <?php endif; ?>
    </section>

    <section>
        <h2>Documentos</h2>
        <table><thead><tr><th>Tipo</th><th>Arquivo</th><th>Status</th><th>Ações</th></tr></thead><tbody><?php if ($proposal['documents'] === []): ?><tr class="empty-state"><td colspan="4"><strong>Nenhum documento anexado</strong><small>Selecione o tipo e o arquivo no formulário abaixo para iniciar a documentação.</small></td></tr><?php endif; ?><?php foreach ($proposal['documents'] as $document): ?><tr><td><?= View::escape($document['tipo']) ?></td><td><?= View::escape($document['nome_arquivo']) ?></td><td><?= View::escape($document['status']) ?></td><td><a href="/documents/<?= $document['id'] ?>/download">Baixar</a><form method="post" action="/proposals/<?= $proposal['id'] ?>/documents/<?= $document['id'] ?>/confirm"><?= Csrf::field() ?><label>Dados verificados (JSON) <textarea name="verified_data"><?= View::escape($document['extracted_data']??'') ?></textarea></label><button>Confirmar</button></form><form method="post" action="/proposals/<?= $proposal['id'] ?>/documents/<?= $document['id'] ?>/delete"><?= Csrf::field() ?><button>Excluir</button></form></td></tr><?php endforeach; ?></tbody></table>
        <form method="post" enctype="multipart/form-data" action="<?= $actionUrl('upload-document') ?>"><?= Csrf::field() ?><label>Tipo <select name="tipo"><?php foreach ($documentTypes as $value => $label): ?><option value="<?= $value ?>"><?= View::escape($label) ?></option><?php endforeach; ?></select></label><label>Arquivo <input type="file" name="document" accept="application/pdf,image/jpeg,image/png,image/webp" required></label><button>Anexar documento</button></form>
    </section>
</main>
<?php require dirname(__DIR__) . '/_footer.php'; ?>
