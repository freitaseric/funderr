function salvarProposta(
  dados
) {
  if (!dados) {
    throw new Error(
      'Dados da proposta não informados.'
    );
  }


  const beneficiarioId =
    String(
      dados.beneficiarioId || ''
    ).trim();


  const propriedadeId =
    String(
      dados.propriedadeId || ''
    ).trim();


  const atividade =
    String(
      dados.atividade || ''
    ).trim();


  const data =
    String(
      dados.data || ''
    ).trim();


  if (!beneficiarioId) {
    throw new Error(
      'Selecione um beneficiário.'
    );
  }


  if (!propriedadeId) {
    throw new Error(
      'Selecione uma propriedade.'
    );
  }


  if (!data) {
    throw new Error(
      'Informe a data da proposta.'
    );
  }


  if (!atividade) {
    throw new Error(
      'Informe a atividade.'
    );
  }


  const beneficiario =
    buscarBeneficiarioPorId_(
      beneficiarioId
    );


  if (!beneficiario) {
    throw new Error(
      'O beneficiário selecionado não existe.'
    );
  }


  const propriedade =
    buscarPropriedade(
      propriedadeId
    );


  if (
    propriedade.beneficiarioId !==
    beneficiarioId
  ) {
    throw new Error(
      'A propriedade selecionada não pertence ao beneficiário.'
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
        SHEET_PROPOSTAS
      );


    const dataProposta =
      converterDataHtml_(
        data
      );


    const numero =
      gerarNumeroProposta_(
        sheet,
        dataProposta
      );


    const id =
      Utilities.getUuid();


    const agora =
      new Date();


    sheet.appendRow([
      id,
      numero,
      beneficiarioId,
      dataProposta,
      atividade,
      'EM ELABORAÇÃO',
      agora,
      agora,
      propriedadeId
    ]);


    return {
      id,
      numero,
      beneficiarioId,

      beneficiarioNome:
        beneficiario.nome,

      beneficiarioCpf:
        beneficiario.cpf,

      propriedadeId,

      propriedadeNome:
        propriedade.denominacao,

      propriedadeMunicipio:
        propriedade.municipio,

      data:
        formatarData_(
          dataProposta
        ),

      atividade,

      status:
        'EM ELABORAÇÃO'
    };

  } finally {
    lock.releaseLock();
  }
}


function listarPropostas() {
  const sheet =
    getSheet_(
      SHEET_PROPOSTAS
    );


  const lastRow =
    sheet.getLastRow();


  if (
    lastRow < 2
  ) {
    return [];
  }


  const beneficiarios =
    criarMapaBeneficiarios_();


  const propriedades =
    criarMapaPropriedades_();


  return sheet
    .getRange(
      2,
      1,
      lastRow - 1,
      9
    )
    .getValues()
    .map(
      row => {
        const beneficiarioId =
          String(
            row[2] || ''
          );


        const propriedadeId =
          String(
            row[8] || ''
          );


        const beneficiario =
          beneficiarios[
            beneficiarioId
          ] || {};


        const propriedade =
          propriedades[
            propriedadeId
          ] || {};


        return {
          id:
            String(
              row[0] || ''
            ),

          numero:
            String(
              row[1] || ''
            ),

          beneficiarioId,

          beneficiarioNome:
            beneficiario.nome ||
            'Beneficiário não encontrado',

          beneficiarioCpf:
            beneficiario.cpf ||
            '',

          propriedadeId,

          propriedadeNome:
            propriedade.denominacao ||
            '',

          propriedadeMunicipio:
            propriedade.municipio ||
            '',

          data:
            formatarData_(
              row[3]
            ),

          atividade:
            String(
              row[4] || ''
            ),

          status:
            String(
              row[5] || ''
            ),

          criadoEm:
            formatarDataHora_(
              row[6]
            )
        };
      }
    )
    .reverse();
}


