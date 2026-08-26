function categoriasPatrimonio_() {
  return {
    TERRA_COBERTURAS:
      'Terra e coberturas',

    CONSTRUCOES_CIVIS:
      'Construções civis',

    ESTRUTURA_AGROPECUARIA:
      'Estrutura agropecuária',

    INFRAESTRUTURA:
      'Infraestrutura',

    MAQUINAS_EQUIPAMENTOS:
      'Máquinas, veículos e equipamentos',

    SEMOVENTES:
      'Semoventes',

    OUTROS_BENS_URBANOS:
      'Outros bens urbanos'
  };
}


function normalizarCategoriaPatrimonio_(
  categoria
) {
  const valor =
    String(
      categoria || ''
    ).trim();


  if (
    !Object.prototype.hasOwnProperty.call(
      categoriasPatrimonio_(),
      valor
    )
  ) {
    throw new Error(
      'Categoria patrimonial inválida.'
    );
  }


  return valor;
}


function normalizarUnidadePatrimonio_(
  codigo,
  outro
) {
  const unidades = {
    HA:
      'ha',

    M2:
      'm²',

    M:
      'm',

    KM:
      'km',

    UN:
      'un',

    CABECA:
      'cabeça'
  };


  const valor =
    String(
      codigo || ''
    ).trim();


  if (
    valor === 'OUTRO'
  ) {
    const descricao =
      String(
        outro || ''
      ).trim();


    if (!descricao) {
      throw new Error(
        'Informe a unidade.'
      );
    }


    return descricao;
  }


  if (
    unidades[valor]
  ) {
    return unidades[valor];
  }


  if (valor) {
    /*
     * Compatibilidade futura ou
     * com eventual dado legado.
     */
    return valor;
  }


  throw new Error(
    'Informe a unidade.'
  );
}


function arredondarMoeda_(
  valor
) {
  return Math.round(
    (
      Number(valor) +
      Number.EPSILON
    ) *
    100
  ) / 100;
}


/* =========================================================
   LEVANTAMENTO
   ========================================================= */

function localizarLevantamentoPatrimonio_(
  propostaId
) {
  const sheet =
    getSheet_(
      SHEET_PATRIMONIO_LEVANTAMENTOS
    );


  const lastRow =
    sheet.getLastRow();


  if (
    lastRow < 2
  ) {
    return null;
  }


  const rows =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        7
      )
      .getValues();


  const index =
    rows.findIndex(
      row =>
        String(
          row[1] || ''
        ) ===
        String(
          propostaId
        )
    );


  if (
    index < 0
  ) {
    return null;
  }


  return {
    linha:
      index + 2,

    row:
      rows[index]
  };
}


function garantirLevantamentoPatrimonio_(
  propostaId
) {
  const existente =
    localizarLevantamentoPatrimonio_(
      propostaId
    );


  if (existente) {
    return existente;
  }


  const sheet =
    getSheet_(
      SHEET_PATRIMONIO_LEVANTAMENTOS
    );


  const agora =
    new Date();


  const id =
    Utilities.getUuid();


  sheet.appendRow([
    id,
    propostaId,
    'RASCUNHO',
    false,
    '',
    agora,
    agora
  ]);


  return {
    linha:
      sheet.getLastRow(),

    row: [
      id,
      propostaId,
      'RASCUNHO',
      false,
      '',
      agora,
      agora
    ]
  };
}


function montarLevantamentoPatrimonio_(
  localizado
) {
  if (!localizado) {
    return {
      id: '',
      status: 'PENDENTE',
      dividasConfirmadas: false,
      concluidoEm: '',
      criadoEm: '',
      atualizadoEm: ''
    };
  }


  const row =
    localizado.row;


  return {
    id:
      String(
        row[0] || ''
      ),

    status:
      String(
        row[2] ||
        'RASCUNHO'
      ),

    dividasConfirmadas:
      row[3] === true ||
      String(
        row[3]
      ).toUpperCase() ===
      'TRUE',

    concluidoEm:
      formatarDataHora_(
        row[4]
      ),

    criadoEm:
      formatarDataHora_(
        row[5]
      ),

    atualizadoEm:
      formatarDataHora_(
        row[6]
      )
  };
}


