function textoNormalizado_(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}


/* =========================================================
   CPF
   ========================================================= */

function validarCpf_(valor) {
  const cpf =
    normalizarCpf_(valor);

  if (cpf.length !== 11) {
    throw new Error(
      'O CPF deve possuir 11 dígitos.'
    );
  }

  if (
    /^(\d)\1{10}$/.test(cpf)
  ) {
    throw new Error(
      'O CPF informado é inválido.'
    );
  }

  let soma = 0;

  for (
    let i = 0;
    i < 9;
    i++
  ) {
    soma +=
      Number(cpf[i]) *
      (10 - i);
  }

  let digito =
    (soma * 10) % 11;

  if (digito === 10) {
    digito = 0;
  }

  if (
    digito !==
    Number(cpf[9])
  ) {
    throw new Error(
      'O CPF informado é inválido.'
    );
  }

  soma = 0;

  for (
    let i = 0;
    i < 10;
    i++
  ) {
    soma +=
      Number(cpf[i]) *
      (11 - i);
  }

  digito =
    (soma * 10) % 11;

  if (digito === 10) {
    digito = 0;
  }

  if (
    digito !==
    Number(cpf[10])
  ) {
    throw new Error(
      'O CPF informado é inválido.'
    );
  }

  return cpf;
}


/* =========================================================
   TELEFONE
   ========================================================= */

function normalizarTelefone_(
  valor
) {
  const telefone =
    String(valor || '')
      .replace(/\D/g, '');

  if (!telefone) {
    return '';
  }

  if (
    telefone.length !== 10 &&
    telefone.length !== 11
  ) {
    throw new Error(
      'Informe um telefone com DDD.'
    );
  }

  return telefone;
}


/* =========================================================
   ESTADO CIVIL
   ========================================================= */

function normalizarEstadoCivil_(
  valor
) {
  if (!valor) {
    return '';
  }

  const texto =
    textoNormalizado_(valor);

  const mapa = {
    SOLTEIRO:
      'SOLTEIRO',

    SOLTEIRA:
      'SOLTEIRO',

    'SOLTEIRO(A)':
      'SOLTEIRO',

    CASADO:
      'CASADO',

    CASADA:
      'CASADO',

    'CASADO(A)':
      'CASADO',

    UNIAO_ESTAVEL:
      'UNIAO_ESTAVEL',

    'UNIAO ESTAVEL':
      'UNIAO_ESTAVEL',

    DIVORCIADO:
      'DIVORCIADO',

    DIVORCIADA:
      'DIVORCIADO',

    'DIVORCIADO(A)':
      'DIVORCIADO',

    SEPARADO:
      'SEPARADO',

    SEPARADA:
      'SEPARADO',

    'SEPARADO(A)':
      'SEPARADO',

    VIUVO:
      'VIUVO',

    VIUVA:
      'VIUVO',

    'VIUVO(A)':
      'VIUVO'
  };

  const resultado =
    mapa[texto];

  if (!resultado) {
    throw new Error(
      'Estado civil inválido.'
    );
  }

  return resultado;
}


function estadoCivilPossuiConjugeServidor_(
  estadoCivil
) {
  return [
    'CASADO',
    'UNIAO_ESTAVEL'
  ].includes(
    estadoCivil
  );
}


/* =========================================================
   ESCOLARIDADE
   ========================================================= */

