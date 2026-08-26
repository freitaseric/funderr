function salvarPropriedade(
  dados
) {
  if (!dados) {
    throw new Error(
      'Dados da propriedade não informados.'
    );
  }

  const id =
    String(
      dados.id || ''
    ).trim();

  const beneficiarioId =
    String(
      dados.beneficiarioId || ''
    ).trim();

  const denominacao =
    String(
      dados.denominacao || ''
    ).trim();

  const endereco =
    String(
      dados.endereco || ''
    ).trim();

  const municipio =
    dados.municipio
      ? normalizarMunicipioRoraima_(
          dados.municipio
        )
      : '';

  const estado =
    'RORAIMA';

  const areaTotal =
    converterNumero_(
      dados.areaTotal
    );

  const areaDisponivel =
    converterNumero_(
      dados.areaDisponivel
    );

  const areaLegal =
    converterNumero_(
      dados.areaLegal
    );

  const formaOcupacao =
    normalizarFormaOcupacao_(
      dados.formaOcupacaoCodigo ||
      dados.formaOcupacao,
      dados.formaOcupacaoOutro
    );

  const tempoExploracao =
    String(
      dados.tempoExploracao || ''
    ).trim();

  const modulo =
    String(
      dados.modulo || ''
    ).trim();

  const documentoExistente =
    normalizarDocumentoPropriedade_(
      dados.documentoExistenteCodigo ||
      dados.documentoExistente,
      dados.documentoExistenteOutro
    );

  const latitude =
    normalizarCoordenada_(
      dados.latitude,
      'Latitude'
    );

  const longitude =
    normalizarCoordenada_(
      dados.longitude,
      'Longitude'
    );

  if (
    (
      latitude === '' &&
      longitude !== ''
    ) ||
    (
      latitude !== '' &&
      longitude === ''
    )
  ) {
    throw new Error(
      'Informe latitude e longitude juntas.'
    );
  }

  const confrontacaoNorte =
    String(
      dados.confrontacaoNorte || ''
    ).trim();

  const confrontacaoSul =
    String(
      dados.confrontacaoSul || ''
    ).trim();

  const confrontacaoLeste =
    String(
      dados.confrontacaoLeste || ''
    ).trim();

  const confrontacaoOeste =
    String(
      dados.confrontacaoOeste || ''
    ).trim();

  const administracao =
    String(
      dados.administracao || ''
    ).trim();

  if (!beneficiarioId) {
    throw new Error(
      'Selecione o beneficiário.'
    );
  }

  if (!denominacao) {
    throw new Error(
      'Informe a denominação da propriedade.'
    );
  }

  if (!municipio) {
    throw new Error(
      'Informe o município da propriedade.'
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

  const lock =
    LockService
      .getScriptLock();

  lock.waitLock(
    10000
  );

  try {
    const sheet =
      getSheet_(
        SHEET_PROPRIEDADES
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
              22
            )
            .getValues()
        : [];

    const agora =
      new Date();

    let propriedadeId =
      id;

    let criadoEm =
      agora;

    let linha =
      null;

    if (id) {
      const index =
        rows.findIndex(
          row =>
            String(
              row[0]
            ) === id
        );

      if (
        index < 0
      ) {
        throw new Error(
          'Propriedade não encontrada.'
        );
      }

      const beneficiarioOriginalId =
        String(
          rows[index][1] || ''
        );

      if (
        beneficiarioOriginalId !==
        beneficiarioId
      ) {
        throw new Error(
          'Não é permitido alterar o beneficiário de uma propriedade existente.'
        );
      }

      linha =
        index + 2;

      criadoEm =
        rows[index][18] ||
        agora;

    } else {
      propriedadeId =
        Utilities.getUuid();
    }

    const registro = [
      propriedadeId,
      beneficiarioId,
      denominacao,
      endereco,
      municipio,
      estado,
      areaTotal,
      areaDisponivel,
      formaOcupacao,
      tempoExploracao,
      modulo,
      documentoExistente,
      latitude,
      longitude,
      confrontacaoNorte,
      confrontacaoSul,
      confrontacaoLeste,
      confrontacaoOeste,
      criadoEm,
      agora,
      areaLegal,
      administracao
    ];

    if (linha) {
      sheet
        .getRange(
          linha,
          1,
          1,
          22
        )
        .setValues([
          registro
        ]);

    } else {
      sheet.appendRow(
        registro
      );
    }

    return buscarPropriedade(
      propriedadeId
    );

  } finally {
    lock.releaseLock();
  }
}


function listarPropriedades() {
  const sheet =
    getSheet_(
      SHEET_PROPRIEDADES
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

  return sheet
    .getRange(
      2,
      1,
      lastRow - 1,
      22
    )
    .getValues()
    .map(
      row => {
        const propriedade =
          montarPropriedadeDaLinha_(
            row
          );

        const beneficiario =
          beneficiarios[
            propriedade.beneficiarioId
          ] || {};

        propriedade.beneficiarioNome =
          beneficiario.nome ||
          'Beneficiário não encontrado';

        propriedade.beneficiarioCpf =
          beneficiario.cpf ||
          '';

        const analise =
          analisarCompletudePropriedade_(
            propriedade
          );

        propriedade.cadastroAmpliadoCompleto =
          analise.completo;

        propriedade.percentualCadastro =
          analise.percentual;

        propriedade.camposFaltantes =
          analise.camposFaltantes;

        return propriedade;
      }
    )
    .reverse();
}


function buscarPropriedade(
  id
) {
  const propriedadeId =
    String(
      id || ''
    ).trim();

  if (!propriedadeId) {
    throw new Error(
      'ID da propriedade não informado.'
    );
  }

  const sheet =
    getSheet_(
      SHEET_PROPRIEDADES
    );

  const lastRow =
    sheet.getLastRow();

  if (
    lastRow < 2
  ) {
    throw new Error(
      'Nenhuma propriedade cadastrada.'
    );
  }

  const rows =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        22
      )
      .getValues();

  const row =
    rows.find(
      item =>
        String(
          item[0]
        ) ===
        propriedadeId
    );

  if (!row) {
    throw new Error(
      'Propriedade não encontrada.'
    );
  }

  const propriedade =
    montarPropriedadeDaLinha_(
      row
    );

  const beneficiario =
    buscarBeneficiarioPorId_(
      propriedade.beneficiarioId
    );

  propriedade.beneficiarioNome =
    beneficiario?.nome ||
    '';

  propriedade.beneficiarioCpf =
    beneficiario?.cpf ||
    '';

  const analise =
    analisarCompletudePropriedade_(
      propriedade
    );

  propriedade.cadastroAmpliadoCompleto =
    analise.completo;

  propriedade.percentualCadastro =
    analise.percentual;

  propriedade.camposFaltantes =
    analise.camposFaltantes;

  return propriedade;
}


function montarPropriedadeDaLinha_(
  row
) {
  return {
    id:
      String(
        row[0] || ''
      ),

    beneficiarioId:
      String(
        row[1] || ''
      ),

    denominacao:
      String(
        row[2] || ''
      ),

    endereco:
      String(
        row[3] || ''
      ),

    municipio:
      String(
        row[4] || ''
      ),

    estado:
      String(
        row[5] || ''
      ),

    areaTotal:
      row[6] ?? '',

    areaDisponivel:
      row[7] ?? '',

    formaOcupacao:
      String(
        row[8] || ''
      ),

    tempoExploracao:
      String(
        row[9] || ''
      ),

    modulo:
      String(
        row[10] || ''
      ),

    documentoExistente:
      String(
        row[11] || ''
      ),

    latitude:
      String(
        row[12] ?? ''
      ),

    longitude:
      String(
        row[13] ?? ''
      ),

    confrontacaoNorte:
      String(
        row[14] || ''
      ),

    confrontacaoSul:
      String(
        row[15] || ''
      ),

    confrontacaoLeste:
      String(
        row[16] || ''
      ),

    confrontacaoOeste:
      String(
        row[17] || ''
      ),

    criadoEm:
      formatarDataHora_(
        row[18]
      ),

    atualizadoEm:
      formatarDataHora_(
        row[19]
      ),

    areaLegal:
      row[20] ?? '',

    administracao:
      String(
        row[21] || ''
      )
  };
}


function cadastroAmpliadoPropriedadeCompleto_(
  propriedade
) {
  return analisarCompletudePropriedade_(
    propriedade
  ).completo;
}


function criarMapaPropriedades_() {
  const propriedades =
    listarPropriedades();

  const mapa = {};

  propriedades.forEach(
    item => {
      mapa[item.id] =
        item;
    }
  );

  return mapa;
}