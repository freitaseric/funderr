function normalizarJurosCarencia_(
  valor
) {
  const permitido = [
    'PAGAR',
    'CAPITALIZAR'
  ];


  const resultado =
    String(
      valor || ''
    )
      .trim()
      .toUpperCase();


  if (
    !permitido.includes(
      resultado
    )
  ) {
    throw new Error(
      'Tratamento dos juros durante a carência inválido.'
    );
  }


  return resultado;
}


function valorFinanceiroNaoNegativo_(
  valor,
  nome
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
      `${nome} não pode ser negativo.`
    );
  }


  return numero;
}


function percentualFinanciamento_(
  valor,
  nome,
  limite = 100
) {
  const numero =
    valorFinanceiroNaoNegativo_(
      valor,
      nome
    );


  if (
    numero > limite
  ) {
    throw new Error(
      `${nome} não pode ser maior que ${limite}%.`
    );
  }


  return numero;
}


/* =========================================================
   REGISTRO PRINCIPAL
   ========================================================= */

function localizarFinanciamento_(
  propostaId
) {
  const sheet =
    getSheet_(
      SHEET_FINANCIAMENTOS
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
        23
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


function montarFinanciamento_(
  localizado
) {
  if (!localizado) {
    return {
      id: '',
      linhaCreditoId: '',
      linhaCreditoNome:
        'Parâmetros manuais',
      valorProposta: '',
      percentualFinanciavel: '',
      valorFinanciado: 0,
      percentualAter: '',
      valorAter: 0,
      valorProjeto: 0,
      taxaJurosAnual: '',
      prazoTotalAnos: '',
      carenciaAnos: 0,
      numeroParcelas: 0,
      periodicidade: 'ANUAL',
      jurosCarencia: 'PAGAR',
      garantiasConfirmadas: false,
      cronogramaConfirmado: false,
      status: 'PENDENTE',
      fluxoRevisadoEm: '',
      fluxoRevisadoTimestamp: 0,
      concluidoEm: '',
      criadoEm: '',
      atualizadoEm: ''
    };
  }


  const row =
    localizado.row;


  const fluxoRevisado =
    row[19];


  return {
    id:
      String(
        row[0] || ''
      ),

    linhaCreditoId:
      String(
        row[2] || ''
      ),

    linhaCreditoNome:
      String(
        row[3] ||
        'Parâmetros manuais'
      ),

    valorProposta:
      Number(
        row[4] || 0
      ),

    percentualFinanciavel:
      Number(
        row[5] || 0
      ),

    valorFinanciado:
      Number(
        row[6] || 0
      ),

    percentualAter:
      Number(
        row[7] || 0
      ),

    valorAter:
      Number(
        row[8] || 0
      ),

    valorProjeto:
      Number(
        row[9] || 0
      ),

    taxaJurosAnual:
      Number(
        row[10] || 0
      ),

    prazoTotalAnos:
      Number(
        row[11] || 0
      ),

    carenciaAnos:
      Number(
        row[12] || 0
      ),

    numeroParcelas:
      Number(
        row[13] || 0
      ),

    periodicidade:
      String(
        row[14] ||
        'ANUAL'
      ),

    jurosCarencia:
      String(
        row[15] ||
        'PAGAR'
      ),

    garantiasConfirmadas:
      row[16] === true ||
      String(
        row[16]
      ).toUpperCase() ===
      'TRUE',

    cronogramaConfirmado:
      row[17] === true ||
      String(
        row[17]
      ).toUpperCase() ===
      'TRUE',

    status:
      String(
        row[18] ||
        'RASCUNHO'
      ),

    fluxoRevisadoEm:
      formatarDataHora_(
        fluxoRevisado
      ),

    fluxoRevisadoTimestamp:
      fluxoRevisado instanceof Date
        ? fluxoRevisado.getTime()
        : 0,

    concluidoEm:
      formatarDataHora_(
        row[20]
      ),

    criadoEm:
      formatarDataHora_(
        row[21]
      ),

    atualizadoEm:
      formatarDataHora_(
        row[22]
      )
  };
}


/* =========================================================
   DEPENDÊNCIA DO FLUXO
   ========================================================= */

function obterTimestampAtualFluxoCaixa_(
  propostaId
) {
  const localizado =
    localizarFluxoCaixa_(
      propostaId
    );


  if (!localizado) {
    return 0;
  }


  const valor =
    localizado.row[7];


  return valor instanceof Date
    ? valor.getTime()
    : 0;
}


function obterStatusEfetivoFinanciamento_(
  financiamento,
  fluxoEstado,
  propostaId
) {
  if (
    financiamento.status !==
    'CONCLUIDO'
  ) {
    return financiamento.status;
  }


  if (
    !fluxoEstado.completo
  ) {
    return 'EM_REVISAO';
  }


  const fluxoAtual =
    obterTimestampAtualFluxoCaixa_(
      propostaId
    );


  if (
    fluxoAtual >
    financiamento
      .fluxoRevisadoTimestamp
  ) {
    return 'EM_REVISAO';
  }


  return 'CONCLUIDO';
}


/* =========================================================
   GARANTIAS
   ========================================================= */

function tiposGarantiaFinanciamento_() {
  return {
    AVAL_PESSOAL:
      'Aval / garantia pessoal',

    BEM:
      'Bem oferecido em garantia',

    OUTRA:
      'Outra garantia'
  };
}


function listarGarantiasFinanciamento_(
  propostaId
) {
  const sheet =
    getSheet_(
      SHEET_FINANCIAMENTO_GARANTIAS
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

        tipo:
          String(
            row[2] || ''
          ),

        tipoNome:
          tiposGarantiaFinanciamento_()[
            String(
              row[2] || ''
            )
          ] || '',

        descricao:
          String(
            row[3] || ''
          ),

        garantidorNome:
          String(
            row[4] || ''
          ),

        garantidorCpf:
          String(
            row[5] || ''
          ),

        garantidorTelefone:
          String(
            row[6] || ''
          ),

        valorEstimado:
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
    );
}


function invalidarGarantiasFinanciamento_(
  propostaId
) {
  const localizado =
    localizarFinanciamento_(
      propostaId
    );


  if (!localizado) {
    return;
  }


  const status =
    String(
      localizado.row[18] ||
      'RASCUNHO'
    );


  const novoStatus =
    status ===
    'CONCLUIDO'
      ? 'EM_REVISAO'
      : status;


  const sheet =
    getSheet_(
      SHEET_FINANCIAMENTOS
    );


  sheet
    .getRange(
      localizado.linha,
      17
    )
    .setValue(
      false
    );


  sheet
    .getRange(
      localizado.linha,
      19
    )
    .setValue(
      novoStatus
    );


  sheet
    .getRange(
      localizado.linha,
      23
    )
    .setValue(
      new Date()
    );
}


function salvarGarantiaFinanciamento(
  dados
) {
  if (!dados) {
    throw new Error(
      'Dados da garantia não informados.'
    );
  }


  const propostaId =
    String(
      dados.propostaId || ''
    ).trim();


  buscarProposta(
    propostaId
  );


  const id =
    String(
      dados.id || ''
    ).trim();


  const tipo =
    String(
      dados.tipo || ''
    ).trim();


  if (
    !Object.prototype
      .hasOwnProperty.call(
        tiposGarantiaFinanciamento_(),
        tipo
      )
  ) {
    throw new Error(
      'Selecione o tipo da garantia.'
    );
  }


  const descricao =
    String(
      dados.descricao || ''
    ).trim();


  if (!descricao) {
    throw new Error(
      'Informe a descrição da garantia.'
    );
  }


  const garantidorNome =
    String(
      dados.garantidorNome || ''
    ).trim();


  let garantidorCpf =
    String(
      dados.garantidorCpf || ''
    ).trim();


  let garantidorTelefone =
    String(
      dados.garantidorTelefone || ''
    ).trim();


  if (
    tipo ===
    'AVAL_PESSOAL'
  ) {
    if (!garantidorNome) {
      throw new Error(
        'Informe o nome do avalista.'
      );
    }


    garantidorCpf =
      validarCpf_(
        garantidorCpf
      );


    garantidorTelefone =
      garantidorTelefone
        ? normalizarTelefone_(
            garantidorTelefone
          )
        : '';

  } else {
    garantidorCpf =
      garantidorCpf
        ? validarCpf_(
            garantidorCpf
          )
        : '';


    garantidorTelefone =
      garantidorTelefone
        ? normalizarTelefone_(
            garantidorTelefone
          )
        : '';
  }


  const valorEstimado =
    arredondarMoeda_(
      valorFinanceiroNaoNegativo_(
        dados.valorEstimado,
        'Valor estimado'
      )
    );


  const lock =
    LockService
      .getScriptLock();


  lock.waitLock(
    10000
  );


  try {
    const sheet =
      getSheet_(
        SHEET_FINANCIAMENTO_GARANTIAS
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
          'Garantia não encontrada.'
        );
      }


      if (
        String(
          rows[index][1] || ''
        ) !==
        propostaId
      ) {
        throw new Error(
          'A garantia não pertence a este processo.'
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
            tipo,
            descricao,
            garantidorNome,
            garantidorCpf,
            garantidorTelefone,
            valorEstimado,
            rows[index][8] ||
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
        garantidorNome,
        garantidorCpf,
        garantidorTelefone,
        valorEstimado,
        agora,
        agora
      ]);
    }


    invalidarGarantiasFinanciamento_(
      propostaId
    );

  } finally {
    lock.releaseLock();
  }


  return obterFinanciamento(
    propostaId
  );
}