function normalizarEscolaridade_(
  valor
) {
  if (!valor) {
    return '';
  }

  const texto =
    textoNormalizado_(valor);

  const valores = [
    'NAO_ALFABETIZADO',
    'ALFABETIZADO',
    'FUNDAMENTAL_INCOMPLETO',
    'FUNDAMENTAL_COMPLETO',
    'MEDIO_INCOMPLETO',
    'MEDIO_COMPLETO',
    'TECNICO',
    'SUPERIOR_INCOMPLETO',
    'SUPERIOR_COMPLETO',
    'POS_GRADUACAO'
  ];

  if (
    valores.includes(texto)
  ) {
    return texto;
  }

  const mapa = {
    'NAO ALFABETIZADO':
      'NAO_ALFABETIZADO',

    ALFABETIZADO:
      'ALFABETIZADO',

    'ENSINO FUNDAMENTAL INCOMPLETO':
      'FUNDAMENTAL_INCOMPLETO',

    'ENSINO FUNDAMENTAL COMPLETO':
      'FUNDAMENTAL_COMPLETO',

    'ENSINO MEDIO INCOMPLETO':
      'MEDIO_INCOMPLETO',

    'ENSINO MEDIO COMPLETO':
      'MEDIO_COMPLETO',

    'ENSINO TECNICO':
      'TECNICO',

    TECNICO:
      'TECNICO',

    'ENSINO SUPERIOR INCOMPLETO':
      'SUPERIOR_INCOMPLETO',

    'ENSINO SUPERIOR COMPLETO':
      'SUPERIOR_COMPLETO',

    'POS-GRADUACAO':
      'POS_GRADUACAO',

    'POS GRADUACAO':
      'POS_GRADUACAO'
  };

  const resultado =
    mapa[texto];

  if (!resultado) {
    throw new Error(
      'Escolaridade inválida.'
    );
  }

  return resultado;
}


/* =========================================================
   MUNICÍPIOS DE RORAIMA
   ========================================================= */

function normalizarMunicipioRoraima_(
  valor
) {
  const entrada =
    textoNormalizado_(valor);

  const municipios = {
    'ALTO ALEGRE':
      'Alto Alegre',

    AMAJARI:
      'Amajari',

    'BOA VISTA':
      'Boa Vista',

    BONFIM:
      'Bonfim',

    CANTA:
      'Cantá',

    CARACARAI:
      'Caracaraí',

    CAROEBE:
      'Caroebe',

    IRACEMA:
      'Iracema',

    MUCAJAI:
      'Mucajaí',

    NORMANDIA:
      'Normandia',

    PACARAIMA:
      'Pacaraima',

    RORAINOPOLIS:
      'Rorainópolis',

    'SAO JOAO DA BALIZA':
      'São João da Baliza',

    'SAO LUIZ':
      'São Luiz',

    UIRAMUTA:
      'Uiramutã'
  };

  const resultado =
    municipios[entrada];

  if (!resultado) {
    throw new Error(
      'Selecione um município válido de Roraima.'
    );
  }

  return resultado;
}


/* =========================================================
   OCUPAÇÃO
   ========================================================= */

function normalizarFormaOcupacao_(
  codigo,
  outro
) {
  const valor =
    textoNormalizado_(
      codigo
    );

  const permitidos = {
    PROPRIETARIO:
      'PROPRIETARIO',

    POSSEIRO:
      'POSSEIRO',

    ARRENDATARIO:
      'ARRENDATARIO',

    COMODATARIO:
      'COMODATARIO',

    ASSENTADO:
      'ASSENTADO',

    CONCESSIONARIO:
      'CONCESSIONARIO'
  };

  if (
    valor === 'OUTRO'
  ) {
    const descricao =
      String(
        outro || ''
      ).trim();

    if (!descricao) {
      throw new Error(
        'Informe a forma de ocupação.'
      );
    }

    return descricao;
  }

  if (
    permitidos[valor]
  ) {
    return permitidos[valor];
  }

  /*
   * Compatibilidade com cadastros antigos.
   */
  if (codigo) {
    return String(codigo).trim();
  }

  return '';
}


/* =========================================================
   DOCUMENTO DA PROPRIEDADE
   ========================================================= */

function normalizarDocumentoPropriedade_(
  codigo,
  outro
) {
  const valor =
    textoNormalizado_(
      codigo
    );

  const permitidos = [
    'TITULO_DEFINITIVO',
    'CONTRATO_COMPRA_VENDA',
    'CCU',
    'CDRU',
    'CAR',
    'DECLARACAO_POSSE',
    'CONTRATO_ARRENDAMENTO',
    'CONTRATO_COMODATO'
  ];

  if (
    valor === 'OUTRO'
  ) {
    const descricao =
      String(
        outro || ''
      ).trim();

    if (!descricao) {
      throw new Error(
        'Informe o documento existente.'
      );
    }

    return descricao;
  }

  if (
    permitidos.includes(
      valor
    )
  ) {
    return valor;
  }

  if (codigo) {
    return String(codigo).trim();
  }

  return '';
}