function marcarLevantamentoAlterado_(
  propostaId
) {
  const localizado =
    garantirLevantamentoPatrimonio_(
      propostaId
    );


  const row =
    localizado.row;


  const statusAtual =
    String(
      row[2] ||
      'RASCUNHO'
    );


  const novoStatus =
    statusAtual ===
    'CONCLUIDO'
      ? 'EM_REVISAO'
      : statusAtual;


  const sheet =
    getSheet_(
      SHEET_PATRIMONIO_LEVANTAMENTOS
    );


  sheet
    .getRange(
      localizado.linha,
      3
    )
    .setValue(
      novoStatus
    );


  sheet
    .getRange(
      localizado.linha,
      7
    )
    .setValue(
      new Date()
    );
}


/* =========================================================
   ITENS
   ========================================================= */

function listarItensPatrimonio_(
  propostaId
) {
  const sheet =
    getSheet_(
      SHEET_PATRIMONIO_ITENS
    );


  const lastRow =
    sheet.getLastRow();


  if (
    lastRow < 2
  ) {
    return [];
  }


  return sheet
    .getRange(
      2,
      1,
      lastRow - 1,
      10
    )
    .getValues()
    .filter(
      row =>
        String(
          row[1] || ''
        ) ===
        String(
          propostaId
        )
    )
    .map(
      row => ({
        id:
          String(
            row[0] || ''
          ),

        propostaId:
          String(
            row[1] || ''
          ),

        categoria:
          String(
            row[2] || ''
          ),

        categoriaNome:
          categoriasPatrimonio_()[
            String(
              row[2] || ''
            )
          ] || '',

        especificacao:
          String(
            row[3] || ''
          ),

        unidade:
          String(
            row[4] || ''
          ),

        quantidade:
          Number(
            row[5] || 0
          ),

        valorUnitario:
          Number(
            row[6] || 0
          ),

        valorTotal:
          Number(
            row[7] || 0
          ),

        criadoEm:
          formatarDataHora_(
            row[8]
          ),

        atualizadoEm:
          formatarDataHora_(
            row[9]
          )
      })
    )
    .sort(
      (a, b) => {

        const categoria =
          a.categoria.localeCompare(
            b.categoria
          );


        if (categoria !== 0) {
          return categoria;
        }


        return a.especificacao
          .localeCompare(
            b.especificacao,
            'pt-BR'
          );
      }
    );
}


