function tiposFluxoCaixa_() {
  return {
    RECEITA:
      'Receitas',

    CUSTO_VARIAVEL:
      'Custos variáveis',

    CUSTO_FIXO:
      'Custos fixos'
  };
}


function normalizarTipoFluxoCaixa_(
  tipo
) {
  const valor =
    String(
      tipo || ''
    ).trim();


  if (
    !Object.prototype.hasOwnProperty.call(
      tiposFluxoCaixa_(),
      valor
    )
  ) {
    throw new Error(
      'Tipo de item do fluxo de caixa inválido.'
    );
  }


  return valor;
}


function normalizarUnidadeFluxoCaixa_(
  codigo,
  outro
) {
  const unidades = {
    KG:
      'kg',

    TON:
      't',

    L:
      'L',

    SC:
      'saca',

    CX:
      'caixa',

    ARROBA:
      '@',

    UN:
      'un',

    CABECA:
      'cabeça',

    HA:
      'ha'
  };


  const valor =
    String(
      codigo || ''
    ).trim();


  if (
    valor ===
    'OUTRO'
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
    return unidades[
      valor
    ];
  }


  if (valor) {
    return valor;
  }


  throw new Error(
    'Informe a unidade.'
  );
}


function numeroFluxoNaoNegativo_(
  valor,
  nomeCampo
) {
  if (
    valor === null ||
    valor === undefined ||
    String(valor).trim() === ''
  ) {
    return 0;
  }


  const numero =
    converterNumero_(
      valor
    );


  if (
    numero < 0
  ) {
    throw new Error(
      `${nomeCampo} não pode ser negativo.`
    );
  }


  return numero;
}


/* =========================================================
   ESTADO DO FLUXO
   ========================================================= */