/* =========================================================
   COORDENADAS
   ========================================================= */

function normalizarCoordenada_(
  valor,
  tipo
) {
  if (
    valor === null ||
    valor === undefined ||
    String(valor).trim() === ''
  ) {
    return '';
  }

  const numero =
    Number(
      String(valor)
        .trim()
        .replace(',', '.')
    );

  if (
    !Number.isFinite(numero)
  ) {
    throw new Error(
      `${tipo} inválida.`
    );
  }

  if (
    tipo === 'Latitude' &&
    (
      numero < -90 ||
      numero > 90
    )
  ) {
    throw new Error(
      'A latitude deve estar entre -90 e 90.'
    );
  }

  if (
    tipo === 'Longitude' &&
    (
      numero < -180 ||
      numero > 180
    )
  ) {
    throw new Error(
      'A longitude deve estar entre -180 e 180.'
    );
  }

  return Number(
    numero.toFixed(6)
  );
}


/* =========================================================
   COMPLETUDE DO BENEFICIÁRIO
   ========================================================= */

function analisarCompletudeBeneficiario_(
  beneficiario
) {
  const requisitos = [
    [
      'Nome',
      Boolean(
        beneficiario.nome
      )
    ],

    [
      'CPF',
      Boolean(
        beneficiario.cpf
      )
    ],

    [
      'Telefone',
      Boolean(
        beneficiario.telefone
      )
    ],

    [
      'Nacionalidade',
      Boolean(
        beneficiario.nacionalidade
      )
    ],

    [
      'Naturalidade',
      Boolean(
        beneficiario.naturalidade
      )
    ],

    [
      'Estado civil',
      Boolean(
        beneficiario.estadoCivil
      )
    ],

    [
      'Data de nascimento',
      Boolean(
        beneficiario.dataNascimento
      )
    ],

    [
      'Profissão',
      Boolean(
        beneficiario.profissao
      )
    ],

    [
      'RG',
      Boolean(
        beneficiario.rg
      )
    ],

    [
      'Escolaridade',
      Boolean(
        beneficiario.escolaridade
      )
    ],

    [
      'Endereço',
      Boolean(
        beneficiario.endereco
      )
    ],

    [
      'Número de dependentes',
      beneficiario.dependentes !== ''
    ]
  ];

  if (
    estadoCivilPossuiConjugeServidor_(
      beneficiario.estadoCivil
    )
  ) {
    requisitos.push(
      [
        'Nome do cônjuge',
        Boolean(
          beneficiario.conjugeNome
        )
      ],

      [
        'RG do cônjuge',
        Boolean(
          beneficiario.conjugeRg
        )
      ],

      [
        'CPF do cônjuge',
        Boolean(
          beneficiario.conjugeCpf
        )
      ]
    );
  }

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
    requisitos.length
      ? Math.round(
          preenchidos /
          requisitos.length *
          100
        )
      : 0;

  return {
    completo:
      faltantes.length === 0,

    percentual,

    camposFaltantes:
      faltantes
  };
}


/* =========================================================
   COMPLETUDE DA PROPRIEDADE
   ========================================================= */

function analisarCompletudePropriedade_(
  propriedade
) {
  const requisitos = [
    [
      'Denominação',
      Boolean(
        propriedade.denominacao
      )
    ],

    [
      'Endereço / localização',
      Boolean(
        propriedade.endereco
      )
    ],

    [
      'Município',
      Boolean(
        propriedade.municipio
      )
    ],

    [
      'Estado',
      Boolean(
        propriedade.estado
      )
    ],

    [
      'Área total',
      propriedade.areaTotal !== ''
    ],

    [
      'Forma de ocupação',
      Boolean(
        propriedade.formaOcupacao
      )
    ],

    [
      'Tempo de exploração / moradia',
      Boolean(
        propriedade.tempoExploracao
      )
    ],

    [
      'Documento existente',
      Boolean(
        propriedade.documentoExistente
      )
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

  return {
    completo:
      faltantes.length === 0,

    percentual,

    camposFaltantes:
      faltantes
  };
}