function buscarProposta(
  id
) {
  const propostaId =
    String(
      id || ''
    ).trim();


  if (!propostaId) {
    throw new Error(
      'ID da proposta não informado.'
    );
  }


  const sheet =
    getSheet_(
      SHEET_PROPOSTAS
    );


  const lastRow =
    sheet.getLastRow();


  if (
    lastRow < 2
  ) {
    throw new Error(
      'Nenhuma proposta cadastrada.'
    );
  }


  const rows =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        9
      )
      .getValues();


  const row =
    rows.find(
      item =>
        String(
          item[0]
        ) ===
        propostaId
    );


  if (!row) {
    throw new Error(
      'Proposta não encontrada.'
    );
  }


  const beneficiario =
    buscarBeneficiarioPorId_(
      String(
        row[2]
      )
    );


  const propriedadeId =
    String(
      row[8] || ''
    );


  const propriedade =
    propriedadeId
      ? buscarPropriedade(
          propriedadeId
        )
      : null;


  const vazio = () => ({
    status:
      'PENDENTE',

    completo:
      false,

    percentual:
      0,

    camposFaltantes:
      []
  });


  let patrimonio =
    vazio();

  let identificacao =
    vazio();

  let fluxoCaixa =
    vazio();

  let financiamento =
    vazio();


  try {
    patrimonio =
      obterEstadoPatrimonioResumo_(
        propostaId
      );
  } catch (erro) {}


  try {
    identificacao =
      obterEstadoIdentificacaoResumo_(
        propostaId
      );
  } catch (erro) {}


  try {
    fluxoCaixa =
      obterEstadoFluxoCaixaResumo_(
        propostaId
      );
  } catch (erro) {}


  try {
    financiamento =
      obterEstadoFinanciamentoResumo_(
        propostaId
      );
  } catch (erro) {}


  return {
    id:
      String(
        row[0] || ''
      ),

    numero:
      String(
        row[1] || ''
      ),

    beneficiarioId:
      String(
        row[2] || ''
      ),

    beneficiarioNome:
      beneficiario?.nome ||
      '',

    beneficiarioCpf:
      beneficiario?.cpf ||
      '',

    beneficiarioCompleto:
      Boolean(
        beneficiario
          ?.cadastroAmpliadoCompleto
      ),

    beneficiarioPercentual:
      beneficiario
        ?.percentualCadastro ||
      0,

    beneficiarioCamposFaltantes:
      beneficiario
        ?.camposFaltantes ||
      [],

    propriedadeId,

    propriedadeNome:
      propriedade?.denominacao ||
      '',

    propriedadeMunicipio:
      propriedade?.municipio ||
      '',

    propriedadeCompleta:
      Boolean(
        propriedade
          ?.cadastroAmpliadoCompleto
      ),

    propriedadePercentual:
      propriedade
        ?.percentualCadastro ||
      0,

    propriedadeCamposFaltantes:
      propriedade
        ?.camposFaltantes ||
      [],

    patrimonioStatus:
      patrimonio.status,

    patrimonioCompleto:
      patrimonio.completo,

    patrimonioPercentual:
      patrimonio.percentual,

    identificacaoStatus:
      identificacao.status,

    identificacaoCompleta:
      identificacao.completo,

    identificacaoPercentual:
      identificacao.percentual,

    fluxoCaixaStatus:
      fluxoCaixa.status,

    fluxoCaixaCompleto:
      fluxoCaixa.completo,

    fluxoCaixaPercentual:
      fluxoCaixa.percentual,

    financiamentoStatus:
      financiamento.status,

    financiamentoCompleto:
      financiamento.completo,

    financiamentoPercentual:
      financiamento.percentual,

    data:
      formatarData_(
        row[3]
      ),

    atividade:
      String(
        row[4] || ''
      ),

    status:
      String(
        row[5] || ''
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


function gerarNumeroProposta_(
  sheet,
  dataProposta
) {
  const ano =
    dataProposta.getFullYear();


  const lastRow =
    sheet.getLastRow();


  if (
    lastRow < 2
  ) {
    return `${ano}-0001`;
  }


  const numeros =
    sheet
      .getRange(
        2,
        2,
        lastRow - 1,
        1
      )
      .getDisplayValues()
      .flat();


  let maiorSequencia =
    0;


  numeros.forEach(
    numero => {
      const match =
        String(numero)
          .match(
            new RegExp(
              `^${ano}-(\\d+)$`
            )
          );


      if (match) {
        maiorSequencia =
          Math.max(
            maiorSequencia,
            Number(
              match[1]
            )
          );
      }
    }
  );


  return (
    `${ano}-${String(
      maiorSequencia + 1
    ).padStart(
      4,
      '0'
    )}`
  );
}