function localizarFluxoCaixa_(
  propostaId
) {
  const sheet =
    getSheet_(
      SHEET_FLUXO_CAIXA
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
        8
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


function garantirFluxoCaixa_(
  propostaId
) {
  const existente =
    localizarFluxoCaixa_(
      propostaId
    );


  if (existente) {
    return existente;
  }


  const sheet =
    getSheet_(
      SHEET_FLUXO_CAIXA
    );


  const agora =
    new Date();


  const row = [
    Utilities.getUuid(),
    propostaId,
    'RASCUNHO',
    false,
    '',
    '',
    agora,
    agora
  ];


  sheet.appendRow(
    row
  );


  return {
    linha:
      sheet.getLastRow(),

    row
  };
}


function montarFluxoCaixa_(
  localizado
) {
  if (!localizado) {
    return {
      id: '',
      status: 'PENDENTE',
      projecaoConfirmada: false,
      identificacaoRevisadaEm: '',
      identificacaoRevisadaTimestamp: 0,
      concluidoEm: '',
      criadoEm: '',
      atualizadoEm: ''
    };
  }


  const row =
    localizado.row;


  const identificacaoRevisada =
    row[4];


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

    projecaoConfirmada:
      row[3] === true ||
      String(
        row[3]
      ).toUpperCase() ===
      'TRUE',

    identificacaoRevisadaEm:
      formatarDataHora_(
        identificacaoRevisada
      ),

    identificacaoRevisadaTimestamp:
      identificacaoRevisada instanceof Date
        ? identificacaoRevisada.getTime()
        : 0,

    concluidoEm:
      formatarDataHora_(
        row[5]
      ),

    criadoEm:
      formatarDataHora_(
        row[6]
      ),

    atualizadoEm:
      formatarDataHora_(
        row[7]
      )
  };
}


function marcarFluxoCaixaAlterado_(
  propostaId
) {
  const localizado =
    garantirFluxoCaixa_(
      propostaId
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


  const sheet =
    getSheet_(
      SHEET_FLUXO_CAIXA
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
      8
    )
    .setValue(
      new Date()
    );
}


/* =========================================================
   DEPENDÊNCIA DA IDENTIFICAÇÃO
   ========================================================= */

function obterTimestampAtualIdentificacao_(
  propostaId
) {
  const localizado =
    localizarIdentificacaoProposta_(
      propostaId
    );


  if (!localizado) {
    return 0;
  }


  const valor =
    localizado.row[13];


  return valor instanceof Date
    ? valor.getTime()
    : 0;
}


function obterStatusEfetivoFluxoCaixa_(
  fluxo,
  identificacaoEstado,
  propostaId
) {
  if (
    fluxo.status !==
    'CONCLUIDO'
  ) {
    return fluxo.status;
  }


  if (
    !identificacaoEstado.completo
  ) {
    return 'EM_REVISAO';
  }


  const identificacaoAtual =
    obterTimestampAtualIdentificacao_(
      propostaId
    );


  if (
    identificacaoAtual >
    fluxo
      .identificacaoRevisadaTimestamp
  ) {
    return 'EM_REVISAO';
  }


  return 'CONCLUIDO';
}


/* =========================================================
   ITENS
   ========================================================= */

function listarItensFluxoCaixa_(
  propostaId
) {
  const sheet =
    getSheet_(
      SHEET_FLUXO_CAIXA_ITENS
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
      16
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
      row => {
        const anos = [
          Number(
            row[7] || 0
          ),
          Number(
            row[8] || 0
          ),
          Number(
            row[9] || 0
          ),
          Number(
            row[10] || 0
          ),
          Number(
            row[11] || 0
          ),
          Number(
            row[12] || 0
          ),
          Number(
            row[13] || 0
          )
        ];


        return {
          id:
            String(
              row[0] || ''
            ),

          propostaId:
            String(
              row[1] || ''
            ),

          tipo:
            String(
              row[2] || ''
            ),

          tipoNome:
            tiposFluxoCaixa_()[
              String(
                row[2] || ''
              )
            ] || '',

          descricao:
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

          anos,

          totalPeriodo:
            arredondarMoeda_(
              anos.reduce(
                (
                  total,
                  valor
                ) =>
                  total +
                  valor,
                0
              )
            ),

          criadoEm:
            formatarDataHora_(
              row[14]
            ),

          atualizadoEm:
            formatarDataHora_(
              row[15]
            )
        };
      }
    );
}


function salvarItemFluxoCaixa(
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


  buscarProposta(
    propostaId
  );


  const id =
    String(
      dados.id || ''
    ).trim();


  const tipo =
    normalizarTipoFluxoCaixa_(
      dados.tipo
    );


  const descricao =
    String(
      dados.descricao || ''
    ).trim();


  if (
    descricao.length < 2
  ) {
    throw new Error(
      'Informe a descrição do item.'
    );
  }


  const unidade =
    normalizarUnidadeFluxoCaixa_(
      dados.unidade,
      dados.unidadeOutro
    );


  const quantidade =
    numeroFluxoNaoNegativo_(
      dados.quantidade,
      'Quantidade'
    );


  const valorUnitario =
    numeroFluxoNaoNegativo_(
      dados.valorUnitario,
      'Valor unitário'
    );


  if (
    quantidade <= 0
  ) {
    throw new Error(
      'A quantidade deve ser maior que zero.'
    );
  }


  if (
    valorUnitario <= 0
  ) {
    throw new Error(
      'O valor unitário deve ser maior que zero.'
    );
  }


  /*
   * Regra recuperada do legado:
   * Ano 1 = quantidade × valor unitário.
   */
  const ano1 =
    arredondarMoeda_(
      quantidade *
      valorUnitario
    );


  const anos = [
    ano1,

    arredondarMoeda_(
      numeroFluxoNaoNegativo_(
        dados.ano2,
        'Ano 2'
      )
    ),

    arredondarMoeda_(
      numeroFluxoNaoNegativo_(
        dados.ano3,
        'Ano 3'
      )
    ),

    arredondarMoeda_(
      numeroFluxoNaoNegativo_(
        dados.ano4,
        'Ano 4'
      )
    ),

    arredondarMoeda_(
      numeroFluxoNaoNegativo_(
        dados.ano5,
        'Ano 5'
      )
    ),

    arredondarMoeda_(
      numeroFluxoNaoNegativo_(
        dados.ano6,
        'Ano 6'
      )
    ),

    arredondarMoeda_(
      numeroFluxoNaoNegativo_(
        dados.ano7,
        'Ano 7'
      )
    )
  ];


  const lock =
    LockService
      .getScriptLock();


  lock.waitLock(
    10000
  );


  try {
    garantirFluxoCaixa_(
      propostaId
    );


    const sheet =
      getSheet_(
        SHEET_FLUXO_CAIXA_ITENS
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
              16
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
          'Item do fluxo de caixa não encontrado.'
        );
      }


      if (
        String(
          rows[index][1] || ''
        ) !==
        propostaId
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
          16
        )
        .setValues([
          [
            id,
            propostaId,
            tipo,
            descricao,
            unidade,
            quantidade,
            valorUnitario,
            ...anos,
            rows[index][14] ||
              agora,
            agora
          ]
        ]);

    } else {
      sheet.appendRow([
        Utilities.getUuid(),
        propostaId,
        tipo,
        descricao,
        unidade,
        quantidade,
        valorUnitario,
        ...anos,
        agora,
        agora
      ]);
    }


    marcarFluxoCaixaAlterado_(
      propostaId
    );

  } finally {
    lock.releaseLock();
  }


  return obterFluxoCaixa(
    propostaId
  );
}