function excluirGarantiaFinanciamento(
  propostaId,
  garantiaId
) {
  propostaId =
    String(
      propostaId || ''
    ).trim();


  garantiaId =
    String(
      garantiaId || ''
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
        SHEET_FINANCIAMENTO_GARANTIAS
      );


    const lastRow =
      sheet.getLastRow();


    if (
      lastRow < 2
    ) {
      throw new Error(
        'Garantia não encontrada.'
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
          ) ===
            garantiaId &&
          String(
            row[1] || ''
          ) ===
            propostaId
      );


    if (
      index < 0
    ) {
      throw new Error(
        'Garantia não encontrada.'
      );
    }


    sheet.deleteRow(
      index + 2
    );


    invalidarGarantiasFinanciamento_(
      propostaId
    );

  } finally {
    lock.releaseLock();
  }


  return obterFinanciamento(
    propostaId
  );
}


/* =========================================================
   CÁLCULO
   ========================================================= */

function calcularValoresFinanciamento_(
  valorProposta,
  percentualFinanciavel,
  percentualAter
) {
  const valorFinanciado =
    arredondarMoeda_(
      valorProposta *
      percentualFinanciavel /
      100
    );


  const valorAter =
    arredondarMoeda_(
      valorProposta *
      percentualAter /
      100
    );


  const valorProjeto =
    arredondarMoeda_(
      valorFinanciado +
      valorAter
    );


  return {
    valorFinanciado,
    valorAter,
    valorProjeto
  };
}