function salvarItemPatrimonio(
  dados
) {
  if (!dados) {
    throw new Error(
      'Dados do item não informados.'
    );
  }


  const propostaId =
    String(
      dados.propostaId || ''
    ).trim();


  if (!propostaId) {
    throw new Error(
      'Processo não informado.'
    );
  }


  /*
   * Também valida se o processo existe.
   */
  buscarProposta(
    propostaId
  );


  const id =
    String(
      dados.id || ''
    ).trim();


  const categoria =
    normalizarCategoriaPatrimonio_(
      dados.categoria
    );


  const especificacao =
    String(
      dados.especificacao || ''
    ).trim();


  if (
    especificacao.length < 2
  ) {
    throw new Error(
      'Informe a especificação do bem.'
    );
  }


  const unidade =
    normalizarUnidadePatrimonio_(
      dados.unidade,
      dados.unidadeOutro
    );


  const quantidade =
    converterNumero_(
      dados.quantidade
    );


  const valorUnitario =
    converterNumero_(
      dados.valorUnitario
    );


  if (
    quantidade === '' ||
    quantidade <= 0
  ) {
    throw new Error(
      'A quantidade deve ser maior que zero.'
    );
  }


  if (
    valorUnitario === '' ||
    valorUnitario <= 0
  ) {
    throw new Error(
      'O valor unitário deve ser maior que zero.'
    );
  }


  const valorTotal =
    arredondarMoeda_(
      quantidade *
      valorUnitario
    );


  const lock =
    LockService
      .getScriptLock();


  lock.waitLock(
    10000
  );


  try {
    garantirLevantamentoPatrimonio_(
      propostaId
    );


    const sheet =
      getSheet_(
        SHEET_PATRIMONIO_ITENS
      );


    const lastRow =
      sheet.getLastRow();


    const rows =
      lastRow >= 2
        ? sheet
            .getRange(
              2,
              1,
              lastRow - 1,
              10
            )
            .getValues()
        : [];


    const agora =
      new Date();


    if (id) {
      const index =
        rows.findIndex(
          row =>
            String(
              row[0] || ''
            ) === id
        );


      if (
        index < 0
      ) {
        throw new Error(
          'Item patrimonial não encontrado.'
        );
      }


      if (
        String(
          rows[index][1] || ''
        ) !== propostaId
      ) {
        throw new Error(
          'O item não pertence a este processo.'
        );
      }


      sheet
        .getRange(
          index + 2,
          1,
          1,
          10
        )
        .setValues([
          [
            id,
            propostaId,
            categoria,
            especificacao,
            unidade,
            quantidade,
            valorUnitario,
            valorTotal,
            rows[index][8] ||
              agora,
            agora
          ]
        ]);

    } else {
      sheet.appendRow([
        Utilities.getUuid(),
        propostaId,
        categoria,
        especificacao,
        unidade,
        quantidade,
        valorUnitario,
        valorTotal,
        agora,
        agora
      ]);
    }


    marcarLevantamentoAlterado_(
      propostaId
    );

  } finally {
    lock.releaseLock();
  }


  return obterPatrimonio(
    propostaId
  );
}


function excluirItemPatrimonio(
  propostaId,
  itemId
) {
  propostaId =
    String(
      propostaId || ''
    ).trim();


  itemId =
    String(
      itemId || ''
    ).trim();


  if (
    !propostaId ||
    !itemId
  ) {
    throw new Error(
      'Item não informado.'
    );
  }


  const lock =
    LockService
      .getScriptLock();


  lock.waitLock(
    10000
  );


  try {
    const sheet =
      getSheet_(
        SHEET_PATRIMONIO_ITENS
      );


    const lastRow =
      sheet.getLastRow();


    if (
      lastRow < 2
    ) {
      throw new Error(
        'Item patrimonial não encontrado.'
      );
    }


    const rows =
      sheet
        .getRange(
          2,
          1,
          lastRow - 1,
          10
        )
        .getValues();


    const index =
      rows.findIndex(
        row =>
          String(
            row[0] || ''
          ) === itemId &&
          String(
            row[1] || ''
          ) === propostaId
      );


    if (
      index < 0
    ) {
      throw new Error(
        'Item patrimonial não encontrado.'
      );
    }


    sheet.deleteRow(
      index + 2
    );


    marcarLevantamentoAlterado_(
      propostaId
    );

  } finally {
    lock.releaseLock();
  }


  return obterPatrimonio(
    propostaId
  );
}


/* =========================================================
   DÍVIDAS
   ========================================================= */

function listarDividasPatrimonio_(
  propostaId
) {
  const sheet =
    getSheet_(
      SHEET_PATRIMONIO_DIVIDAS
    );


  const lastRow =
    sheet.getLastRow();


  if (
    lastRow < 2
  ) {
    return [];
  }


  return sheet
    .getRange(
      2,
      1,
      lastRow - 1,
      8
    )
    .getValues()
    .filter(
      row =>
        String(
          row[1] || ''
        ) ===
        String(
          propostaId
        )
    )
    .map(
      row => ({
        id:
          String(
            row[0] || ''
          ),

        propostaId:
          String(
            row[1] || ''
          ),

        credor:
          String(
            row[2] || ''
          ),

        finalidade:
          String(
            row[3] || ''
          ),

        vencimento:
          formatarDataHtml_(
            row[4]
          ),

        vencimentoFormatado:
          formatarData_(
            row[4]
          ),

        saldoDevedor:
          Number(
            row[5] || 0
          ),

        criadoEm:
          formatarDataHora_(
            row[6]
          ),

        atualizadoEm:
          formatarDataHora_(
            row[7]
          )
      })
    );
}


