export function textoNormalizado(valor: any): string {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

export function normalizarCpf(cpf: any): string {
  return String(cpf || "").replace(/\D/g, "");
}

export function validarCpf(valor: any): string {
  const cpf = normalizarCpf(valor);

  if (cpf.length !== 11) {
    throw new Error("O CPF deve possuir 11 dígitos.");
  }

  if (/^(\d)\1{10}$/.test(cpf)) {
    throw new Error("O CPF informado é inválido.");
  }

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += Number(cpf[i]) * (10 - i);
  }

  let digito = (soma * 10) % 11;
  if (digito === 10) {
    digito = 0;
  }

  if (digito !== Number(cpf[9])) {
    throw new Error("O CPF informado é inválido.");
  }

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += Number(cpf[i]) * (11 - i);
  }

  digito = (soma * 10) % 11;
  if (digito === 10) {
    digito = 0;
  }

  if (digito !== Number(cpf[10])) {
    throw new Error("O CPF informado é inválido.");
  }

  return cpf;
}

export function normalizarTelefone(valor: any): string {
  const telefone = String(valor || "").replace(/\D/g, "");

  if (!telefone) {
    return "";
  }

  if (telefone.length !== 10 && telefone.length !== 11) {
    throw new Error("Informe um telefone com DDD.");
  }

  return telefone;
}

export function normalizarEstadoCivil(valor: any): string {
  if (!valor) {
    return "";
  }

  const texto = textoNormalizado(valor);

  const mapa: Record<string, string> = {
    SOLTEIRO: "SOLTEIRO",
    SOLTEIRA: "SOLTEIRO",
    "SOLTEIRO(A)": "SOLTEIRO",
    CASADO: "CASADO",
    CASADA: "CASADO",
    "CASADO(A)": "CASADO",
    UNIAO_ESTAVEL: "UNIAO_ESTAVEL",
    "UNIAO ESTAVEL": "UNIAO_ESTAVEL",
    DIVORCIADO: "DIVORCIADO",
    DIVORCIADA: "DIVORCIADO",
    "DIVORCIADO(A)": "DIVORCIADO",
    SEPARADO: "SEPARADO",
    SEPARADA: "SEPARADO",
    "SEPARADO(A)": "SEPARADO",
    VIUVO: "VIUVO",
    VIUVA: "VIUVO",
    "VIUVO(A)": "VIUVO",
  };

  const resultado = mapa[texto];
  if (!resultado) {
    throw new Error("Estado civil inválido.");
  }

  return resultado;
}

export function estadoCivilPossuiConjuge(estadoCivil: string): boolean {
  return ["CASADO", "UNIAO_ESTAVEL"].includes(estadoCivil);
}

export function normalizarEscolaridade(valor: any): string {
  if (!valor) {
    return "";
  }

  const texto = textoNormalizado(valor);

  const valores = [
    "NAO_ALFABETIZADO",
    "ALFABETIZADO",
    "FUNDAMENTAL_INCOMPLETO",
    "FUNDAMENTAL_COMPLETO",
    "MEDIO_INCOMPLETO",
    "MEDIO_COMPLETO",
    "TECNICO",
    "SUPERIOR_INCOMPLETO",
    "SUPERIOR_COMPLETO",
    "POS_GRADUACAO",
  ];

  if (valores.includes(texto)) {
    return texto;
  }

  const mapa: Record<string, string> = {
    "NAO ALFABETIZADO": "NAO_ALFABETIZADO",
    ALFABETIZADO: "ALFABETIZADO",
    "ENSINO FUNDAMENTAL INCOMPLETO": "FUNDAMENTAL_INCOMPLETO",
    "ENSINO FUNDAMENTAL COMPLETO": "FUNDAMENTAL_COMPLETO",
    "ENSINO MEDIO INCOMPLETO": "MEDIO_INCOMPLETO",
    "ENSINO MEDIO COMPLETO": "MEDIO_COMPLETO",
    "ENSINO TECNICO": "TECNICO",
    TECNICO: "TECNICO",
    "ENSINO SUPERIOR INCOMPLETO": "SUPERIOR_INCOMPLETO",
    "ENSINO SUPERIOR COMPLETO": "SUPERIOR_COMPLETO",
    "POS-GRADUACAO": "POS_GRADUACAO",
    "POS GRADUACAO": "POS_GRADUACAO",
  };

  const resultado = mapa[texto];
  if (!resultado) {
    throw new Error("Escolaridade inválida.");
  }

  return resultado;
}