function calcularCronogramaFinanciamento_(
  financiamento,
  resultadoFluxo
) {
  const prazo =
    Number(
      financiamento
        .prazoTotalAnos ||
      0
    );


  const carencia =
    Number(
      financiamento
        .carenciaAnos ||
      0
    );


  const parcelas =
    prazo -
    carencia;


  if (
    prazo <= 0 ||
    parcelas <= 0
  ) {
    return {
      parcelas: [],
      totalJuros: 0,
      totalAmortizacao: 0,
      totalPrestacoes: 0,
      anosCapacidadeInsuficiente: 0
    };
  }


  const taxa =
    Number(
      financiamento
        .taxaJurosAnual ||
      0
    ) / 100;


  const jurosCarencia =
    financiamento
      .jurosCarencia;


  let saldo =
    arredondarMoeda_(
      financiamento
        .valorProjeto
    );


  let saldoBaseAmortizacao =
    saldo;


  if (
    jurosCarencia ===
    'CAPITALIZAR'
  ) {
    for (
      let ano = 1;
      ano <= carencia;
      ano++
    ) {
      const juros =
        arredondarMoeda_(
          saldoBaseAmortizacao *
          taxa
        );


      saldoBaseAmortizacao =
        arredondarMoeda_(
          saldoBaseAmortizacao +
          juros
        );
    }
  }


  const amortizacaoConstante =
    arredondarMoeda_(
      saldoBaseAmortizacao /
      parcelas
    );


  const cronograma = [];


  let totalJuros =
    0;

  let totalAmortizacao =
    0;

  let totalPrestacoes =
    0;

  let insuficientes =
    0;


  for (
    let ano = 1;
    ano <= prazo;
    ano++
  ) {
    const saldoInicial =
      arredondarMoeda_(
        saldo
      );


    const juros =
      arredondarMoeda_(
        saldoInicial *
        taxa
      );


    let amortizacao =
      0;

    let prestacao =
      0;

    let saldoFinal =
      saldoInicial;


    if (
      ano <= carencia
    ) {
      if (
        jurosCarencia ===
        'PAGAR'
      ) {
        prestacao =
          juros;

      } else {
        saldoFinal =
          arredondarMoeda_(
            saldoInicial +
            juros
          );
      }

    } else {
      const ultima =
        ano === prazo;


      amortizacao =
        ultima
          ? saldoInicial
          : Math.min(
              amortizacaoConstante,
              saldoInicial
            );


      amortizacao =
        arredondarMoeda_(
          amortizacao
        );


      prestacao =
        arredondarMoeda_(
          amortizacao +
          juros
        );


      saldoFinal =
        arredondarMoeda_(
          saldoInicial -
          amortizacao
        );


      if (
        Math.abs(
          saldoFinal
        ) < 0.01
      ) {
        saldoFinal = 0;
      }
    }


    const resultadoOperacional =
      Number(
        resultadoFluxo[
          ano - 1
        ] || 0
      );


    const saldoAposDivida =
      arredondarMoeda_(
        resultadoOperacional -
        prestacao
      );


    const capacidadeSuficiente =
      saldoAposDivida >= 0;


    if (
      !capacidadeSuficiente
    ) {
      insuficientes++;
    }


    cronograma.push({
      ano,
      saldoInicial,
      amortizacao,
      juros,
      prestacao,
      saldoFinal,
      resultadoOperacional,
      saldoAposDivida,
      capacidadeSuficiente
    });


    totalJuros =
      arredondarMoeda_(
        totalJuros +
        juros
      );


    totalAmortizacao =
      arredondarMoeda_(
        totalAmortizacao +
        amortizacao
      );


    totalPrestacoes =
      arredondarMoeda_(
        totalPrestacoes +
        prestacao
      );


    saldo =
      saldoFinal;
  }


  return {
    parcelas:
      cronograma,

    totalJuros,

    totalAmortizacao,

    totalPrestacoes,

    anosCapacidadeInsuficiente:
      insuficientes
  };
}


