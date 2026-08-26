function normalizarCpf_(cpf) {
  return String(
    cpf || ''
  ).replace(
    /\D/g,
    ''
  );
}


function converterDataHtml_(data) {
  const partes =
    String(data)
      .split('-');


  if (
    partes.length !== 3
  ) {
    throw new Error(
      'Data inválida.'
    );
  }


  const ano =
    Number(
      partes[0]
    );


  const mes =
    Number(
      partes[1]
    ) - 1;


  const dia =
    Number(
      partes[2]
    );


  const resultado =
    new Date(
      ano,
      mes,
      dia
    );


  if (
    resultado.getFullYear() !== ano ||
    resultado.getMonth() !== mes ||
    resultado.getDate() !== dia
  ) {
    throw new Error(
      'Data inválida.'
    );
  }


  return resultado;
}


function converterNumero_(valor) {
  if (
    valor === null ||
    valor === undefined ||
    String(valor).trim() === ''
  ) {
    return '';
  }


  const texto =
    String(valor).trim();


  let normalizado =
    texto;


  /*
   * Aceita:
   *
   * 50
   * 50,5
   * 50.5
   * 1.250,50
   */
  if (
    texto.includes(',') &&
    texto.includes('.')
  ) {
    normalizado =
      texto
        .replace(
          /\./g,
          ''
        )
        .replace(
          ',',
          '.'
        );

  } else if (
    texto.includes(',')
  ) {
    normalizado =
      texto.replace(
        ',',
        '.'
      );
  }


  const numero =
    Number(
      normalizado
    );


  if (
    !Number.isFinite(
      numero
    )
  ) {
    throw new Error(
      `Valor numérico inválido: ${valor}`
    );
  }


  return numero;
}


function converterInteiroNaoNegativo_(
  valor
) {
  if (
    valor === null ||
    valor === undefined ||
    String(valor).trim() === ''
  ) {
    return '';
  }


  const numero =
    Number(valor);


  if (
    !Number.isInteger(numero) ||
    numero < 0
  ) {
    throw new Error(
      'O número de dependentes deve ser um inteiro igual ou maior que zero.'
    );
  }


  return numero;
}


function formatarData_(valor) {
  if (
    !(valor instanceof Date)
  ) {
    return String(
      valor || ''
    );
  }


  return Utilities.formatDate(
    valor,
    Session.getScriptTimeZone(),
    'dd/MM/yyyy'
  );
}


function formatarDataHtml_(valor) {
  if (
    !(valor instanceof Date)
  ) {
    return '';
  }


  return Utilities.formatDate(
    valor,
    Session.getScriptTimeZone(),
    'yyyy-MM-dd'
  );
}


function formatarDataHora_(valor) {
  if (
    !(valor instanceof Date)
  ) {
    return String(
      valor || ''
    );
  }


  return Utilities.formatDate(
    valor,
    Session.getScriptTimeZone(),
    'dd/MM/yyyy HH:mm'
  );
}