function excluirItemFluxoCaixa(
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
        SHEET_FLUXO_CAIXA_ITENS
      );


    const lastRow =
      sheet.getLastRow();


    if (
      lastRow < 2
    ) {
      throw new Error(
        'Item não encontrado.'
      );
    }


    const rows =
      sheet
        .getRange(
          2,
          1,
          lastRow - 1,
          16
        )
        .getValues();


    const index =
      rows.findIndex(
        row =>
          String(
            row[0] || ''
          ) ===
            itemId &&
          String(
            row[1] || ''
          ) ===
            propostaId
      );


    if (
      index < 0
    ) {
      throw new Error(
        'Item não encontrado.'
      );
    }


    sheet.deleteRow(
      index + 2
    );


    marcarFluxoCaixaAlterado_(
      propostaId
    );

  } finally {
    lock.releaseLock();
  }


  return obterFluxoCaixa(
    propostaId
  );
}


/* =========================================================
   RESUMO FINANCEIRO
   ========================================================= */

function calcularResumoFluxoCaixa_(
  itens
) {
  const receitas =
    Array(7).fill(0);

  const custosVariaveis =
    Array(7).fill(0);

  const custosFixos =
    Array(7).fill(0);


  itens.forEach(
    item => {
      let destino;


      if (
        item.tipo ===
        'RECEITA'
      ) {
        destino =
          receitas;

      } else if (
        item.tipo ===
        'CUSTO_VARIAVEL'
      ) {
        destino =
          custosVariaveis;

      } else if (
        item.tipo ===
        'CUSTO_FIXO'
      ) {
        destino =
          custosFixos;

      } else {
        return;
      }


      item.anos.forEach(
        (
          valor,
          index
        ) => {
          destino[index] =
            arredondarMoeda_(
              destino[index] +
              Number(
                valor || 0
              )
            );
        }
      );
    }
  );


  const despesas =
    Array(7).fill(0);

  const resultado =
    Array(7).fill(0);

  const acumulado =
    Array(7).fill(0);


  for (
    let i = 0;
    i < 7;
    i++
  ) {
    despesas[i] =
      arredondarMoeda_(
        custosVariaveis[i] +
        custosFixos[i]
      );


    resultado[i] =
      arredondarMoeda_(
        receitas[i] -
        despesas[i]
      );


    acumulado[i] =
      arredondarMoeda_(
        resultado[i] +
        (
          i > 0
            ? acumulado[
                i - 1
              ]
            : 0
        )
      );
  }


  function somar_(
    valores
  ) {
    return arredondarMoeda_(
      valores.reduce(
        (
          total,
          valor
        ) =>
          total +
          valor,
        0
      )
    );
  }


  return {
    receitas,
    custosVariaveis,
    custosFixos,
    despesas,
    resultado,
    acumulado,

    totais: {
      receitas:
        somar_(
          receitas
        ),

      custosVariaveis:
        somar_(
          custosVariaveis
        ),

      custosFixos:
        somar_(
          custosFixos
        ),

      despesas:
        somar_(
          despesas
        ),

      resultado:
        somar_(
          resultado
        ),

      resultadoAcumuladoFinal:
        acumulado[6]
    }
  };
}


/* =========================================================
   COMPLETUDE
   ========================================================= */