function salvarDividaPatrimonio(
  dados
) {
  if (!dados) {
    throw new Error(
      'Dados da dívida não informados.'
    );
  }


  const propostaId =
    String(
      dados.propostaId || ''
    ).trim();


  if (!propostaId) {
    throw new Error(
      'Processo não informado.'
    );
  }


  buscarProposta(
    propostaId
  );


  const id =
    String(
      dados.id || ''
    ).trim();


  const credor =
    String(
      dados.credor || ''
    ).trim();


  const finalidade =
    String(
      dados.finalidade || ''
    ).trim();


  const vencimento =
    dados.vencimento
      ? converterDataHtml_(
          dados.vencimento
        )
      : null;


  const saldoDevedor =
    converterNumero_(
      dados.saldoDevedor
    );


  if (!credor) {
    throw new Error(
      'Informe o credor.'
    );
  }


  if (!finalidade) {
    throw new Error(
      'Informe a finalidade da dívida.'
    );
  }


  if (!vencimento) {
    throw new Error(
      'Informe o vencimento da dívida.'
    );
  }


  if (
    saldoDevedor === '' ||
    saldoDevedor <= 0
  ) {
    throw new Error(
      'O saldo devedor deve ser maior que zero.'
    );
  }


  const lock =
    LockService
      .getScriptLock();


  lock.waitLock(
    10000
  );


  try {
    garantirLevantamentoPatrimonio_(
      propostaId
    );


    const sheet =
      getSheet_(
        SHEET_PATRIMONIO_DIVIDAS
      );


    const lastRow =
      sheet.getLastRow();


    const rows =
      lastRow >= 2
        ? sheet
            .getRange(
              2,
              1,
              lastRow - 1,
              8
            )
            .getValues()
        : [];


    const agora =
      new Date();


    if (id) {
      const index =
        rows.findIndex(
          row =>
            String(
              row[0] || ''
            ) === id
        );


      if (
        index < 0
      ) {
        throw new Error(
          'Dívida não encontrada.'
        );
      }


      if (
        String(
          rows[index][1] || ''
        ) !== propostaId
      ) {
        throw new Error(
          'A dívida não pertence a este processo.'
        );
      }


      sheet
        .getRange(
          index + 2,
          1,
          1,
          8
        )
        .setValues([
          [
            id,
            propostaId,
            credor,
            finalidade,
            vencimento,
            saldoDevedor,
            rows[index][6] ||
              agora,
            agora
          ]
        ]);

    } else {
      sheet.appendRow([
        Utilities.getUuid(),
        propostaId,
        credor,
        finalidade,
        vencimento,
        saldoDevedor,
        agora,
        agora
      ]);
    }


    marcarLevantamentoAlterado_(
      propostaId
    );

  } finally {
    lock.releaseLock();
  }


  return obterPatrimonio(
    propostaId
  );
}


function excluirDividaPatrimonio(
  propostaId,
  dividaId
) {
  propostaId =
    String(
      propostaId || ''
    ).trim();


  dividaId =
    String(
      dividaId || ''
    ).trim();


  const lock =
    LockService
      .getScriptLock();


  lock.waitLock(
    10000
  );


  try {
    const sheet =
      getSheet_(
        SHEET_PATRIMONIO_DIVIDAS
      );


    const lastRow =
      sheet.getLastRow();


    if (
      lastRow < 2
    ) {
      throw new Error(
        'Dívida não encontrada.'
      );
    }


    const rows =
      sheet
        .getRange(
          2,
          1,
          lastRow - 1,
          8
        )
        .getValues();


    const index =
      rows.findIndex(
        row =>
          String(
            row[0] || ''
          ) === dividaId &&
          String(
            row[1] || ''
          ) === propostaId
      );


    if (
      index < 0
    ) {
      throw new Error(
        'Dívida não encontrada.'
      );
    }


    sheet.deleteRow(
      index + 2
    );


    marcarLevantamentoAlterado_(
      propostaId
    );

  } finally {
    lock.releaseLock();
  }


  return obterPatrimonio(
    propostaId
  );
}