export function normalizarMunicipioRoraima(valor: any): string {
  const entrada = textoNormalizado(valor);

  const municipios: Record<string, string> = {
    "ALTO ALEGRE": "Alto Alegre",
    AMAJARI: "Amajari",
    "BOA VISTA": "Boa Vista",
    BONFIM: "Bonfim",
    CANTA: "Cantá",
    CARACARAI: "Caracaraí",
    CAROEBE: "Caroebe",
    IRACEMA: "Iracema",
    MUCAJAI: "Mucajaí",
    NORMANDIA: "Normandia",
    PACARAIMA: "Pacaraima",
    RORAINOPOLIS: "Rorainópolis",
    "SAO JOAO DA BALIZA": "São João da Baliza",
    "SAO LUIZ": "São Luiz",
    UIRAMUTA: "Uiramutã",
  };

  const resultado = municipios[entrada];
  if (!resultado) {
    throw new Error("Selecione um município válido de Roraima.");
  }

  return resultado;
}

export function normalizarFormaOcupacao(codigo: any, outro: any): string {
  const valor = textoNormalizado(codigo);

  const permitidos: Record<string, string> = {
    PROPRIETARIO: "PROPRIETARIO",
    POSSEIRO: "POSSEIRO",
    ARRENDATARIO: "ARRENDATARIO",
    COMODATARIO: "COMODATARIO",
    ASSENTADO: "ASSENTADO",
    CONCESSIONARIO: "CONCESSIONARIO",
  };

  if (valor === "OUTRO") {
    const descricao = String(outro || "").trim();
    if (!descricao) {
      throw new Error("Informe a forma de ocupação.");
    }
    return descricao;
  }

  if (permitidos[valor]) {
    return permitidos[valor];
  }

  if (codigo) {
    return String(codigo).trim();
  }

  return "";
}

export function normalizarDocumentoPropriedade(codigo: any, outro: any): string {
  const valor = textoNormalizado(codigo);

  const permitidos = [
    "TITULO_DEFINITIVO",
    "CONTRATO_COMPRA_VENDA",
    "CCU",
    "CDRU",
    "CAR",
    "DECLARACAO_POSSE",
    "CONTRATO_ARRENDAMENTO",
    "CONTRATO_COMODATO",
  ];

  if (valor === "OUTRO") {
    const descricao = String(outro || "").trim();
    if (!descricao) {
      throw new Error("Informe o documento existente.");
    }
    return descricao;
  }

  if (permitidos.includes(valor)) {
    return valor;
  }

  if (codigo) {
    return String(codigo).trim();
  }

  return "";
}

export function normalizarCoordenada(valor: any, tipo: "Latitude" | "Longitude"): number | "" {
  if (valor === null || valor === undefined || String(valor).trim() === "") {
    return "";
  }

  const numero = Number(String(valor).trim().replace(",", "."));

  if (!Number.isFinite(numero)) {
    throw new Error(`${tipo} inválida.`);
  }

  if (tipo === "Latitude" && (numero < -90 || numero > 90)) {
    throw new Error("A latitude deve estar entre -90 e 90.");
  }

  if (tipo === "Longitude" && (numero < -180 || numero > 180)) {
    throw new Error("A longitude deve estar entre -180 e 180.");
  }

  return Number(numero.toFixed(6));
}

export function converterNumero(valor: any): number | "" {
  if (valor === null || valor === undefined || String(valor).trim() === "") {
    return "";
  }

  const texto = String(valor).trim();
  let normalizado = texto;

  if (texto.includes(",") && texto.includes(".")) {
    normalizado = texto.replace(/\./g, "").replace(",", ".");
  } else if (texto.includes(",")) {
    normalizado = texto.replace(",", ".");
  }

  const numero = Number(normalizado);
  if (!Number.isFinite(numero)) {
    throw new Error(`Valor numérico inválido: ${valor}`);
  }

  return numero;
}

export function converterInteiroNaoNegativo(valor: any): number | "" {
  if (valor === null || valor === undefined || String(valor).trim() === "") {
    return "";
  }

  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < 0) {
    throw new Error("O número de dependentes deve ser um inteiro igual ou maior que zero.");
  }

  return numero;
}

