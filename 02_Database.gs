function getSpreadsheet_() {
  const spreadsheetId =
    PropertiesService
      .getScriptProperties()
      .getProperty(
        'SPREADSHEET_ID'
      );


  if (!spreadsheetId) {
    throw new Error(
      'Banco de dados não configurado. Execute configurarSistema().'
    );
  }


  return SpreadsheetApp.openById(
    spreadsheetId
  );
}


function getSheet_(nome) {
  const spreadsheet =
    getSpreadsheet_();


  const sheet =
    spreadsheet.getSheetByName(
      nome
    );


  if (!sheet) {
    throw new Error(
      `A aba "${nome}" não foi encontrada.`
    );
  }


  return sheet;
}


function criarAbaSeNecessario_(
  spreadsheet,
  nome,
  cabecalho
) {
  let sheet =
    spreadsheet.getSheetByName(
      nome
    );


  if (!sheet) {
    sheet =
      spreadsheet.insertSheet(
        nome
      );
  }


  if (
    sheet.getLastRow() === 0
  ) {
    sheet
      .getRange(
        1,
        1,
        1,
        cabecalho.length
      )
      .setValues([
        cabecalho
      ]);


    sheet.setFrozenRows(1);
  }


  return sheet;
}


function garantirColuna_(
  sheet,
  nomeColuna
) {
  garantirColunas_(
    sheet,
    [nomeColuna]
  );
}


function garantirColunas_(
  sheet,
  nomesColunas
) {
  let lastColumn =
    Math.max(
      sheet.getLastColumn(),
      1
    );


  let headers =
    sheet
      .getRange(
        1,
        1,
        1,
        lastColumn
      )
      .getDisplayValues()[0]
      .map(
        item =>
          String(
            item || ''
          ).trim()
      );


  nomesColunas.forEach(
    nomeColuna => {

      if (
        headers.includes(
          nomeColuna
        )
      ) {
        return;
      }


      lastColumn += 1;


      sheet
        .getRange(
          1,
          lastColumn
        )
        .setValue(
          nomeColuna
        );


      headers.push(
        nomeColuna
      );

    }
  );
}