/* =========================================================
   CÁLCULOS
   ========================================================= */

function calcularResumoPatrimonio_(
  itens,
  dividas
) {
  const totaisCategoria = {};


  Object.keys(
    categoriasPatrimonio_()
  ).forEach(
    categoria => {
      totaisCategoria[
        categoria
      ] = 0;
    }
  );


  itens.forEach(
    item => {
      totaisCategoria[
        item.categoria
      ] =
        arredondarMoeda_(
          (
            totaisCategoria[
              item.categoria
            ] || 0
          ) +
          item.valorTotal
        );
    }
  );


  const categoriasAgropecuarias = [
    'TERRA_COBERTURAS',
    'CONSTRUCOES_CIVIS',
    'ESTRUTURA_AGROPECUARIA',
    'INFRAESTRUTURA',
    'MAQUINAS_EQUIPAMENTOS',
    'SEMOVENTES'
  ];


  const patrimonioBruto =
    arredondarMoeda_(
      categoriasAgropecuarias
        .reduce(
          (
            total,
            categoria
          ) =>
            total +
            (
              totaisCategoria[
                categoria
              ] || 0
            ),
          0
        )
    );


  const outrosBensUrbanos =
    arredondarMoeda_(
      totaisCategoria[
        'OUTROS_BENS_URBANOS'
      ] || 0
    );


  const totalDividas =
    arredondarMoeda_(
      dividas.reduce(
        (
          total,
          divida
        ) =>
          total +
          Number(
            divida.saldoDevedor ||
            0
          ),
        0
      )
    );


  const patrimonioLiquido =
    arredondarMoeda_(
      patrimonioBruto -
      totalDividas
    );


  return {
    totaisCategoria,

    patrimonioBruto,

    outrosBensUrbanos,

    totalDividas,

    patrimonioLiquido,

    patrimonioTotalInformado:
      arredondarMoeda_(
        patrimonioBruto +
        outrosBensUrbanos
      )
  };
}


/* =========================================================
   COMPLETUDE / STATUS
   ========================================================= */

function analisarCompletudePatrimonio_(
  levantamento,
  itens
) {
  const requisitos = [
    [
      'Informe pelo menos um item patrimonial',
      itens.length > 0
    ],

    [
      'Confirme a situação das dívidas agropecuárias',
      levantamento.dividasConfirmadas
    ]
  ];


  const faltantes =
    requisitos
      .filter(
        item =>
          !item[1]
      )
      .map(
        item =>
          item[0]
      );


  const preenchidos =
    requisitos.length -
    faltantes.length;


  return {
    completo:
      faltantes.length === 0 &&
      levantamento.status ===
      'CONCLUIDO',

    prontoParaConcluir:
      faltantes.length === 0,

    percentual:
      Math.round(
        preenchidos /
        requisitos.length *
        100
      ),

    camposFaltantes:
      faltantes
  };
}


function obterEstadoPatrimonioResumo_(
  propostaId
) {
  const localizado =
    localizarLevantamentoPatrimonio_(
      propostaId
    );


  const levantamento =
    montarLevantamentoPatrimonio_(
      localizado
    );


  const itens =
    listarItensPatrimonio_(
      propostaId
    );


  const completude =
    analisarCompletudePatrimonio_(
      levantamento,
      itens
    );


  return {
    status:
      levantamento.status,

    completo:
      levantamento.status ===
      'CONCLUIDO',

    percentual:
      completude.percentual,

    camposFaltantes:
      completude.camposFaltantes
  };
}


