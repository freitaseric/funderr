const SHEET_BENEFICIARIOS =
  'Beneficiarios';

const SHEET_PROPOSTAS =
  'Propostas';

const SHEET_PROPRIEDADES =
  'Propriedades';

const SHEET_REFERENCIAS =
  'BeneficiarioReferencias';

const SHEET_PATRIMONIO_LEVANTAMENTOS =
  'PatrimonioLevantamentos';

const SHEET_PATRIMONIO_ITENS =
  'PatrimonioItens';

const SHEET_PATRIMONIO_DIVIDAS =
  'PatrimonioDividas';

const SHEET_PROPOSTA_IDENTIFICACOES =
  'PropostaIdentificacoes';

const SHEET_PROPOSTA_EMPREGOS =
  'PropostaEmpregos';

const SHEET_PROPOSTA_USOS_FONTES =
  'PropostaUsosFontes';

const SHEET_FLUXO_CAIXA =
  'FluxoCaixa';

const SHEET_FLUXO_CAIXA_ITENS =
  'FluxoCaixaItens';

const SHEET_LINHAS_CREDITO =
  'LinhasCredito';

const SHEET_FINANCIAMENTOS =
  'Financiamentos';

const SHEET_FINANCIAMENTO_GARANTIAS =
  'FinanciamentoGarantias';


