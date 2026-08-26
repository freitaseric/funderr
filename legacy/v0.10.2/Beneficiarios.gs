function salvarBeneficiario(
  dados
) {
  if (!dados) {
    throw new Error(
      'Dados não informados.'
    );
  }

  const id =
    String(
      dados.id || ''
    ).trim();

  const nome =
    String(
      dados.nome || ''
    ).trim();

  const cpf =
    validarCpf_(
      dados.cpf
    );

  const telefone =
    dados.telefone
      ? normalizarTelefone_(
          dados.telefone
        )
      : '';

  const apelido =
    String(
      dados.apelido || ''
    ).trim();

  const nacionalidade =
    String(
      dados.nacionalidade || ''
    ).trim();

  const naturalidade =
    String(
      dados.naturalidade || ''
    ).trim();

  const estadoCivil =
    normalizarEstadoCivil_(
      dados.estadoCivil
    );

  const dataNascimento =
    dados.dataNascimento
      ? converterDataHtml_(
          dados.dataNascimento
        )
      : '';

  const profissao =
    String(
      dados.profissao || ''
    ).trim();

  const rg =
    String(
      dados.rg || ''
    ).trim();

  const escolaridade =
    normalizarEscolaridade_(
      dados.escolaridade
    );

  const endereco =
    String(
      dados.endereco || ''
    ).trim();

  const dependentes =
    converterInteiroNaoNegativo_(
      dados.dependentes
    );

  let conjugeNome =
    String(
      dados.conjugeNome || ''
    ).trim();

  let conjugeRg =
    String(
      dados.conjugeRg || ''
    ).trim();

  let conjugeCpf =
    dados.conjugeCpf
      ? validarCpf_(
          dados.conjugeCpf
        )
      : '';

  if (
    !estadoCivilPossuiConjugeServidor_(
      estadoCivil
    )
  ) {
    conjugeNome = '';
    conjugeRg = '';
    conjugeCpf = '';
  }

  if (
    conjugeCpf &&
    conjugeCpf === cpf
  ) {
    throw new Error(
      'O CPF do cônjuge não pode ser igual ao CPF do beneficiário.'
    );
  }

  if (
    nome.length < 3
  ) {
    throw new Error(
      'Informe o nome do beneficiário.'
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
        SHEET_BENEFICIARIOS
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
              19
            )
            .getValues()
        : [];

    const duplicado =
      rows.some(
        row =>
          normalizarCpf_(
            row[2]
          ) === cpf &&
          String(
            row[0]
          ) !== id
      );

    if (
      duplicado
    ) {
      throw new Error(
        'Já existe um beneficiário com esse CPF.'
      );
    }

    const agora =
      new Date();

    let beneficiarioId =
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
          'Beneficiário não encontrado.'
        );
      }

      linha =
        index + 2;

      criadoEm =
        rows[index][4] ||
        agora;

    } else {
      beneficiarioId =
        Utilities.getUuid();
    }

    const registro = [
      beneficiarioId,
      nome,
      cpf,
      telefone,
      criadoEm,
      apelido,
      nacionalidade,
      naturalidade,
      estadoCivil,
      dataNascimento,
      profissao,
      rg,
      escolaridade,
      endereco,
      dependentes,
      conjugeNome,
      conjugeRg,
      conjugeCpf,
      agora
    ];

    if (linha) {
      sheet
        .getRange(
          linha,
          1,
          1,
          19
        )
        .setValues([
          registro
        ]);

    } else {
      sheet.appendRow(
        registro
      );
    }

    salvarReferenciasBeneficiario_(
      beneficiarioId,
      dados.referencias
    );

    return buscarBeneficiario(
      beneficiarioId
    );

  } finally {
    lock.releaseLock();
  }
}


