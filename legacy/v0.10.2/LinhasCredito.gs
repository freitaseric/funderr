function listarLinhasCreditoAtivas() {
  const sheet =
    getSheet_(
      SHEET_LINHAS_CREDITO
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
      13
    )
    .getValues()
    .map(
      montarLinhaCredito_
    )
    .filter(
      item =>
        item.ativo
    )
    .sort(
      (
        a,
        b
      ) =>
        a.nome.localeCompare(
          b.nome,
          'pt-BR'
        )
    );
}


function buscarLinhaCreditoPorId_(
  id
) {
  const linhaId =
    String(
      id || ''
    ).trim();


  if (!linhaId) {
    return null;
  }


  const sheet =
    getSheet_(
      SHEET_LINHAS_CREDITO
    );


  const lastRow =
    sheet.getLastRow();


  if (
    lastRow < 2
  ) {
    return null;
  }


  const row =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        13
      )
      .getValues()
      .find(
        item =>
          String(
            item[0] || ''
          ) ===
          linhaId
      );


  return row
    ? montarLinhaCredito_(
        row
      )
    : null;
}


function montarLinhaCredito_(
  row
) {
  return {
    id:
      String(
        row[0] || ''
      ),

    codigo:
      String(
        row[1] || ''
      ),

    nome:
      String(
        row[2] || ''
      ),

    ativo:
      row[3] === true ||
      String(
        row[3]
      ).toUpperCase() ===
      'TRUE',

    tetoFinanciamento:
      Number(
        row[4] || 0
      ),

    taxaJurosAnual:
      Number(
        row[5] || 0
      ),

    prazoMaxAnos:
      Number(
        row[6] || 0
      ),

    carenciaMaxAnos:
      Number(
        row[7] || 0
      ),

    percentualFinanciavelMax:
      Number(
        row[8] || 0
      ),

    percentualAterPadrao:
      Number(
        row[9] || 0
      ),

    observacoes:
      String(
        row[10] || ''
      ),

    criadoEm:
      formatarDataHora_(
        row[11]
      ),

    atualizadoEm:
      formatarDataHora_(
        row[12]
      )
  };
}