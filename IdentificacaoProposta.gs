function categoriasEmprego_() {
  return {
    ADMINISTRATIVA:
      'Administrativa',

    TECNICA:
      'Técnica',

    PRODUTIVA:
      'Produtiva',

    OUTROS:
      'Outros'
  };
}


function categoriasUso_() {
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
      'Semoventes'
  };
}


function categoriasFonte_() {
  return {
    RECURSOS_PROPRIOS:
      'Recursos próprios',

    DIVIDAS_AGROPECUARIAS:
      'Dívidas agropecuárias',

    FINANCIAMENTO:
      'Financiamento pretendido',

    OUTROS:
      'Outros'
  };
}


function valorNaoNegativo_(
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


function valorMonetarioOpcional_(
  valor,
  nomeCampo
) {
  if (
    valor === null ||
    valor === undefined ||
    String(valor).trim() === ''
  ) {
    return '';
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


  return arredondarMoeda_(
    numero
  );
}


/* =========================================================
   ESTADO PRINCIPAL
   ========================================================= */

function localizarIdentificacaoProposta_(
  propostaId
) {
  const sheet =
    getSheet_(
      SHEET_PROPOSTA_IDENTIFICACOES
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
        14
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


function garantirIdentificacaoProposta_(
  propostaId
) {
  const existente =
    localizarIdentificacaoProposta_(
      propostaId
    );


  if (existente) {
    return existente;
  }


  const sheet =
    getSheet_(
      SHEET_PROPOSTA_IDENTIFICACOES
    );


  const agora =
    new Date();


  const id =
    Utilities.getUuid();


  const row = [
    id,
    propostaId,
    '',
    '',
    '',
    '',
    '',
    false,
    false,
    'RASCUNHO',
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


function montarIdentificacaoProposta_(
  localizado
) {
  if (!localizado) {
    return {
      id: '',
      finalidade: '',
      mercado: '',
      faturamentoUltimoAno: '',
      analiseLocalizacao: '',
      consideracoes: '',
      empregosConfirmados: false,
      usosFontesConfirmados: false,
      status: 'PENDENTE',
      patrimonioRevisadoEm: '',
      patrimonioRevisadoTimestamp: 0,
      concluidoEm: '',
      criadoEm: '',
      atualizadoEm: ''
    };
  }


  const row =
    localizado.row;


  const patrimonioRevisado =
    row[10];


  return {
    id:
      String(
        row[0] || ''
      ),

    finalidade:
      String(
        row[2] || ''
      ),

    mercado:
      String(
        row[3] || ''
      ),

    faturamentoUltimoAno:
      row[4] === ''
        ? ''
        : Number(
            row[4]
          ),

    analiseLocalizacao:
      String(
        row[5] || ''
      ),

    consideracoes:
      String(
        row[6] || ''
      ),

    empregosConfirmados:
      row[7] === true ||
      String(
        row[7]
      ).toUpperCase() ===
      'TRUE',

    usosFontesConfirmados:
      row[8] === true ||
      String(
        row[8]
      ).toUpperCase() ===
      'TRUE',

    status:
      String(
        row[9] ||
        'RASCUNHO'
      ),

    patrimonioRevisadoEm:
      formatarDataHora_(
        patrimonioRevisado
      ),

    patrimonioRevisadoTimestamp:
      patrimonioRevisado instanceof Date
        ? patrimonioRevisado.getTime()
        : 0,

    concluidoEm:
      formatarDataHora_(
        row[11]
      ),

    criadoEm:
      formatarDataHora_(
        row[12]
      ),

    atualizadoEm:
      formatarDataHora_(
        row[13]
      )
  };
}


/* =========================================================
   DEPENDÊNCIA DO PATRIMÔNIO
   ========================================================= */

function obterTimestampAtualPatrimonio_(
  propostaId
) {
  const localizado =
    localizarLevantamentoPatrimonio_(
      propostaId
    );


  if (
    !localizado
  ) {
    return 0;
  }


  const valor =
    localizado.row[6];


  return valor instanceof Date
    ? valor.getTime()
    : 0;
}


function obterStatusEfetivoIdentificacao_(
  identificacao,
  patrimonioEstado,
  propostaId
) {
  if (
    identificacao.status !==
    'CONCLUIDO'
  ) {
    return identificacao.status;
  }


  if (
    !patrimonioEstado.completo
  ) {
    return 'EM_REVISAO';
  }


  const patrimonioAtual =
    obterTimestampAtualPatrimonio_(
      propostaId
    );


  if (
    patrimonioAtual >
    identificacao
      .patrimonioRevisadoTimestamp
  ) {
    return 'EM_REVISAO';
  }


  return 'CONCLUIDO';
}


/* =========================================================
   EMPREGOS
   ========================================================= */

function listarEmpregosProposta_(
  propostaId
) {
  const categorias =
    categoriasEmprego_();


  const resultado =
    Object.entries(
      categorias
    )
      .map(
        (
          [
            categoria,
            nome
          ]
        ) => ({
          categoria,
          nome,
          faseAtual: 0,
          faseExpansao: 0,
          total: 0
        })
      );


  const sheet =
    getSheet_(
      SHEET_PROPOSTA_EMPREGOS
    );


  const lastRow =
    sheet.getLastRow();


  if (
    lastRow < 2
  ) {
    return resultado;
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


  rows
    .filter(
      row =>
        String(
          row[1] || ''
        ) ===
        String(
          propostaId
        )
    )
    .forEach(
      row => {
        const item =
          resultado.find(
            registro =>
              registro.categoria ===
              String(
                row[2] || ''
              )
          );


        if (!item) {
          return;
        }


        item.faseAtual =
          Number(
            row[3] || 0
          );


        item.faseExpansao =
          Number(
            row[4] || 0
          );


        item.total =
          Number(
            row[5] || 0
          );
      }
    );


  return resultado;
}


function salvarEmpregosProposta_(
  propostaId,
  empregos
) {
  const sheet =
    getSheet_(
      SHEET_PROPOSTA_EMPREGOS
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


  const recebidos = {};


  if (
    Array.isArray(
      empregos
    )
  ) {
    empregos.forEach(
      item => {
        recebidos[
          String(
            item.categoria || ''
          )
        ] = item;
      }
    );
  }


  const agora =
    new Date();


  Object.keys(
    categoriasEmprego_()
  ).forEach(
    categoria => {
      const item =
        recebidos[
          categoria
        ] || {};


      const faseAtual =
        valorNaoNegativo_(
          item.faseAtual,
          'Fase atual'
        );


      const faseExpansao =
        valorNaoNegativo_(
          item.faseExpansao,
          'Fase de expansão'
        );


      if (
        !Number.isInteger(
          faseAtual
        ) ||
        !Number.isInteger(
          faseExpansao
        )
      ) {
        throw new Error(
          'A quantidade de empregos deve ser um número inteiro.'
        );
      }


      const total =
        faseAtual +
        faseExpansao;


      const index =
        rows.findIndex(
          row =>
            String(
              row[1] || ''
            ) ===
              propostaId &&
            String(
              row[2] || ''
            ) ===
              categoria
        );


      if (
        index >= 0
      ) {
        sheet
          .getRange(
            index + 2,
            1,
            1,
            8
          )
          .setValues([
            [
              rows[index][0],
              propostaId,
              categoria,
              faseAtual,
              faseExpansao,
              total,
              rows[index][6] ||
                agora,
              agora
            ]
          ]);

      } else {
        sheet.appendRow([
          Utilities.getUuid(),
          propostaId,
          categoria,
          faseAtual,
          faseExpansao,
          total,
          agora,
          agora
        ]);
      }
    }
  );
}


/* =========================================================
   USOS E FONTES
   ========================================================= */

function listarRegistrosUsosFontes_(
  propostaId
) {
  const sheet =
    getSheet_(
      SHEET_PROPOSTA_USOS_FONTES
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
      7
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

        tipo:
          String(
            row[2] || ''
          ),

        categoria:
          String(
            row[3] || ''
          ),

        valor:
          Number(
            row[4] || 0
          )
      })
    );
}


function salvarValorUsoFonte_(
  propostaId,
  tipo,
  categoria,
  valor,
  rows
) {
  const sheet =
    getSheet_(
      SHEET_PROPOSTA_USOS_FONTES
    );


  const agora =
    new Date();


  const index =
    rows.findIndex(
      row =>
        String(
          row[1] || ''
        ) ===
          propostaId &&
        String(
          row[2] || ''
        ) ===
          tipo &&
        String(
          row[3] || ''
        ) ===
          categoria
    );


  if (
    index >= 0
  ) {
    sheet
      .getRange(
        index + 2,
        1,
        1,
        7
      )
      .setValues([
        [
          rows[index][0],
          propostaId,
          tipo,
          categoria,
          valor,
          rows[index][5] ||
            agora,
          agora
        ]
      ]);

  } else {
    sheet.appendRow([
      Utilities.getUuid(),
      propostaId,
      tipo,
      categoria,
      valor,
      agora,
      agora
    ]);
  }
}


function salvarUsosFontesProposta_(
  propostaId,
  usos,
  fontes
) {
  const sheet =
    getSheet_(
      SHEET_PROPOSTA_USOS_FONTES
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
            7
          )
          .getValues()
      : [];


  const usosRecebidos = {};


  if (
    Array.isArray(
      usos
    )
  ) {
    usos.forEach(
      item => {
        usosRecebidos[
          String(
            item.categoria || ''
          )
        ] = item;
      }
    );
  }


  Object.keys(
    categoriasUso_()
  ).forEach(
    categoria => {
      const item =
        usosRecebidos[
          categoria
        ] || {};


      const valor =
        arredondarMoeda_(
          valorNaoNegativo_(
            item.aRealizar,
            'Valor a realizar'
          )
        );


      salvarValorUsoFonte_(
        propostaId,
        'USO',
        categoria,
        valor,
        rows
      );
    }
  );


  const fontesRecebidas = {};


  if (
    Array.isArray(
      fontes
    )
  ) {
    fontes.forEach(
      item => {
        fontesRecebidas[
          String(
            item.categoria || ''
          )
        ] = item;
      }
    );
  }


  [
    'RECURSOS_PROPRIOS',
    'FINANCIAMENTO',
    'OUTROS'
  ].forEach(
    categoria => {
      const item =
        fontesRecebidas[
          categoria
        ] || {};


      const valor =
        arredondarMoeda_(
          valorNaoNegativo_(
            item.valor,
            'Valor da fonte'
          )
        );


      salvarValorUsoFonte_(
        propostaId,
        'FONTE',
        categoria,
        valor,
        rows
      );
    }
  );
}


function obterUsosFontesProposta_(
  propostaId
) {
  const registros =
    listarRegistrosUsosFontes_(
      propostaId
    );


  const itensPatrimonio =
    listarItensPatrimonio_(
      propostaId
    );


  const dividasPatrimonio =
    listarDividasPatrimonio_(
      propostaId
    );


  const resumoPatrimonio =
    calcularResumoPatrimonio_(
      itensPatrimonio,
      dividasPatrimonio
    );


  const usos =
    Object.entries(
      categoriasUso_()
    )
      .map(
        (
          [
            categoria,
            nome
          ]
        ) => {
          const registro =
            registros.find(
              item =>
                item.tipo ===
                  'USO' &&
                item.categoria ===
                  categoria
            );


          const realizado =
            Number(
              resumoPatrimonio
                .totaisCategoria[
                  categoria
                ] || 0
            );


          const aRealizar =
            Number(
              registro?.valor ||
              0
            );


          return {
            categoria,
            nome,

            realizado:
              arredondarMoeda_(
                realizado
              ),

            aRealizar:
              arredondarMoeda_(
                aRealizar
              ),

            total:
              arredondarMoeda_(
                realizado +
                aRealizar
              )
          };
        }
      );


  const fontes =
    Object.entries(
      categoriasFonte_()
    )
      .map(
        (
          [
            categoria,
            nome
          ]
        ) => {
          if (
            categoria ===
            'DIVIDAS_AGROPECUARIAS'
          ) {
            return {
              categoria,
              nome,
              derivado: true,
              valor:
                resumoPatrimonio
                  .totalDividas
            };
          }


          const registro =
            registros.find(
              item =>
                item.tipo ===
                  'FONTE' &&
                item.categoria ===
                  categoria
            );


          return {
            categoria,
            nome,
            derivado: false,
            valor:
              Number(
                registro?.valor ||
                0
              )
          };
        }
      );


  const totalUsos =
    arredondarMoeda_(
      usos.reduce(
        (
          total,
          item
        ) =>
          total +
          item.total,
        0
      )
    );


  const totalFontes =
    arredondarMoeda_(
      fontes.reduce(
        (
          total,
          item
        ) =>
          total +
          Number(
            item.valor ||
            0
          ),
        0
      )
    );


  const diferenca =
    arredondarMoeda_(
      totalFontes -
      totalUsos
    );


  return {
    usos,
    fontes,

    totalUsos,

    totalFontes,

    diferenca,

    equilibrado:
      Math.abs(
        diferenca
      ) < 0.01
  };
}


/* =========================================================
   COMPLETUDE
   ========================================================= */

function analisarCompletudeIdentificacao_(
  identificacao,
  patrimonioEstado,
  statusEfetivo
) {
  const requisitos = [
    [
      'Concluir o levantamento patrimonial',
      patrimonioEstado.completo
    ],

    [
      'Informar a finalidade',
      Boolean(
        identificacao.finalidade
      )
    ],

    [
      'Informar o mercado',
      Boolean(
        identificacao.mercado
      )
    ],

    [
      'Informar o faturamento do último ano',
      identificacao
        .faturamentoUltimoAno !== ''
    ],

    [
      'Preencher a análise da localização',
      Boolean(
        identificacao
          .analiseLocalizacao
      )
    ],

    [
      'Confirmar os dados de empregos',
      identificacao
        .empregosConfirmados
    ],

    [
      'Confirmar os usos e fontes',
      identificacao
        .usosFontesConfirmados
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
    faltantes.length === 0;


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

function obterEstadoIdentificacaoResumo_(
  propostaId
) {
  const localizado =
    localizarIdentificacaoProposta_(
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


  const identificacao =
    montarIdentificacaoProposta_(
      localizado
    );


  const patrimonioEstado =
    obterEstadoPatrimonioResumo_(
      propostaId
    );


  const statusEfetivo =
    obterStatusEfetivoIdentificacao_(
      identificacao,
      patrimonioEstado,
      propostaId
    );


  const completude =
    analisarCompletudeIdentificacao_(
      identificacao,
      patrimonioEstado,
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
   SALVAR
   ========================================================= */

function salvarIdentificacaoProposta(
  dados
) {
  if (!dados) {
    throw new Error(
      'Dados não informados.'
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


  const finalidade =
    String(
      dados.finalidade || ''
    ).trim();


  const mercado =
    String(
      dados.mercado || ''
    ).trim();


  const faturamento =
    valorMonetarioOpcional_(
      dados.faturamentoUltimoAno,
      'Faturamento do último ano'
    );


  const analiseLocalizacao =
    String(
      dados.analiseLocalizacao ||
      ''
    ).trim();


  const consideracoes =
    String(
      dados.consideracoes || ''
    ).trim();


  const empregosConfirmados =
    dados.empregosConfirmados ===
    true;


  const usosFontesConfirmados =
    dados.usosFontesConfirmados ===
    true;


  const lock =
    LockService
      .getScriptLock();


  lock.waitLock(
    10000
  );


  try {
    const localizado =
      garantirIdentificacaoProposta_(
        propostaId
      );


    const atual =
      montarIdentificacaoProposta_(
        localizado
      );


    const agora =
      new Date();


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
        SHEET_PROPOSTA_IDENTIFICACOES
      );


    sheet
      .getRange(
        localizado.linha,
        1,
        1,
        14
      )
      .setValues([
        [
          localizado.row[0],
          propostaId,
          finalidade,
          mercado,
          faturamento,
          analiseLocalizacao,
          consideracoes,
          empregosConfirmados,
          usosFontesConfirmados,
          novoStatus,
          localizado.row[10] ||
            '',
          localizado.row[11] ||
            '',
          localizado.row[12] ||
            agora,
          agora
        ]
      ]);


    salvarEmpregosProposta_(
      propostaId,
      dados.empregos
    );


    salvarUsosFontesProposta_(
      propostaId,
      dados.usos,
      dados.fontes
    );

  } finally {
    lock.releaseLock();
  }


  return obterIdentificacaoProposta(
    propostaId
  );
}


/* =========================================================
   CONCLUIR
   ========================================================= */

function concluirIdentificacaoProposta(
  propostaId
) {
  propostaId =
    String(
      propostaId || ''
    ).trim();


  const dados =
    obterIdentificacaoProposta(
      propostaId
    );


  if (
    !dados.completude
      .prontoParaConcluir
  ) {
    throw new Error(
      'A identificação ainda possui pendências: ' +
      dados.completude
        .camposFaltantes
        .join('; ') +
      '.'
    );
  }


  const localizado =
    localizarIdentificacaoProposta_(
      propostaId
    );


  if (!localizado) {
    throw new Error(
      'Salve a identificação antes de concluí-la.'
    );
  }


  const patrimonioTimestamp =
    obterTimestampAtualPatrimonio_(
      propostaId
    );


  if (!patrimonioTimestamp) {
    throw new Error(
      'O levantamento patrimonial precisa estar concluído.'
    );
  }


  const agora =
    new Date();


  const sheet =
    getSheet_(
      SHEET_PROPOSTA_IDENTIFICACOES
    );


  sheet
    .getRange(
      localizado.linha,
      10,
      1,
      5
    )
    .setValues([
      [
        'CONCLUIDO',
        new Date(
          patrimonioTimestamp
        ),
        agora,
        localizado.row[12] ||
          agora,
        agora
      ]
    ]);


  return obterIdentificacaoProposta(
    propostaId
  );
}


/* =========================================================
   VISÃO COMPLETA
   ========================================================= */

function obterIdentificacaoProposta(
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
    localizarIdentificacaoProposta_(
      propostaId
    );


  const identificacao =
    montarIdentificacaoProposta_(
      localizado
    );


  const patrimonioEstado =
    obterEstadoPatrimonioResumo_(
      propostaId
    );


  const statusEfetivo =
    obterStatusEfetivoIdentificacao_(
      identificacao,
      patrimonioEstado,
      propostaId
    );


  identificacao.status =
    statusEfetivo;


  const empregos =
    listarEmpregosProposta_(
      propostaId
    );


  const usosFontes =
    obterUsosFontesProposta_(
      propostaId
    );


  const completude =
    analisarCompletudeIdentificacao_(
      identificacao,
      patrimonioEstado,
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

    identificacao,

    patrimonioEstado,

    empregos,

    usos:
      usosFontes.usos,

    fontes:
      usosFontes.fontes,

    resumoUsosFontes: {
      totalUsos:
        usosFontes.totalUsos,

      totalFontes:
        usosFontes.totalFontes,

      diferenca:
        usosFontes.diferenca,

      equilibrado:
        usosFontes.equilibrado
    },

    completude
  };
}