function listarReferenciasBeneficiario_(
  beneficiarioId
) {
  const sheet =
    getSheet_(
      SHEET_REFERENCIAS
    );

  const lastRow =
    sheet.getLastRow();

  const referencias = [
    {
      ordem: 1,
      nome: '',
      telefone: ''
    },
    {
      ordem: 2,
      nome: '',
      telefone: ''
    }
  ];

  if (
    lastRow < 2
  ) {
    return referencias;
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

  rows
    .filter(
      row =>
        String(
          row[1] || ''
        ) ===
        String(
          beneficiarioId
        )
    )
    .forEach(
      row => {
        const ordem =
          Number(
            row[2]
          );

        if (
          ordem !== 1 &&
          ordem !== 2
        ) {
          return;
        }

        referencias[
          ordem - 1
        ] = {
          ordem,

          nome:
            String(
              row[3] || ''
            ),

          telefone:
            String(
              row[4] || ''
            )
        };
      }
    );

  return referencias;
}


function salvarReferenciasBeneficiario_(
  beneficiarioId,
  referencias
) {
  const sheet =
    getSheet_(
      SHEET_REFERENCIAS
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

  const agora =
    new Date();

  for (
    let ordem = 1;
    ordem <= 2;
    ordem++
  ) {
    const referencia =
      Array.isArray(
        referencias
      )
        ? (
            referencias.find(
              item =>
                Number(
                  item.ordem
                ) === ordem
            ) ||
            referencias[
              ordem - 1
            ] ||
            {}
          )
        : {};

    const nome =
      String(
        referencia.nome || ''
      ).trim();

    const telefone =
      referencia.telefone
        ? normalizarTelefone_(
            referencia.telefone
          )
        : '';

    const index =
      rows.findIndex(
        row =>
          String(
            row[1] || ''
          ) ===
            String(
              beneficiarioId
            ) &&
          Number(
            row[2]
          ) === ordem
      );

    if (
      index >= 0
    ) {
      const linha =
        index + 2;

      const existente =
        rows[index];

      sheet
        .getRange(
          linha,
          1,
          1,
          7
        )
        .setValues([
          [
            String(
              existente[0]
            ),

            beneficiarioId,

            ordem,

            nome,

            telefone,

            existente[5] ||
              agora,

            agora
          ]
        ]);

      continue;
    }

    if (
      !nome &&
      !telefone
    ) {
      continue;
    }

    sheet.appendRow([
      Utilities.getUuid(),
      beneficiarioId,
      ordem,
      nome,
      telefone,
      agora,
      agora
    ]);
  }
}