function configurarSistema() {
  const spreadsheet =
    SpreadsheetApp
      .getActiveSpreadsheet();

  if (!spreadsheet) {
    throw new Error(
      'Este projeto precisa estar vinculado à planilha FUNDERR.'
    );
  }


  PropertiesService
    .getScriptProperties()
    .setProperty(
      'SPREADSHEET_ID',
      spreadsheet.getId()
    );


  /* =========================================================
     BENEFICIÁRIOS
     ========================================================= */

  const beneficiariosSheet =
    criarAbaSeNecessario_(
      spreadsheet,
      SHEET_BENEFICIARIOS,
      [
        'id',
        'nome',
        'cpf',
        'telefone',
        'criado_em'
      ]
    );


  garantirColunas_(
    beneficiariosSheet,
    [
      'apelido',
      'nacionalidade',
      'naturalidade',
      'estado_civil',
      'data_nascimento',
      'profissao',
      'rg',
      'escolaridade',
      'endereco',
      'dependentes',
      'conjuge_nome',
      'conjuge_rg',
      'conjuge_cpf',
      'atualizado_em'
    ]
  );


  beneficiariosSheet
    .getRange('C:C')
    .setNumberFormat('@');


  beneficiariosSheet
    .getRange('R:R')
    .setNumberFormat('@');


  beneficiariosSheet
    .getRange('J:J')
    .setNumberFormat(
      'dd/mm/yyyy'
    );


  /* =========================================================
     REFERÊNCIAS
     ========================================================= */

  criarAbaSeNecessario_(
    spreadsheet,
    SHEET_REFERENCIAS,
    [
      'id',
      'beneficiario_id',
      'ordem',
      'nome',
      'telefone',
      'criado_em',
      'atualizado_em'
    ]
  );


  /* =========================================================
     PROPRIEDADES
     ========================================================= */

  const propriedadesSheet =
    criarAbaSeNecessario_(
      spreadsheet,
      SHEET_PROPRIEDADES,
      [
        'id',
        'beneficiario_id',
        'denominacao',
        'endereco',
        'municipio',
        'estado',
        'area_total',
        'area_disponivel',
        'forma_ocupacao',
        'tempo_exploracao',
        'modulo',
        'documento_existente',
        'latitude',
        'longitude',
        'confrontacao_norte',
        'confrontacao_sul',
        'confrontacao_leste',
        'confrontacao_oeste',
        'criado_em',
        'atualizado_em'
      ]
    );


  garantirColunas_(
    propriedadesSheet,
    [
      'area_legal',
      'administracao'
    ]
  );


  /* =========================================================
     PROCESSOS
     ========================================================= */

  const propostasSheet =
    criarAbaSeNecessario_(
      spreadsheet,
      SHEET_PROPOSTAS,
      [
        'id',
        'numero',
        'beneficiario_id',
        'data',
        'atividade',
        'status',
        'criado_em',
        'atualizado_em',
        'propriedade_id'
      ]
    );


  garantirColuna_(
    propostasSheet,
    'propriedade_id'
  );


  /* =========================================================
     PATRIMÔNIO
     ========================================================= */

  criarAbaSeNecessario_(
    spreadsheet,
    SHEET_PATRIMONIO_LEVANTAMENTOS,
    [
      'id',
      'proposta_id',
      'status',
      'dividas_confirmadas',
      'concluido_em',
      'criado_em',
      'atualizado_em'
    ]
  );


  const patrimonioItensSheet =
    criarAbaSeNecessario_(
      spreadsheet,
      SHEET_PATRIMONIO_ITENS,
      [
        'id',
        'proposta_id',
        'categoria',
        'especificacao',
        'unidade',
        'quantidade',
        'valor_unitario',
        'valor_total',
        'criado_em',
        'atualizado_em'
      ]
    );


  patrimonioItensSheet
    .getRange('F:F')
    .setNumberFormat(
      '#,##0.00'
    );


  patrimonioItensSheet
    .getRange('G:H')
    .setNumberFormat(
      'R$ #,##0.00'
    );


  const dividasSheet =
    criarAbaSeNecessario_(
      spreadsheet,
      SHEET_PATRIMONIO_DIVIDAS,
      [
        'id',
        'proposta_id',
        'credor',
        'finalidade',
        'vencimento',
        'saldo_devedor',
        'criado_em',
        'atualizado_em'
      ]
    );


  dividasSheet
    .getRange('E:E')
    .setNumberFormat(
      'dd/mm/yyyy'
    );


  dividasSheet
    .getRange('F:F')
    .setNumberFormat(
      'R$ #,##0.00'
    );


  /* =========================================================
     IDENTIFICAÇÃO
     ========================================================= */

  const identificacoesSheet =
    criarAbaSeNecessario_(
      spreadsheet,
      SHEET_PROPOSTA_IDENTIFICACOES,
      [
        'id',
        'proposta_id',
        'finalidade',
        'mercado',
        'faturamento_ultimo_ano',
        'analise_localizacao',
        'consideracoes',
        'empregos_confirmados',
        'usos_fontes_confirmados',
        'status',
        'patrimonio_revisado_em',
        'concluido_em',
        'criado_em',
        'atualizado_em'
      ]
    );


  identificacoesSheet
    .getRange('E:E')
    .setNumberFormat(
      'R$ #,##0.00'
    );


  const empregosSheet =
    criarAbaSeNecessario_(
      spreadsheet,
      SHEET_PROPOSTA_EMPREGOS,
      [
        'id',
        'proposta_id',
        'categoria',
        'fase_atual',
        'fase_expansao',
        'total',
        'criado_em',
        'atualizado_em'
      ]
    );


  empregosSheet
    .getRange('D:F')
    .setNumberFormat('0');


  const usosFontesSheet =
    criarAbaSeNecessario_(
      spreadsheet,
      SHEET_PROPOSTA_USOS_FONTES,
      [
        'id',
        'proposta_id',
        'tipo',
        'categoria',
        'valor',
        'criado_em',
        'atualizado_em'
      ]
    );


  usosFontesSheet
    .getRange('E:E')
    .setNumberFormat(
      'R$ #,##0.00'
    );


  /* =========================================================
     FLUXO DE CAIXA
     ========================================================= */

  criarAbaSeNecessario_(
    spreadsheet,
    SHEET_FLUXO_CAIXA,
    [
      'id',
      'proposta_id',
      'status',
      'projecao_confirmada',
      'identificacao_revisada_em',
      'concluido_em',
      'criado_em',
      'atualizado_em'
    ]
  );


  const fluxoItensSheet =
    criarAbaSeNecessario_(
      spreadsheet,
      SHEET_FLUXO_CAIXA_ITENS,
      [
        'id',
        'proposta_id',
        'tipo',
        'descricao',
        'unidade',
        'quantidade',
        'valor_unitario',
        'ano_1',
        'ano_2',
        'ano_3',
        'ano_4',
        'ano_5',
        'ano_6',
        'ano_7',
        'criado_em',
        'atualizado_em'
      ]
    );


  fluxoItensSheet
    .getRange('F:F')
    .setNumberFormat(
      '#,##0.00'
    );


  fluxoItensSheet
    .getRange('G:N')
    .setNumberFormat(
      'R$ #,##0.00'
    );


  /* =========================================================
     V0.10 - LINHAS DE CRÉDITO
     ========================================================= */

  const linhasCreditoSheet =
    criarAbaSeNecessario_(
      spreadsheet,
      SHEET_LINHAS_CREDITO,
      [
        'id',
        'codigo',
        'nome',
        'ativo',
        'teto_financiamento',
        'taxa_juros_anual',
        'prazo_max_anos',
        'carencia_max_anos',
        'percentual_financiavel_max',
        'percentual_ater_padrao',
        'observacoes',
        'criado_em',
        'atualizado_em'
      ]
    );


  linhasCreditoSheet
    .getRange('E:E')
    .setNumberFormat(
      'R$ #,##0.00'
    );


  linhasCreditoSheet
    .getRange('F:F')
    .setNumberFormat(
      '0.000"%"'
    );


  linhasCreditoSheet
    .getRange('I:J')
    .setNumberFormat(
      '0.00"%"'
    );


  /* =========================================================
     V0.10 - FINANCIAMENTOS
     ========================================================= */

  const financiamentosSheet =
    criarAbaSeNecessario_(
      spreadsheet,
      SHEET_FINANCIAMENTOS,
      [
        'id',
        'proposta_id',
        'linha_credito_id',
        'linha_credito_nome',
        'valor_proposta',
        'percentual_financiavel',
        'valor_financiado',
        'percentual_ater',
        'valor_ater',
        'valor_projeto',
        'taxa_juros_anual',
        'prazo_total_anos',
        'carencia_anos',
        'numero_parcelas',
        'periodicidade',
        'juros_carencia',
        'garantias_confirmadas',
        'cronograma_confirmado',
        'status',
        'fluxo_revisado_em',
        'concluido_em',
        'criado_em',
        'atualizado_em'
      ]
    );


  financiamentosSheet
    .getRange('E:E')
    .setNumberFormat(
      'R$ #,##0.00'
    );


  financiamentosSheet
    .getRange('F:F')
    .setNumberFormat(
      '0.00"%"'
    );


  financiamentosSheet
    .getRange('G:G')
    .setNumberFormat(
      'R$ #,##0.00'
    );


  financiamentosSheet
    .getRange('H:H')
    .setNumberFormat(
      '0.00"%"'
    );


  financiamentosSheet
    .getRange('I:J')
    .setNumberFormat(
      'R$ #,##0.00'
    );


  financiamentosSheet
    .getRange('K:K')
    .setNumberFormat(
      '0.000"%"'
    );


  /* =========================================================
     V0.10 - GARANTIAS
     ========================================================= */

  const garantiasSheet =
    criarAbaSeNecessario_(
      spreadsheet,
      SHEET_FINANCIAMENTO_GARANTIAS,
      [
        'id',
        'proposta_id',
        'tipo',
        'descricao',
        'garantidor_nome',
        'garantidor_cpf',
        'garantidor_telefone',
        'valor_estimado',
        'criado_em',
        'atualizado_em'
      ]
    );


  garantiasSheet
    .getRange('F:F')
    .setNumberFormat('@');


  garantiasSheet
    .getRange('H:H')
    .setNumberFormat(
      'R$ #,##0.00'
    );


  return {
    sucesso: true,
    mensagem:
      'FUNDERR v0.10 configurado com sucesso.'
  };
}