/* =========================================================
   VALIDAÇÃO CONTRA LINHA
   ========================================================= */

function validarContraLinhaCredito_(
  financiamento,
  linha
) {
  if (!linha) {
    return;
  }


  if (
    linha.tetoFinanciamento > 0 &&
    financiamento.valorFinanciado >
    linha.tetoFinanciamento
  ) {
    throw new Error(
      'O valor financiado ultrapassa o teto configurado para a linha de crédito.'
    );
  }


  if (
    linha.prazoMaxAnos > 0 &&
    financiamento.prazoTotalAnos >
    linha.prazoMaxAnos
  ) {
    throw new Error(
      'O prazo informado ultrapassa o máximo configurado para a linha.'
    );
  }


  if (
    linha.carenciaMaxAnos >= 0 &&
    linha.carenciaMaxAnos > 0 &&
    financiamento.carenciaAnos >
    linha.carenciaMaxAnos
  ) {
    throw new Error(
      'A carência informada ultrapassa o máximo configurado para a linha.'
    );
  }


  if (
    linha.percentualFinanciavelMax > 0 &&
    financiamento.percentualFinanciavel >
    linha.percentualFinanciavelMax
  ) {
    throw new Error(
      'O percentual financiável ultrapassa o limite configurado para a linha.'
    );
  }
}