function analisarCompletudeFluxoCaixa_(
  fluxo,
  itens,
  identificacaoEstado,
  statusEfetivo
) {
  const possuiReceita =
    itens.some(
      item =>
        item.tipo ===
        'RECEITA'
    );


  const possuiCusto =
    itens.some(
      item =>
        item.tipo ===
          'CUSTO_VARIAVEL' ||
        item.tipo ===
          'CUSTO_FIXO'
    );


  const requisitos = [
    [
      'Concluir a identificação da proposta',
      identificacaoEstado.completo
    ],

    [
      'Informar pelo menos uma receita',
      possuiReceita
    ],

    [
      'Informar pelo menos um custo',
      possuiCusto
    ],

    [
      'Confirmar a projeção do fluxo de caixa',
      fluxo.projecaoConfirmada
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


  const percentual =
    Math.round(
      preenchidos /
      requisitos.length *
      100
    );


  const pronto =
    faltantes.length ===
    0;


  return {
    completo:
      pronto &&
      statusEfetivo ===
      'CONCLUIDO',

    prontoParaConcluir:
      pronto,

    percentual,

    camposFaltantes:
      faltantes
  };
}


/* =========================================================
   RESUMO PARA PROCESSOS
   ========================================================= */

function obterEstadoFluxoCaixaResumo_(
  propostaId
) {
  const localizado =
    localizarFluxoCaixa_(
      propostaId
    );


  if (!localizado) {
    return {
      status:
        'PENDENTE',

      completo:
        false,

      percentual:
        0,

      camposFaltantes:
        []
    };
  }


  const fluxo =
    montarFluxoCaixa_(
      localizado
    );


  const itens =
    listarItensFluxoCaixa_(
      propostaId
    );


  const identificacaoEstado =
    obterEstadoIdentificacaoResumo_(
      propostaId
    );


  const statusEfetivo =
    obterStatusEfetivoFluxoCaixa_(
      fluxo,
      identificacaoEstado,
      propostaId
    );


  const completude =
    analisarCompletudeFluxoCaixa_(
      fluxo,
      itens,
      identificacaoEstado,
      statusEfetivo
    );


  return {
    status:
      statusEfetivo,

    completo:
      completude.completo,

    percentual:
      completude.percentual,

    camposFaltantes:
      completude.camposFaltantes
  };
}


/* =========================================================
   RASCUNHO
   ========================================================= */

function salvarRascunhoFluxoCaixa(
  propostaId,
  projecaoConfirmada
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
      garantirFluxoCaixa_(
        propostaId
      );


    const atual =
      montarFluxoCaixa_(
        localizado
      );


    const novoStatus =
      atual.status ===
      'CONCLUIDO'
        ? 'EM_REVISAO'
        : (
            atual.status ===
            'PENDENTE'
              ? 'RASCUNHO'
              : atual.status
          );


    const sheet =
      getSheet_(
        SHEET_FLUXO_CAIXA
      );


    sheet
      .getRange(
        localizado.linha,
        3,
        1,
        6
      )
      .setValues([
        [
          novoStatus,
          Boolean(
            projecaoConfirmada
          ),
          localizado.row[4] ||
            '',
          localizado.row[5] ||
            '',
          localizado.row[6] ||
            new Date(),
          new Date()
        ]
      ]);

  } finally {
    lock.releaseLock();
  }


  return obterFluxoCaixa(
    propostaId
  );
}


/* =========================================================
   CONCLUSÃO
   ========================================================= */

function concluirFluxoCaixa(
  propostaId
) {
  propostaId =
    String(
      propostaId || ''
    ).trim();


  const dados =
    obterFluxoCaixa(
      propostaId
    );


  if (
    !dados.completude
      .prontoParaConcluir
  ) {
    throw new Error(
      'O fluxo de caixa ainda possui pendências: ' +
      dados.completude
        .camposFaltantes
        .join('; ') +
      '.'
    );
  }


  const identificadoEm =
    obterTimestampAtualIdentificacao_(
      propostaId
    );


  if (!identificadoEm) {
    throw new Error(
      'A identificação da proposta precisa estar concluída.'
    );
  }


  const localizado =
    garantirFluxoCaixa_(
      propostaId
    );


  const agora =
    new Date();


  const sheet =
    getSheet_(
      SHEET_FLUXO_CAIXA
    );


  sheet
    .getRange(
      localizado.linha,
      3,
      1,
      6
    )
    .setValues([
      [
        'CONCLUIDO',
        true,
        new Date(
          identificadoEm
        ),
        agora,
        localizado.row[6] ||
          agora,
        agora
      ]
    ]);


  return obterFluxoCaixa(
    propostaId
  );
}


/* =========================================================
   VISÃO COMPLETA
   ========================================================= */

function obterFluxoCaixa(
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
    localizarFluxoCaixa_(
      propostaId
    );


  const fluxo =
    montarFluxoCaixa_(
      localizado
    );


  const itens =
    listarItensFluxoCaixa_(
      propostaId
    );


  const identificacaoEstado =
    obterEstadoIdentificacaoResumo_(
      propostaId
    );


  const statusEfetivo =
    obterStatusEfetivoFluxoCaixa_(
      fluxo,
      identificacaoEstado,
      propostaId
    );


  fluxo.status =
    statusEfetivo;


  const resumo =
    calcularResumoFluxoCaixa_(
      itens
    );


  const completude =
    analisarCompletudeFluxoCaixa_(
      fluxo,
      itens,
      identificacaoEstado,
      statusEfetivo
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

    fluxo,

    identificacaoEstado,

    itens,

    resumo,

    completude,

    tipos:
      tiposFluxoCaixa_()
  };
}