function listarBeneficiarios() {
  const sheet =
    getSheet_(
      SHEET_BENEFICIARIOS
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
      19
    )
    .getValues()
    .map(
      row => {
        const beneficiario =
          montarBeneficiarioDaLinha_(
            row
          );

        const analise =
          analisarCompletudeBeneficiario_(
            beneficiario
          );

        return {
          id:
            beneficiario.id,

          nome:
            beneficiario.nome,

          cpf:
            beneficiario.cpf,

          telefone:
            beneficiario.telefone,

          rg:
            beneficiario.rg,

          criadoEm:
            beneficiario.criadoEm,

          cadastroAmpliadoCompleto:
            analise.completo,

          percentualCadastro:
            analise.percentual,

          camposFaltantes:
            analise.camposFaltantes
        };
      }
    )
    .sort(
      (a, b) =>
        a.nome.localeCompare(
          b.nome,
          'pt-BR'
        )
    );
}


function buscarBeneficiario(
  id
) {
  const beneficiarioId =
    String(
      id || ''
    ).trim();

  if (!beneficiarioId) {
    throw new Error(
      'ID do beneficiário não informado.'
    );
  }

  const sheet =
    getSheet_(
      SHEET_BENEFICIARIOS
    );

  const lastRow =
    sheet.getLastRow();

  if (
    lastRow < 2
  ) {
    throw new Error(
      'Nenhum beneficiário cadastrado.'
    );
  }

  const rows =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        19
      )
      .getValues();

  const row =
    rows.find(
      item =>
        String(
          item[0]
        ) ===
        beneficiarioId
    );

  if (!row) {
    throw new Error(
      'Beneficiário não encontrado.'
    );
  }

  const beneficiario =
    montarBeneficiarioDaLinha_(
      row
    );

  beneficiario.referencias =
    listarReferenciasBeneficiario_(
      beneficiarioId
    );

  const analise =
    analisarCompletudeBeneficiario_(
      beneficiario
    );

  beneficiario.cadastroAmpliadoCompleto =
    analise.completo;

  beneficiario.percentualCadastro =
    analise.percentual;

  beneficiario.camposFaltantes =
    analise.camposFaltantes;

  return beneficiario;
}


function buscarBeneficiarioPorId_(
  id
) {
  try {
    return buscarBeneficiario(
      id
    );

  } catch (erro) {
    return null;
  }
}


function montarBeneficiarioDaLinha_(
  row
) {
  return {
    id:
      String(
        row[0] || ''
      ),

    nome:
      String(
        row[1] || ''
      ),

    cpf:
      String(
        row[2] || ''
      ),

    telefone:
      String(
        row[3] || ''
      ),

    criadoEm:
      formatarDataHora_(
        row[4]
      ),

    apelido:
      String(
        row[5] || ''
      ),

    nacionalidade:
      String(
        row[6] || ''
      ),

    naturalidade:
      String(
        row[7] || ''
      ),

    estadoCivil:
      String(
        row[8] || ''
      ),

    dataNascimento:
      formatarDataHtml_(
        row[9]
      ),

    profissao:
      String(
        row[10] || ''
      ),

    rg:
      String(
        row[11] || ''
      ),

    escolaridade:
      String(
        row[12] || ''
      ),

    endereco:
      String(
        row[13] || ''
      ),

    dependentes:
      row[14] === ''
        ? ''
        : String(
            row[14]
          ),

    conjugeNome:
      String(
        row[15] || ''
      ),

    conjugeRg:
      String(
        row[16] || ''
      ),

    conjugeCpf:
      String(
        row[17] || ''
      ),

    atualizadoEm:
      formatarDataHora_(
        row[18]
      )
  };
}


function cadastroAmpliadoBeneficiarioCompleto_(
  beneficiario
) {
  return analisarCompletudeBeneficiario_(
    beneficiario
  ).completo;
}


function criarMapaBeneficiarios_() {
  const beneficiarios =
    listarBeneficiarios();

  const mapa = {};

  beneficiarios.forEach(
    item => {
      mapa[item.id] =
        item;
    }
  );

  return mapa;
}