/* =========================================================
   SALVAR CONDIÇÕES
   ========================================================= */

function salvarFinanciamento(
  dados
) {
  if (!dados) {
    throw new Error(
      'Dados do financiamento não informados.'
    );
  }


  const propostaId =
    String(
      dados.propostaId || ''
    ).trim();


  buscarProposta(
    propostaId
  );


  const linhaCreditoId =
    String(
      dados.linhaCreditoId || ''
    ).trim();


  const linha =
    linhaCreditoId
      ? buscarLinhaCreditoPorId_(
          linhaCreditoId
        )
      : null;


  if (
    linhaCreditoId &&
    !linha
  ) {
    throw new Error(
      'Linha de crédito não encontrada.'
    );
  }


  const valorProposta =
    arredondarMoeda_(
      valorFinanceiroNaoNegativo_(
        dados.valorProposta,
        'Valor da proposta'
      )
    );


  if (
    valorProposta <= 0
  ) {
    throw new Error(
      'O valor da proposta deve ser maior que zero.'
    );
  }


  const percentualFinanciavel =
    percentualFinanciamento_(
      dados.percentualFinanciavel,
      'Percentual financiável'
    );


  if (
    percentualFinanciavel <= 0
  ) {
    throw new Error(
      'O percentual financiável deve ser maior que zero.'
    );
  }


  const percentualAter =
    percentualFinanciamento_(
      dados.percentualAter,
      'Percentual de ATER'
    );


  const taxaJurosAnual =
    percentualFinanciamento_(
      dados.taxaJurosAnual,
      'Taxa anual de juros',
      1000
    );


  const prazoTotalAnos =
    Number(
      converterInteiroNaoNegativo_(
        dados.prazoTotalAnos
      )
    );


  const carenciaAnos =
    Number(
      converterInteiroNaoNegativo_(
        dados.carenciaAnos
      )
    );


  if (
    prazoTotalAnos < 1 ||
    prazoTotalAnos > 7
  ) {
    throw new Error(
      'Nesta versão, o prazo total deve estar entre 1 e 7 anos.'
    );
  }


  if (
    carenciaAnos >=
    prazoTotalAnos
  ) {
    throw new Error(
      'A carência deve ser menor que o prazo total.'
    );
  }


  const numeroParcelas =
    prazoTotalAnos -
    carenciaAnos;


  const jurosCarencia =
    normalizarJurosCarencia_(
      dados.jurosCarencia
    );


  const valores =
    calcularValoresFinanciamento_(
      valorProposta,
      percentualFinanciavel,
      percentualAter
    );


  const financiamentoValidacao = {
    valorFinanciado:
      valores.valorFinanciado,

    percentualFinanciavel,

    prazoTotalAnos,

    carenciaAnos
  };


  validarContraLinhaCredito_(
    financiamentoValidacao,
    linha
  );


  const lock =
    LockService
      .getScriptLock();


  lock.waitLock(
    10000
  );


  try {
    const sheet =
      getSheet_(
        SHEET_FINANCIAMENTOS
      );


    const existente =
      localizarFinanciamento_(
        propostaId
      );


    const agora =
      new Date();


    const id =
      existente
        ? String(
            existente.row[0]
          )
        : Utilities.getUuid();


    const statusAtual =
      existente
        ? String(
            existente.row[18] ||
            'RASCUNHO'
          )
        : 'RASCUNHO';


    const novoStatus =
      statusAtual ===
      'CONCLUIDO'
        ? 'EM_REVISAO'
        : (
            statusAtual ===
            'PENDENTE'
              ? 'RASCUNHO'
              : statusAtual
          );


    const garantiasConfirmadas =
      existente
        ? (
            existente.row[16] ===
              true ||
            String(
              existente.row[16]
            ).toUpperCase() ===
              'TRUE'
          )
        : false;


    const registro = [
      id,
      propostaId,
      linhaCreditoId,
      linha
        ? linha.nome
        : 'Parâmetros manuais',
      valorProposta,
      percentualFinanciavel,
      valores.valorFinanciado,
      percentualAter,
      valores.valorAter,
      valores.valorProjeto,
      taxaJurosAnual,
      prazoTotalAnos,
      carenciaAnos,
      numeroParcelas,
      'ANUAL',
      jurosCarencia,
      garantiasConfirmadas,
      false,
      novoStatus,
      existente
        ? existente.row[19]
        : '',
      existente
        ? existente.row[20]
        : '',
      existente
        ? (
            existente.row[21] ||
            agora
          )
        : agora,
      agora
    ];


    if (existente) {
      sheet
        .getRange(
          existente.linha,
          1,
          1,
          23
        )
        .setValues([
          registro
        ]);

    } else {
      sheet.appendRow(
        registro
      );
    }

  } finally {
    lock.releaseLock();
  }


  return obterFinanciamento(
    propostaId
  );
}