export function converterDataHtml(data: any): Date {
  const partes = String(data).split("-");
  if (partes.length !== 3) {
    throw new Error("Data inválida.");
  }

  const ano = Number(partes[0]);
  const mes = Number(partes[1]) - 1;
  const dia = Number(partes[2]);

  const resultado = new Date(ano, mes, dia);
  if (
    resultado.getFullYear() !== ano ||
    resultado.getMonth() !== mes ||
    resultado.getDate() !== dia
  ) {
    throw new Error("Data inválida.");
  }

  return resultado;
}

export function formatarData(valor: any): string {
  if (!valor) return "";
  const d = valor instanceof Date ? valor : new Date(valor);
  if (isNaN(d.getTime())) return String(valor);
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

export function formatarDataHtml(valor: any): string {
  if (!valor) return "";
  const d = valor instanceof Date ? valor : new Date(valor);
  if (isNaN(d.getTime())) return "";
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const ano = d.getFullYear();
  return `${ano}-${mes}-${dia}`;
}

export function formatarDataHora(valor: any): string {
  if (!valor) return "";
  const d = valor instanceof Date ? valor : new Date(valor);
  if (isNaN(d.getTime())) return String(valor);
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const ano = d.getFullYear();
  const horas = String(d.getHours()).padStart(2, "0");
  const minutos = String(d.getMinutes()).padStart(2, "0");
  return `${dia}/${mes}/${ano} ${horas}:${minutos}`;
}

export function arredondarMoeda(valor: any): number {
  return Math.round((Number(valor) + Number.EPSILON) * 100) / 100;
}

export function analisarCompletudeBeneficiario(beneficiario: any) {
  const requisitos: [string, boolean][] = [
    ["Nome", Boolean(beneficiario.nome)],
    ["CPF", Boolean(beneficiario.cpf)],
    ["Telefone", Boolean(beneficiario.telefone)],
    ["Nacionalidade", Boolean(beneficiario.nacionalidade)],
    ["Naturalidade", Boolean(beneficiario.naturalidade)],
    ["Estado civil", Boolean(beneficiario.estadoCivil)],
    ["Data de nascimento", Boolean(beneficiario.dataNascimento)],
    ["Profissão", Boolean(beneficiario.profissao)],
    ["RG", Boolean(beneficiario.rg)],
    ["Escolaridade", Boolean(beneficiario.escolaridade)],
    ["Endereço", Boolean(beneficiario.endereco)],
    ["Número de dependentes", beneficiario.dependentes !== "" && beneficiario.dependentes !== undefined],
  ];

  if (estadoCivilPossuiConjuge(beneficiario.estadoCivil)) {
    requisitos.push(
      ["Nome do cônjuge", Boolean(beneficiario.conjugeNome)],
      ["RG do cônjuge", Boolean(beneficiario.conjugeRg)],
      ["CPF do cônjuge", Boolean(beneficiario.conjugeCpf)]
    );
  }

  const faltantes = requisitos.filter((item) => !item[1]).map((item) => item[0]);
  const preenchidos = requisitos.length - faltantes.length;
  const percentual = requisitos.length ? Math.round((preenchidos / requisitos.length) * 100) : 0;

  return {
    completo: faltantes.length === 0,
    percentual,
    camposFaltantes: faltantes,
  };
}

export function analisarCompletudePropriedade(propriedade: any) {
  const requisitos: [string, boolean][] = [
    ["Denominação", Boolean(propriedade.denominacao)],
    ["Endereço / localização", Boolean(propriedade.endereco)],
    ["Município", Boolean(propriedade.municipio)],
    ["Estado", Boolean(propriedade.estado)],
    ["Área total", propriedade.areaTotal !== "" && propriedade.areaTotal !== undefined],
    ["Forma de ocupação", Boolean(propriedade.formaOcupacao)],
    ["Tempo de exploração / moradia", Boolean(propriedade.tempoExploracao)],
    ["Documento existente", Boolean(propriedade.documentoExistente)],
  ];

  const faltantes = requisitos.filter((item) => !item[1]).map((item) => item[0]);
  const preenchidos = requisitos.length - faltantes.length;
  const percentual = Math.round((preenchidos / requisitos.length) * 100);

  return {
    completo: faltantes.length === 0,
    percentual,
    camposFaltantes: faltantes,
  };
}