/* =========================================================
   SALVAR RASCUNHO
   ========================================================= */

function salvarRascunhoPatrimonio(
  propostaId,
  dividasConfirmadas
) {
  propostaId =
    String(
      propostaId || ''
    ).trim();


  buscarProposta(
    propostaId
  );


  const lock =
    LockService
      .getScriptLock();


  lock.waitLock(
    10000
  );


  try {
    const localizado =
      garantirLevantamentoPatrimonio_(
        propostaId
      );


    const sheet =
      getSheet_(
        SHEET_PATRIMONIO_LEVANTAMENTOS
      );


    const statusAtual =
      String(
        localizado.row[2] ||
        'RASCUNHO'
      );


    const novoStatus =
      statusAtual ===
      'CONCLUIDO'
        ? 'EM_REVISAO'
        : statusAtual;


    sheet
      .getRange(
        localizado.linha,
        3,
        1,
        5
      )
      .setValues([
        [
          novoStatus,
          Boolean(
            dividasConfirmadas
          ),
          localizado.row[4] ||
            '',
          localizado.row[5] ||
            new Date(),
          new Date()
        ]
      ]);

  } finally {
    lock.releaseLock();
  }


  return obterPatrimonio(
    propostaId
  );
}


/* =========================================================
   CONCLUIR
   ========================================================= */

function concluirLevantamentoPatrimonio(
  propostaId
) {
  propostaId =
    String(
      propostaId || ''
    ).trim();


  buscarProposta(
    propostaId
  );


  const localizado =
    garantirLevantamentoPatrimonio_(
      propostaId
    );


  const levantamento =
    montarLevantamentoPatrimonio_(
      localizado
    );


  const itens =
    listarItensPatrimonio_(
      propostaId
    );


  const completude =
    analisarCompletudePatrimonio_(
      levantamento,
      itens
    );


  if (
    !completude.prontoParaConcluir
  ) {
    throw new Error(
      'O levantamento ainda possui pendências: ' +
      completude.camposFaltantes.join(
        '; '
      ) +
      '.'
    );
  }


  const agora =
    new Date();


  const sheet =
    getSheet_(
      SHEET_PATRIMONIO_LEVANTAMENTOS
    );


  sheet
    .getRange(
      localizado.linha,
      3,
      1,
      5
    )
    .setValues([
      [
        'CONCLUIDO',
        true,
        agora,
        localizado.row[5] ||
          agora,
        agora
      ]
    ]);


  return obterPatrimonio(
    propostaId
  );
}


/* =========================================================
   VISÃO COMPLETA
   ========================================================= */

function obterPatrimonio(
  propostaId
) {
  propostaId =
    String(
      propostaId || ''
    ).trim();


  if (!propostaId) {
    throw new Error(
      'Processo não informado.'
    );
  }


  const processo =
    buscarProposta(
      propostaId
    );


  const localizado =
    localizarLevantamentoPatrimonio_(
      propostaId
    );


  const levantamento =
    montarLevantamentoPatrimonio_(
      localizado
    );


  const itens =
    listarItensPatrimonio_(
      propostaId
    );


  const dividas =
    listarDividasPatrimonio_(
      propostaId
    );


  const resumo =
    calcularResumoPatrimonio_(
      itens,
      dividas
    );


  const completude =
    analisarCompletudePatrimonio_(
      levantamento,
      itens
    );


  return {
    processo: {
      id:
        processo.id,

      numero:
        processo.numero,

      beneficiarioNome:
        processo.beneficiarioNome,

      beneficiarioCpf:
        processo.beneficiarioCpf,

      propriedadeNome:
        processo.propriedadeNome,

      propriedadeMunicipio:
        processo.propriedadeMunicipio,

      atividade:
        processo.atividade
    },

    levantamento,

    itens,

    dividas,

    resumo,

    completude,

    categorias:
      categoriasPatrimonio_()
  };
}