/* =========================================================
   CONFIRMAÇÕES
   ========================================================= */

function salvarRascunhoFinanciamento(
  propostaId,
  garantiasConfirmadas,
  cronogramaConfirmado
) {
  propostaId =
    String(
      propostaId || ''
    ).trim();


  const localizado =
    localizarFinanciamento_(
      propostaId
    );


  if (!localizado) {
    throw new Error(
      'Salve primeiro as condições do financiamento.'
    );
  }


  const statusAtual =
    String(
      localizado.row[18] ||
      'RASCUNHO'
    );


  const novoStatus =
    statusAtual ===
    'CONCLUIDO'
      ? 'EM_REVISAO'
      : statusAtual;


  const sheet =
    getSheet_(
      SHEET_FINANCIAMENTOS
    );


  sheet
    .getRange(
      localizado.linha,
      17,
      1,
      7
    )
    .setValues([
      [
        Boolean(
          garantiasConfirmadas
        ),
        Boolean(
          cronogramaConfirmado
        ),
        novoStatus,
        localizado.row[19] ||
          '',
        localizado.row[20] ||
          '',
        localizado.row[21] ||
          new Date(),
        new Date()
      ]
    ]);


  return obterFinanciamento(
    propostaId
  );
}


/* =========================================================
   COMPLETUDE
   ========================================================= */

function analisarCompletudeFinanciamento_(
  financiamento,
  fluxoEstado,
  statusEfetivo
) {
  const requisitos = [
    [
      'Concluir o fluxo de caixa',
      fluxoEstado.completo
    ],

    [
      'Informar as condições do financiamento',
      financiamento.valorProjeto > 0
    ],

    [
      'Confirmar a situação das garantias',
      financiamento
        .garantiasConfirmadas
    ],

    [
      'Revisar e confirmar o cronograma financeiro',
      financiamento
        .cronogramaConfirmado
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
   ESTADO RESUMIDO
   ========================================================= */

function obterEstadoFinanciamentoResumo_(
  propostaId
) {
  const localizado =
    localizarFinanciamento_(
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


  const financiamento =
    montarFinanciamento_(
      localizado
    );


  const fluxoEstado =
    obterEstadoFluxoCaixaResumo_(
      propostaId
    );


  const statusEfetivo =
    obterStatusEfetivoFinanciamento_(
      financiamento,
      fluxoEstado,
      propostaId
    );


  const completude =
    analisarCompletudeFinanciamento_(
      financiamento,
      fluxoEstado,
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
   CONCLUIR
   ========================================================= */

function concluirFinanciamento(
  propostaId
) {
  propostaId =
    String(
      propostaId || ''
    ).trim();


  const dados =
    obterFinanciamento(
      propostaId
    );


  if (
    !dados.completude
      .prontoParaConcluir
  ) {
    throw new Error(
      'O financiamento ainda possui pendências: ' +
      dados.completude
        .camposFaltantes
        .join('; ') +
      '.'
    );
  }


  const fluxoTimestamp =
    obterTimestampAtualFluxoCaixa_(
      propostaId
    );


  if (!fluxoTimestamp) {
    throw new Error(
      'O fluxo de caixa precisa estar concluído.'
    );
  }


  const localizado =
    localizarFinanciamento_(
      propostaId
    );


  const agora =
    new Date();


  const sheet =
    getSheet_(
      SHEET_FINANCIAMENTOS
    );


  sheet
    .getRange(
      localizado.linha,
      17,
      1,
      7
    )
    .setValues([
      [
        true,
        true,
        'CONCLUIDO',
        new Date(
          fluxoTimestamp
        ),
        agora,
        localizado.row[21] ||
          agora,
        agora
      ]
    ]);


  return obterFinanciamento(
    propostaId
  );
}


/* =========================================================
   VISÃO COMPLETA
   ========================================================= */

function obterFinanciamento(
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
    localizarFinanciamento_(
      propostaId
    );


  const financiamento =
    montarFinanciamento_(
      localizado
    );


  const fluxoEstado =
    obterEstadoFluxoCaixaResumo_(
      propostaId
    );


  const statusEfetivo =
    obterStatusEfetivoFinanciamento_(
      financiamento,
      fluxoEstado,
      propostaId
    );


  financiamento.status =
    statusEfetivo;


  const garantias =
    listarGarantiasFinanciamento_(
      propostaId
    );


  const itensFluxo =
    listarItensFluxoCaixa_(
      propostaId
    );


  const resumoFluxo =
    calcularResumoFluxoCaixa_(
      itensFluxo
    );


  const cronograma =
    financiamento.valorProjeto > 0
      ? calcularCronogramaFinanciamento_(
          financiamento,
          resumoFluxo.resultado
        )
      : {
          parcelas: [],
          totalJuros: 0,
          totalAmortizacao: 0,
          totalPrestacoes: 0,
          anosCapacidadeInsuficiente: 0
        };


  const completude =
    analisarCompletudeFinanciamento_(
      financiamento,
      fluxoEstado,
      statusEfetivo
    );


  let financiamentoPretendido =
    0;


  try {
    const usosFontes =
      obterUsosFontesProposta_(
        propostaId
      );


    const fonte =
      usosFontes.fontes.find(
        item =>
          item.categoria ===
          'FINANCIAMENTO'
      );


    financiamentoPretendido =
      Number(
        fonte?.valor ||
        0
      );

  } catch (erro) {
    financiamentoPretendido =
      0;
  }


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

    financiamento,

    garantias,

    tiposGarantia:
      tiposGarantiaFinanciamento_(),

    fluxoEstado,

    cronograma,

    completude,

    linhasCredito:
      listarLinhasCreditoAtivas(),

    financiamentoPretendidoIdentificacao:
      financiamentoPretendido
  };
}