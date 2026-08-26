import { randomUUID } from "node:crypto";
import { db, Beneficiario, Propriedade, Proposta, PatrimonioItem, PatrimonioDivida, FluxoCaixaItem, FinanciamentoGarantia } from "./db.js";
import {
  validarCpf,
  normalizarCpf,
  normalizarTelefone,
  normalizarEstadoCivil,
  normalizarEscolaridade,
  normalizarMunicipioRoraima,
  normalizarFormaOcupacao,
  normalizarDocumentoPropriedade,
  normalizarCoordenada,
  converterNumero,
  converterInteiroNaoNegativo,
  converterDataHtml,
  formatarData,
  formatarDataHtml,
  formatarDataHora,
  arredondarMoeda,
  estadoCivilPossuiConjuge,
  analisarCompletudeBeneficiario,
  analisarCompletudePropriedade,
} from "./utils.js";

/* =========================================================
   BENEFICIÁRIOS
   ========================================================= */

export function salvarBeneficiario(dados: any) {
  if (!dados) {
    throw new Error("Dados não informados.");
  }

  const id = String(dados.id || "").trim();
  const nome = String(dados.nome || "").trim();
  const cpf = validarCpf(dados.cpf);
  const telefone = dados.telefone ? normalizarTelefone(dados.telefone) : "";
  const apelido = String(dados.apelido || "").trim();
  const nacionalidade = String(dados.nacionalidade || "").trim();
  const naturalidade = String(dados.naturalidade || "").trim();
  const estadoCivil = normalizarEstadoCivil(dados.estadoCivil);
  const dataNascimento = dados.dataNascimento ? formatarDataHtml(converterDataHtml(dados.dataNascimento)) : "";
  const profissao = String(dados.profissao || "").trim();
  const rg = String(dados.rg || "").trim();
  const escolaridade = normalizarEscolaridade(dados.escolaridade);
  const endereco = String(dados.endereco || "").trim();
  const dependentes = converterInteiroNaoNegativo(dados.dependentes);

  let conjugeNome = String(dados.conjugeNome || "").trim();
  let conjugeRg = String(dados.conjugeRg || "").trim();
  let conjugeCpf = dados.conjugeCpf ? validarCpf(dados.conjugeCpf) : "";

  if (!estadoCivilPossuiConjuge(estadoCivil)) {
    conjugeNome = "";
    conjugeRg = "";
    conjugeCpf = "";
  }

  if (conjugeCpf && conjugeCpf === cpf) {
    throw new Error("O CPF do cônjuge não pode ser igual ao CPF do beneficiário.");
  }

  if (nome.length < 3) {
    throw new Error("Informe o nome do beneficiário.");
  }

  const duplicado = db.beneficiarios.some(
    (b) => normalizarCpf(b.cpf) === cpf && b.id !== id
  );
  if (duplicado) {
    throw new Error("Já existe um beneficiário com esse CPF.");
  }

  const agora = new Date().toISOString();
  let beneficiarioId = id;

  if (id) {
    const index = db.beneficiarios.findIndex((b) => b.id === id);
    if (index < 0) {
      throw new Error("Beneficiário não encontrado.");
    }
    const existente = db.beneficiarios[index];
    db.beneficiarios[index] = {
      ...existente,
      nome,
      cpf,
      telefone,
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
      atualizadoEm: agora,
    };
  } else {
    beneficiarioId = randomUUID();
    db.beneficiarios.push({
      id: beneficiarioId,
      nome,
      cpf,
      telefone,
      criadoEm: agora,
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
      atualizadoEm: agora,
    });
  }

  if (Array.isArray(dados.referencias)) {
    db.referencias = db.referencias.filter((r) => r.beneficiarioId !== beneficiarioId);
    dados.referencias.forEach((ref: any, idx: number) => {
      const nomeRef = String(ref.nome || "").trim();
      const telRef = ref.telefone ? normalizarTelefone(ref.telefone) : "";
      if (nomeRef) {
        db.referencias.push({
          id: randomUUID(),
          beneficiarioId,
          ordem: idx + 1,
          nome: nomeRef,
          telefone: telRef,
          criadoEm: agora,
          atualizadoEm: agora,
        });
      }
    });
  }

  return buscarBeneficiario(beneficiarioId);
}

export function listarBeneficiarios() {
  return db.beneficiarios
    .map((b) => {
      const analise = analisarCompletudeBeneficiario(b);
      return {
        id: b.id,
        nome: b.nome,
        cpf: b.cpf,
        telefone: b.telefone,
        rg: b.rg,
        criadoEm: formatarDataHora(b.criadoEm),
        cadastroAmpliadoCompleto: analise.completo,
        percentualCadastro: analise.percentual,
        camposFaltantes: analise.camposFaltantes,
      };
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export function buscarBeneficiario(id: string) {
  const beneficiarioId = String(id || "").trim();
  if (!beneficiarioId) {
    throw new Error("ID do beneficiário não informado.");
  }

  const b = db.beneficiarios.find((item) => item.id === beneficiarioId);
  if (!b) {
    throw new Error("Beneficiário não encontrado.");
  }

  const analise = analisarCompletudeBeneficiario(b);
  const referencias = db.referencias
    .filter((r) => r.beneficiarioId === beneficiarioId)
    .sort((x, y) => x.ordem - y.ordem);

  return {
    ...b,
    criadoEm: formatarDataHora(b.criadoEm),
    atualizadoEm: formatarDataHora(b.atualizadoEm),
    referencias,
    cadastroAmpliadoCompleto: analise.completo,
    percentualCadastro: analise.percentual,
    camposFaltantes: analise.camposFaltantes,
  };
}

/* =========================================================
   PROPRIEDADES
   ========================================================= */

export function salvarPropriedade(dados: any) {
  if (!dados) {
    throw new Error("Dados da propriedade não informados.");
  }

  const id = String(dados.id || "").trim();
  const beneficiarioId = String(dados.beneficiarioId || "").trim();
  const denominacao = String(dados.denominacao || "").trim();
  const endereco = String(dados.endereco || "").trim();
  const municipio = dados.municipio ? normalizarMunicipioRoraima(dados.municipio) : "";
  const estado = "RORAIMA";
  const areaTotal = converterNumero(dados.areaTotal);
  const areaDisponivel = converterNumero(dados.areaDisponivel);
  const areaLegal = converterNumero(dados.areaLegal);
  const formaOcupacao = normalizarFormaOcupacao(
    dados.formaOcupacaoCodigo || dados.formaOcupacao,
    dados.formaOcupacaoOutro
  );
  const tempoExploracao = String(dados.tempoExploracao || "").trim();
  const modulo = String(dados.modulo || "").trim();
  const documentoExistente = normalizarDocumentoPropriedade(
    dados.documentoExistenteCodigo || dados.documentoExistente,
    dados.documentoExistenteOutro
  );
  const latitude = normalizarCoordenada(dados.latitude, "Latitude");
  const longitude = normalizarCoordenada(dados.longitude, "Longitude");

  if ((latitude === "" && longitude !== "") || (latitude !== "" && longitude === "")) {
    throw new Error("Informe latitude e longitude juntas.");
  }

  const confrontacaoNorte = String(dados.confrontacaoNorte || "").trim();
  const confrontacaoSul = String(dados.confrontacaoSul || "").trim();
  const confrontacaoLeste = String(dados.confrontacaoLeste || "").trim();
  const confrontacaoOeste = String(dados.confrontacaoOeste || "").trim();
  const administracao = String(dados.administracao || "").trim();

  if (!beneficiarioId) {
    throw new Error("Selecione o beneficiário.");
  }
  if (!denominacao) {
    throw new Error("Informe a denominação da propriedade.");
  }
  if (!municipio) {
    throw new Error("Informe o município da propriedade.");
  }

  const beneficiario = db.beneficiarios.find((b) => b.id === beneficiarioId);
  if (!beneficiario) {
    throw new Error("O beneficiário selecionado não existe.");
  }

  const agora = new Date().toISOString();
  let propriedadeId = id;

  if (id) {
    const index = db.propriedades.findIndex((p) => p.id === id);
    if (index < 0) {
      throw new Error("Propriedade não encontrada.");
    }
    if (db.propriedades[index].beneficiarioId !== beneficiarioId) {
      throw new Error("Não é permitido alterar o beneficiário de uma propriedade existente.");
    }
    db.propriedades[index] = {
      ...db.propriedades[index],
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
      areaLegal,
      administracao,
      atualizadoEm: agora,
    };
  } else {
    propriedadeId = randomUUID();
    db.propriedades.push({
      id: propriedadeId,
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
      criadoEm: agora,
      atualizadoEm: agora,
      areaLegal,
      administracao,
    });
  }

  return buscarPropriedade(propriedadeId);
}

export function listarPropriedades() {
  const benMap = new Map(db.beneficiarios.map((b) => [b.id, b]));

  return db.propriedades
    .map((p) => {
      const b = benMap.get(p.beneficiarioId) || ({} as any);
      const analise = analisarCompletudePropriedade(p);
      return {
        id: p.id,
        beneficiarioId: p.beneficiarioId,
        beneficiarioNome: b.nome || "",
        beneficiarioCpf: b.cpf || "",
        denominacao: p.denominacao,
        municipio: p.municipio,
        estado: p.estado,
        areaTotal: p.areaTotal,
        documentoExistente: p.documentoExistente,
        formaOcupacao: p.formaOcupacao,
        latitude: p.latitude,
        longitude: p.longitude,
        cadastroCompleto: analise.completo,
        percentualCadastro: analise.percentual,
        camposFaltantes: analise.camposFaltantes,
        criadoEm: formatarDataHora(p.criadoEm),
      };
    })
    .sort((a, b) => a.denominacao.localeCompare(b.denominacao, "pt-BR"));
}

export function buscarPropriedade(id: string) {
  const p = db.propriedades.find((item) => item.id === id);
  if (!p) {
    throw new Error("Propriedade não encontrada.");
  }
  const b = db.beneficiarios.find((item) => item.id === p.beneficiarioId) || ({} as any);
  const analise = analisarCompletudePropriedade(p);

  return {
    ...p,
    beneficiarioNome: b.nome || "",
    beneficiarioCpf: b.cpf || "",
    criadoEm: formatarDataHora(p.criadoEm),
    atualizadoEm: formatarDataHora(p.atualizadoEm),
    cadastroCompleto: analise.completo,
    percentualCadastro: analise.percentual,
    camposFaltantes: analise.camposFaltantes,
  };
}

/* =========================================================
   PROPOSTAS / PROCESSOS
   ========================================================= */

function gerarNumeroProposta(data: Date): string {
  const ano = data.getFullYear();
  const propostasAno = db.propostas.filter((p) => {
    const d = new Date(p.data);
    return !isNaN(d.getTime()) && d.getFullYear() === ano;
  });

  let maxSeq = 0;
  propostasAno.forEach((p) => {
    const m = String(p.numero || "").match(/^\d{4}-(\d+)$/);
    if (m) {
      const num = Number(m[1]);
      if (num > maxSeq) maxSeq = num;
    }
  });

  const seq = String(maxSeq + 1).padStart(4, "0");
  return `${ano}-${seq}`;
}

export function salvarProposta(dados: any) {
  if (!dados) {
    throw new Error("Dados da proposta não informados.");
  }

  const beneficiarioId = String(dados.beneficiarioId || "").trim();
  const propriedadeId = String(dados.propriedadeId || "").trim();
  const atividade = String(dados.atividade || "").trim();
  const dataStr = String(dados.data || "").trim();

  if (!beneficiarioId) throw new Error("Selecione um beneficiário.");
  if (!propriedadeId) throw new Error("Selecione uma propriedade.");
  if (!dataStr) throw new Error("Informe a data da proposta.");
  if (!atividade) throw new Error("Informe a atividade.");

  const b = db.beneficiarios.find((item) => item.id === beneficiarioId);
  if (!b) throw new Error("O beneficiário selecionado não existe.");

  const p = db.propriedades.find((item) => item.id === propriedadeId);
  if (!p) throw new Error("Propriedade não encontrada.");
  if (p.beneficiarioId !== beneficiarioId) {
    throw new Error("A propriedade selecionada não pertence ao beneficiário.");
  }

  const dataProposta = converterDataHtml(dataStr);
  const numero = gerarNumeroProposta(dataProposta);
  const id = randomUUID();
  const agora = new Date().toISOString();

  db.propostas.push({
    id,
    numero,
    beneficiarioId,
    data: dataProposta.toISOString(),
    atividade,
    status: "EM ELABORAÇÃO",
    criadoEm: agora,
    atualizadoEm: agora,
    propriedadeId,
  });

  return {
    id,
    numero,
    beneficiarioId,
    beneficiarioNome: b.nome,
    beneficiarioCpf: b.cpf,
    propriedadeId,
    propriedadeNome: p.denominacao,
    propriedadeMunicipio: p.municipio,
    data: formatarData(dataProposta),
    atividade,
    status: "EM ELABORAÇÃO",
  };
}

export function listarPropostas() {
  const benMap = new Map(db.beneficiarios.map((b) => [b.id, b]));
  const propMap = new Map(db.propriedades.map((p) => [p.id, p]));

  return db.propostas
    .map((prop) => {
      const b = benMap.get(prop.beneficiarioId) || ({} as any);
      const p = propMap.get(prop.propriedadeId) || ({} as any);
      const resumo = calcularProgressoProposta(prop.id);

      return {
        id: prop.id,
        numero: prop.numero,
        beneficiarioId: prop.beneficiarioId,
        beneficiarioNome: b.nome || "",
        beneficiarioCpf: b.cpf || "",
        propriedadeId: prop.propriedadeId,
        propriedadeNome: p.denominacao || "",
        propriedadeMunicipio: p.municipio || "",
        data: formatarData(prop.data),
        atividade: prop.atividade,
        status: prop.status,
        progresso: resumo,
        criadoEm: formatarDataHora(prop.criadoEm),
      };
    })
    .sort((a, b) => b.numero.localeCompare(a.numero));
}

export function buscarProposta(id: string) {
  const propostaId = String(id || "").trim();
  const prop = db.propostas.find((p) => p.id === propostaId);
  if (!prop) {
    throw new Error("Processo / Proposta não encontrado.");
  }
  const b = db.beneficiarios.find((item) => item.id === prop.beneficiarioId) || ({} as any);
  const p = db.propriedades.find((item) => item.id === prop.propriedadeId) || ({} as any);
  const resumo = calcularProgressoProposta(propostaId);

  return {
    id: prop.id,
    numero: prop.numero,
    beneficiarioId: prop.beneficiarioId,
    beneficiarioNome: b.nome || "",
    beneficiarioCpf: b.cpf || "",
    beneficiarioTelefone: b.telefone || "",
    propriedadeId: prop.propriedadeId,
    propriedadeNome: p.denominacao || "",
    propriedadeMunicipio: p.municipio || "",
    propriedadeAreaTotal: p.areaTotal || 0,
    data: formatarData(prop.data),
    dataHtml: formatarDataHtml(prop.data),
    atividade: prop.atividade,
    status: prop.status,
    progresso: resumo,
    criadoEm: formatarDataHora(prop.criadoEm),
    atualizadoEm: formatarDataHora(prop.atualizadoEm),
  };
}

function calcularProgressoProposta(propostaId: string) {
  const prop = db.propostas.find((p) => p.id === propostaId);
  if (!prop) return null;

  const b = db.beneficiarios.find((item) => item.id === prop.beneficiarioId);
  const p = db.propriedades.find((item) => item.id === prop.propriedadeId);

  const bCompleto = b ? analisarCompletudeBeneficiario(b).completo : false;
  const pCompleto = p ? analisarCompletudePropriedade(p).completo : false;

  let patStatus = "PENDENTE";
  const pat = db.patrimonioLevantamentos.find((l) => l.propostaId === propostaId);
  if (pat) {
    patStatus = pat.status;
  }

  let idStatus = "PENDENTE";
  const ident = db.propostaIdentificacoes.find((i) => i.propostaId === propostaId);
  if (ident) {
    idStatus = ident.status;
    if (pat && pat.atualizadoEm && ident.patrimonioRevisadoEm) {
      if (new Date(pat.atualizadoEm) > new Date(ident.patrimonioRevisadoEm)) {
        idStatus = "EM_REVISAO";
      }
    }
  }

  let fcStatus = "PENDENTE";
  const fc = db.fluxoCaixa.find((f) => f.propostaId === propostaId);
  if (fc) {
    fcStatus = fc.status;
    if (ident && ident.atualizadoEm && fc.identificacaoRevisadaEm) {
      if (new Date(ident.atualizadoEm) > new Date(fc.identificacaoRevisadaEm)) {
        fcStatus = "EM_REVISAO";
      }
    }
  }

  let finStatus = "PENDENTE";
  const fin = db.financiamentos.find((f) => f.propostaId === propostaId);
  if (fin) {
    finStatus = fin.status;
    if (fc && fc.atualizadoEm && fin.fluxoRevisadoEm) {
      if (new Date(fc.atualizadoEm) > new Date(fin.fluxoRevisadoEm)) {
        finStatus = "EM_REVISAO";
      }
    }
  }

  const etapas = [
    { nome: "Dados gerais", status: "CONCLUIDO", percentual: 100 },
    { nome: "Beneficiário", status: bCompleto ? "CONCLUIDO" : "EM_REVISAO", percentual: b ? analisarCompletudeBeneficiario(b).percentual : 0 },
    { nome: "Propriedade", status: pCompleto ? "CONCLUIDO" : "EM_REVISAO", percentual: p ? analisarCompletudePropriedade(p).percentual : 0 },
    { nome: "Patrimônio", status: patStatus, percentual: patStatus === "CONCLUIDO" ? 100 : patStatus === "EM_REVISAO" ? 75 : 0 },
    { nome: "Identificação", status: idStatus, percentual: idStatus === "CONCLUIDO" ? 100 : idStatus === "EM_REVISAO" ? 75 : 0 },
    { nome: "Fluxo de Caixa", status: fcStatus, percentual: fcStatus === "CONCLUIDO" ? 100 : fcStatus === "EM_REVISAO" ? 75 : 0 },
    { nome: "Financiamento", status: finStatus, percentual: finStatus === "CONCLUIDO" ? 100 : finStatus === "EM_REVISAO" ? 75 : 0 },
    { nome: "Documentos", status: "PENDENTE", percentual: 0 },
  ];

  const concluidas = etapas.filter((e) => e.status === "CONCLUIDO").length;
  const percentualGeral = Math.round((concluidas / etapas.length) * 100);

  return {
    etapas,
    concluidas,
    total: etapas.length,
    percentual: percentualGeral,
  };
}

/* =========================================================
   PATRIMÔNIO
   ========================================================= */

const CATEGORIAS_PATRIMONIO = [
  "TERRA_COBERTURAS",
  "CONSTRUCOES_CIVIS",
  "ESTRUTURA_AGROPECUARIA",
  "INFRAESTRUTURA",
  "MAQUINAS_EQUIPAMENTOS",
  "SEMOVENTES",
  "OUTROS_BENS_URBANOS",
];

export function obterPatrimonio(propostaId: string) {
  const pId = String(propostaId || "").trim();
  let lev = db.patrimonioLevantamentos.find((l) => l.propostaId === pId);
  const agora = new Date().toISOString();

  if (!lev) {
    lev = {
      id: randomUUID(),
      propostaId: pId,
      status: "PENDENTE",
      dividasConfirmadas: false,
      concluidoEm: null,
      criadoEm: agora,
      atualizadoEm: agora,
    };
    db.patrimonioLevantamentos.push(lev);
  }

  const itens = db.patrimonioItens.filter((i) => i.propostaId === pId);
  const dividas = db.patrimonioDividas.filter((d) => d.propostaId === pId);

  const porCategoria: Record<string, number> = {};
  CATEGORIAS_PATRIMONIO.forEach((cat) => (porCategoria[cat] = 0));

  itens.forEach((it) => {
    if (porCategoria[it.categoria] !== undefined) {
      porCategoria[it.categoria] += it.valorTotal;
    }
  });

  const patrimonioBruto =
    porCategoria.TERRA_COBERTURAS +
    porCategoria.CONSTRUCOES_CIVIS +
    porCategoria.ESTRUTURA_AGROPECUARIA +
    porCategoria.INFRAESTRUTURA +
    porCategoria.MAQUINAS_EQUIPAMENTOS +
    porCategoria.SEMOVENTES;

  const outrosBensUrbanos = porCategoria.OUTROS_BENS_URBANOS;
  const totalDividas = dividas.reduce((acc, d) => acc + (d.saldoDevedor || 0), 0);
  const patrimonioLiquido = patrimonioBruto - totalDividas;
  const totalInformado = patrimonioBruto + outrosBensUrbanos;

  const faltantes: string[] = [];
  if (itens.length === 0) faltantes.push("Pelo menos 1 item patrimonial");
  if (!lev.dividasConfirmadas) faltantes.push("Confirmação da situação de dívidas");

  const completo = faltantes.length === 0;

  return {
    levantamento: {
      id: lev.id,
      propostaId: lev.propostaId,
      status: lev.status,
      dividasConfirmadas: lev.dividasConfirmadas,
      concluidoEm: formatarDataHora(lev.concluidoEm),
      atualizadoEm: formatarDataHora(lev.atualizadoEm),
    },
    itens: itens.map((it) => ({
      ...it,
      criadoEm: formatarDataHora(it.criadoEm),
      atualizadoEm: formatarDataHora(it.atualizadoEm),
    })),
    dividas: dividas.map((d) => ({
      ...d,
      criadoEm: formatarDataHora(d.criadoEm),
      atualizadoEm: formatarDataHora(d.atualizadoEm),
    })),
    totais: {
      porCategoria,
      patrimonioBruto: arredondarMoeda(patrimonioBruto),
      outrosBensUrbanos: arredondarMoeda(outrosBensUrbanos),
      totalDividas: arredondarMoeda(totalDividas),
      patrimonioLiquido: arredondarMoeda(patrimonioLiquido),
      totalInformado: arredondarMoeda(totalInformado),
    },
    completo,
    percentual: completo ? 100 : itens.length > 0 || lev.dividasConfirmadas ? 50 : 0,
    camposFaltantes: faltantes,
  };
}

export function salvarItemPatrimonio(dados: any) {
  if (!dados) throw new Error("Dados do item patrimonial não informados.");
  const propostaId = String(dados.propostaId || "").trim();
  const categoria = String(dados.categoria || "").trim();
  const especificacao = String(dados.especificacao || "").trim();
  const unidade = String(dados.unidade || "").trim();
  const quantidade = Number(dados.quantidade || 0);
  const valorUnitario = Number(dados.valorUnitario || 0);
  const id = String(dados.id || "").trim();

  if (!propostaId) throw new Error("ID da proposta não informado.");
  if (!CATEGORIAS_PATRIMONIO.includes(categoria)) throw new Error("Categoria patrimonial inválida.");
  if (!especificacao) throw new Error("Informe a especificação do item.");
  if (!unidade) throw new Error("Informe a unidade.");
  if (quantidade <= 0) throw new Error("A quantidade deve ser maior que zero.");
  if (valorUnitario < 0) throw new Error("O valor unitário não pode ser negativo.");

  const valorTotal = arredondarMoeda(quantidade * valorUnitario);
  const agora = new Date().toISOString();

  if (id) {
    const idx = db.patrimonioItens.findIndex((i) => i.id === id && i.propostaId === propostaId);
    if (idx >= 0) {
      db.patrimonioItens[idx] = {
        ...db.patrimonioItens[idx],
        categoria,
        especificacao,
        unidade,
        quantidade,
        valorUnitario,
        valorTotal,
        atualizadoEm: agora,
      };
    }
  } else {
    db.patrimonioItens.push({
      id: randomUUID(),
      propostaId,
      categoria,
      especificacao,
      unidade,
      quantidade,
      valorUnitario,
      valorTotal,
      criadoEm: agora,
      atualizadoEm: agora,
    });
  }

  const lev = db.patrimonioLevantamentos.find((l) => l.propostaId === propostaId);
  if (lev) {
    lev.atualizadoEm = agora;
    if (lev.status === "CONCLUIDO") {
      lev.status = "EM_REVISAO";
    }
  }

  return obterPatrimonio(propostaId);
}

export function excluirItemPatrimonio(propostaId: string, itemId: string) {
  const pId = String(propostaId || "").trim();
  const iId = String(itemId || "").trim();

  db.patrimonioItens = db.patrimonioItens.filter((i) => !(i.id === iId && i.propostaId === pId));
  const agora = new Date().toISOString();
  const lev = db.patrimonioLevantamentos.find((l) => l.propostaId === pId);
  if (lev) {
    lev.atualizadoEm = agora;
    if (lev.status === "CONCLUIDO") {
      lev.status = "EM_REVISAO";
    }
  }

  return obterPatrimonio(pId);
}

export function salvarDividaPatrimonio(dados: any) {
  if (!dados) throw new Error("Dados da dívida não informados.");
  const propostaId = String(dados.propostaId || "").trim();
  const credor = String(dados.credor || "").trim();
  const finalidade = String(dados.finalidade || "").trim();
  const vencimento = String(dados.vencimento || "").trim();
  const saldoDevedor = Number(dados.saldoDevedor || 0);
  const id = String(dados.id || "").trim();

  if (!propostaId) throw new Error("ID da proposta não informado.");
  if (!credor) throw new Error("Informe o credor.");
  if (saldoDevedor < 0) throw new Error("O saldo devedor não pode ser negativo.");

  const agora = new Date().toISOString();

  if (id) {
    const idx = db.patrimonioDividas.findIndex((d) => d.id === id && d.propostaId === propostaId);
    if (idx >= 0) {
      db.patrimonioDividas[idx] = {
        ...db.patrimonioDividas[idx],
        credor,
        finalidade,
        vencimento,
        saldoDevedor,
        atualizadoEm: agora,
      };
    }
  } else {
    db.patrimonioDividas.push({
      id: randomUUID(),
      propostaId,
      credor,
      finalidade,
      vencimento,
      saldoDevedor,
      criadoEm: agora,
      atualizadoEm: agora,
    });
  }

  const lev = db.patrimonioLevantamentos.find((l) => l.propostaId === propostaId);
  if (lev) {
    lev.atualizadoEm = agora;
    if (lev.status === "CONCLUIDO") {
      lev.status = "EM_REVISAO";
    }
  }

  return obterPatrimonio(propostaId);
}

export function excluirDividaPatrimonio(propostaId: string, dividaId: string) {
  const pId = String(propostaId || "").trim();
  const dId = String(dividaId || "").trim();

  db.patrimonioDividas = db.patrimonioDividas.filter((d) => !(d.id === dId && d.propostaId === pId));
  const agora = new Date().toISOString();
  const lev = db.patrimonioLevantamentos.find((l) => l.propostaId === pId);
  if (lev) {
    lev.atualizadoEm = agora;
    if (lev.status === "CONCLUIDO") {
      lev.status = "EM_REVISAO";
    }
  }

  return obterPatrimonio(pId);
}

export function salvarRascunhoPatrimonio(propostaId: string, dividasConfirmadas: boolean) {
  const pId = String(propostaId || "").trim();
  let lev = db.patrimonioLevantamentos.find((l) => l.propostaId === pId);
  const agora = new Date().toISOString();

  if (!lev) {
    lev = {
      id: randomUUID(),
      propostaId: pId,
      status: "RASCUNHO",
      dividasConfirmadas: Boolean(dividasConfirmadas),
      concluidoEm: null,
      criadoEm: agora,
      atualizadoEm: agora,
    };
    db.patrimonioLevantamentos.push(lev);
  } else {
    lev.dividasConfirmadas = Boolean(dividasConfirmadas);
    if (lev.status !== "CONCLUIDO") {
      lev.status = "RASCUNHO";
    }
    lev.atualizadoEm = agora;
  }

  return obterPatrimonio(pId);
}

export function concluirLevantamentoPatrimonio(propostaId: string) {
  const pId = String(propostaId || "").trim();
  const p = obterPatrimonio(pId);

  if (!p.completo) {
    throw new Error(`Não é possível concluir o patrimônio: ${p.camposFaltantes.join(", ")}.`);
  }

  const lev = db.patrimonioLevantamentos.find((l) => l.propostaId === pId)!;
  const agora = new Date().toISOString();
  lev.status = "CONCLUIDO";
  lev.concluidoEm = agora;
  lev.atualizadoEm = agora;

  return obterPatrimonio(pId);
}

/* =========================================================
   IDENTIFICAÇÃO DA PROPOSTA
   ========================================================= */

export function obterIdentificacaoProposta(propostaId: string) {
  const pId = String(propostaId || "").trim();
  let ident = db.propostaIdentificacoes.find((i) => i.propostaId === pId);
  const agora = new Date().toISOString();

  if (!ident) {
    ident = {
      id: randomUUID(),
      propostaId: pId,
      finalidade: "",
      mercado: "",
      faturamentoUltimoAno: 0,
      analiseLocalizacao: "",
      consideracoes: "",
      empregosConfirmados: false,
      usosFontesConfirmados: false,
      status: "PENDENTE",
      patrimonioRevisadoEm: null,
      concluidoEm: null,
      criadoEm: agora,
      atualizadoEm: agora,
    };
    db.propostaIdentificacoes.push(ident);
  }

  const empregos = db.propostaEmpregos.filter((e) => e.propostaId === pId);
  const usosFontes = db.propostaUsosFontes.filter((u) => u.propostaId === pId);

  const pat = db.patrimonioLevantamentos.find((l) => l.propostaId === pId);
  let statusEfetivo = ident.status;
  let patrimonioRevisado = true;

  if (ident.status === "CONCLUIDO" && pat) {
    if (pat.status !== "CONCLUIDO" || (ident.patrimonioRevisadoEm && new Date(pat.atualizadoEm) > new Date(ident.patrimonioRevisadoEm))) {
      statusEfetivo = "EM_REVISAO";
      patrimonioRevisado = false;
    }
  }

  const faltantes: string[] = [];
  if (!ident.finalidade) faltantes.push("Finalidade da proposta");
  if (!ident.mercado) faltantes.push("Mercado consumidor");
  if (!ident.analiseLocalizacao) faltantes.push("Análise da localização");
  if (!ident.empregosConfirmados) faltantes.push("Confirmação do quadro de empregos");
  if (!ident.usosFontesConfirmados) faltantes.push("Confirmação de usos e fontes");
  if (!pat || pat.status !== "CONCLUIDO") faltantes.push("Patrimônio concluído");

  const completo = faltantes.length === 0;

  return {
    identificacao: {
      ...ident,
      criadoEm: formatarDataHora(ident.criadoEm),
      atualizadoEm: formatarDataHora(ident.atualizadoEm),
      concluidoEm: formatarDataHora(ident.concluidoEm),
      patrimonioRevisadoEm: formatarDataHora(ident.patrimonioRevisadoEm),
    },
    empregos,
    usosFontes,
    statusEfetivo,
    patrimonioRevisado,
    completo,
    percentual: completo ? 100 : 50,
    camposFaltantes: faltantes,
  };
}

export function salvarIdentificacaoProposta(dados: any) {
  if (!dados) throw new Error("Dados da identificação não informados.");
  const propostaId = String(dados.propostaId || "").trim();
  if (!propostaId) throw new Error("ID da proposta não informado.");

  let ident = db.propostaIdentificacoes.find((i) => i.propostaId === propostaId);
  const agora = new Date().toISOString();

  if (!ident) {
    ident = {
      id: randomUUID(),
      propostaId,
      finalidade: String(dados.finalidade || "").trim(),
      mercado: String(dados.mercado || "").trim(),
      faturamentoUltimoAno: Number(dados.faturamentoUltimoAno || 0),
      analiseLocalizacao: String(dados.analiseLocalizacao || "").trim(),
      consideracoes: String(dados.consideracoes || "").trim(),
      empregosConfirmados: Boolean(dados.empregosConfirmados),
      usosFontesConfirmados: Boolean(dados.usosFontesConfirmados),
      status: "RASCUNHO",
      patrimonioRevisadoEm: null,
      concluidoEm: null,
      criadoEm: agora,
      atualizadoEm: agora,
    };
    db.propostaIdentificacoes.push(ident);
  } else {
    ident.finalidade = String(dados.finalidade || "").trim();
    ident.mercado = String(dados.mercado || "").trim();
    ident.faturamentoUltimoAno = Number(dados.faturamentoUltimoAno || 0);
    ident.analiseLocalizacao = String(dados.analiseLocalizacao || "").trim();
    ident.consideracoes = String(dados.consideracoes || "").trim();
    ident.empregosConfirmados = Boolean(dados.empregosConfirmados);
    ident.usosFontesConfirmados = Boolean(dados.usosFontesConfirmados);
    if (ident.status === "CONCLUIDO") {
      ident.status = "EM_REVISAO";
    } else {
      ident.status = "RASCUNHO";
    }
    ident.atualizadoEm = agora;
  }

  if (Array.isArray(dados.empregos)) {
    db.propostaEmpregos = db.propostaEmpregos.filter((e) => e.propostaId !== propostaId);
    dados.empregos.forEach((emp: any) => {
      const cat = String(emp.categoria || "").trim();
      const atual = Number(emp.faseAtual || 0);
      const exp = Number(emp.faseExpansao || 0);
      if (cat) {
        db.propostaEmpregos.push({
          id: randomUUID(),
          propostaId,
          categoria: cat,
          faseAtual: atual,
          faseExpansao: exp,
          total: atual + exp,
          criadoEm: agora,
          atualizadoEm: agora,
        });
      }
    });
  }

  if (Array.isArray(dados.usosFontes)) {
    db.propostaUsosFontes = db.propostaUsosFontes.filter((u) => u.propostaId !== propostaId);
    dados.usosFontes.forEach((uf: any) => {
      const tipo = uf.tipo === "FONTE" ? "FONTE" : "USO";
      const cat = String(uf.categoria || "").trim();
      const val = Number(uf.valor || 0);
      if (cat) {
        db.propostaUsosFontes.push({
          id: randomUUID(),
          propostaId,
          tipo,
          categoria: cat,
          valor: val,
          criadoEm: agora,
          atualizadoEm: agora,
        });
      }
    });
  }

  return obterIdentificacaoProposta(propostaId);
}

export function concluirIdentificacaoProposta(propostaId: string) {
  const pId = String(propostaId || "").trim();
  const identObj = obterIdentificacaoProposta(pId);

  if (!identObj.completo) {
    throw new Error(`Não é possível concluir a identificação: ${identObj.camposFaltantes.join(", ")}.`);
  }

  const pat = db.patrimonioLevantamentos.find((l) => l.propostaId === pId);
  const ident = db.propostaIdentificacoes.find((i) => i.propostaId === pId)!;
  const agora = new Date().toISOString();

  ident.status = "CONCLUIDO";
  ident.concluidoEm = agora;
  ident.atualizadoEm = agora;
  ident.patrimonioRevisadoEm = pat ? String(pat.atualizadoEm) : agora;

  return obterIdentificacaoProposta(pId);
}

/* =========================================================
   FLUXO DE CAIXA
   ========================================================= */

export function obterFluxoCaixa(propostaId: string) {
  const pId = String(propostaId || "").trim();
  let fc = db.fluxoCaixa.find((f) => f.propostaId === pId);
  const agora = new Date().toISOString();

  if (!fc) {
    fc = {
      id: randomUUID(),
      propostaId: pId,
      status: "PENDENTE",
      projecaoConfirmada: false,
      identificacaoRevisadaEm: null,
      concluidoEm: null,
      criadoEm: agora,
      atualizadoEm: agora,
    };
    db.fluxoCaixa.push(fc);
  }

  const itens = db.fluxoCaixaItens.filter((i) => i.propostaId === pId);
  const ident = db.propostaIdentificacoes.find((i) => i.propostaId === pId);

  let statusEfetivo = fc.status;
  let identificacaoRevisada = true;

  if (fc.status === "CONCLUIDO" && ident) {
    if (ident.status !== "CONCLUIDO" || (fc.identificacaoRevisadaEm && new Date(ident.atualizadoEm) > new Date(fc.identificacaoRevisadaEm))) {
      statusEfetivo = "EM_REVISAO";
      identificacaoRevisada = false;
    }
  }

  const totaisPorAno: any = {
    receitas: [0, 0, 0, 0, 0, 0, 0],
    custosVariaveis: [0, 0, 0, 0, 0, 0, 0],
    custosFixos: [0, 0, 0, 0, 0, 0, 0],
    despesas: [0, 0, 0, 0, 0, 0, 0],
    saldoOperacional: [0, 0, 0, 0, 0, 0, 0],
    saldoAcumulado: [0, 0, 0, 0, 0, 0, 0],
  };

  itens.forEach((it) => {
    const anos = [it.ano1, it.ano2, it.ano3, it.ano4, it.ano5, it.ano6, it.ano7];
    if (it.tipo === "RECEITA") {
      anos.forEach((v, idx) => (totaisPorAno.receitas[idx] += v));
    } else if (it.tipo === "CUSTO_VARIAVEL") {
      anos.forEach((v, idx) => (totaisPorAno.custosVariaveis[idx] += v));
    } else if (it.tipo === "CUSTO_FIXO") {
      anos.forEach((v, idx) => (totaisPorAno.custosFixos[idx] += v));
    }
  });

  let acumulado = 0;
  for (let i = 0; i < 7; i++) {
    totaisPorAno.despesas[i] = totaisPorAno.custosVariaveis[i] + totaisPorAno.custosFixos[i];
    totaisPorAno.saldoOperacional[i] = totaisPorAno.receitas[i] - totaisPorAno.despesas[i];
    acumulado += totaisPorAno.saldoOperacional[i];
    totaisPorAno.saldoAcumulado[i] = acumulado;
  }

  const temReceita = itens.some((it) => it.tipo === "RECEITA");
  const temCusto = itens.some((it) => it.tipo === "CUSTO_VARIAVEL" || it.tipo === "CUSTO_FIXO");

  const faltantes: string[] = [];
  if (!temReceita) faltantes.push("Pelo menos 1 item de receita");
  if (!temCusto) faltantes.push("Pelo menos 1 item de custo/despesa");
  if (!fc.projecaoConfirmada) faltantes.push("Confirmação das projeções de 7 anos");
  if (!ident || ident.status !== "CONCLUIDO") faltantes.push("Identificação concluída");

  const completo = faltantes.length === 0;

  return {
    fluxo: {
      ...fc,
      criadoEm: formatarDataHora(fc.criadoEm),
      atualizadoEm: formatarDataHora(fc.atualizadoEm),
      concluidoEm: formatarDataHora(fc.concluidoEm),
      identificacaoRevisadaEm: formatarDataHora(fc.identificacaoRevisadaEm),
    },
    itens: itens.map((it) => ({
      ...it,
      criadoEm: formatarDataHora(it.criadoEm),
      atualizadoEm: formatarDataHora(it.atualizadoEm),
    })),
    totaisPorAno,
    statusEfetivo,
    identificacaoRevisada,
    completo,
    percentual: completo ? 100 : itens.length > 0 ? 50 : 0,
    camposFaltantes: faltantes,
  };
}

export function salvarItemFluxoCaixa(dados: any) {
  if (!dados) throw new Error("Dados do item de fluxo de caixa não informados.");
  const propostaId = String(dados.propostaId || "").trim();
  const tipo = dados.tipo;
  const descricao = String(dados.descricao || "").trim();
  const unidade = String(dados.unidade || "").trim();
  const quantidade = Number(dados.quantidade || 0);
  const valorUnitario = Number(dados.valorUnitario || 0);
  const id = String(dados.id || "").trim();

  if (!propostaId) throw new Error("ID da proposta não informado.");
  if (!["RECEITA", "CUSTO_VARIAVEL", "CUSTO_FIXO"].includes(tipo)) {
    throw new Error("Tipo de item de fluxo de caixa inválido.");
  }
  if (!descricao) throw new Error("Informe a descrição do item.");

  const ano1 = Number(dados.ano1 || 0);
  const ano2 = Number(dados.ano2 || 0);
  const ano3 = Number(dados.ano3 || 0);
  const ano4 = Number(dados.ano4 || 0);
  const ano5 = Number(dados.ano5 || 0);
  const ano6 = Number(dados.ano6 || 0);
  const ano7 = Number(dados.ano7 || 0);

  const agora = new Date().toISOString();

  if (id) {
    const idx = db.fluxoCaixaItens.findIndex((i) => i.id === id && i.propostaId === propostaId);
    if (idx >= 0) {
      db.fluxoCaixaItens[idx] = {
        ...db.fluxoCaixaItens[idx],
        tipo,
        descricao,
        unidade,
        quantidade,
        valorUnitario,
        ano1,
        ano2,
        ano3,
        ano4,
        ano5,
        ano6,
        ano7,
        atualizadoEm: agora,
      };
    }
  } else {
    db.fluxoCaixaItens.push({
      id: randomUUID(),
      propostaId,
      tipo,
      descricao,
      unidade,
      quantidade,
      valorUnitario,
      ano1,
      ano2,
      ano3,
      ano4,
      ano5,
      ano6,
      ano7,
      criadoEm: agora,
      atualizadoEm: agora,
    });
  }

  const fc = db.fluxoCaixa.find((f) => f.propostaId === propostaId);
  if (fc) {
    fc.atualizadoEm = agora;
    if (fc.status === "CONCLUIDO") {
      fc.status = "EM_REVISAO";
    }
  }

  return obterFluxoCaixa(propostaId);
}

export function excluirItemFluxoCaixa(propostaId: string, itemId: string) {
  const pId = String(propostaId || "").trim();
  const iId = String(itemId || "").trim();

  db.fluxoCaixaItens = db.fluxoCaixaItens.filter((i) => !(i.id === iId && i.propostaId === pId));
  const agora = new Date().toISOString();
  const fc = db.fluxoCaixa.find((f) => f.propostaId === pId);
  if (fc) {
    fc.atualizadoEm = agora;
    if (fc.status === "CONCLUIDO") {
      fc.status = "EM_REVISAO";
    }
  }

  return obterFluxoCaixa(pId);
}

export function salvarRascunhoFluxoCaixa(propostaId: string, projecaoConfirmada: boolean) {
  const pId = String(propostaId || "").trim();
  let fc = db.fluxoCaixa.find((f) => f.propostaId === pId);
  const agora = new Date().toISOString();

  if (!fc) {
    fc = {
      id: randomUUID(),
      propostaId: pId,
      status: "RASCUNHO",
      projecaoConfirmada: Boolean(projecaoConfirmada),
      identificacaoRevisadaEm: null,
      concluidoEm: null,
      criadoEm: agora,
      atualizadoEm: agora,
    };
    db.fluxoCaixa.push(fc);
  } else {
    fc.projecaoConfirmada = Boolean(projecaoConfirmada);
    if (fc.status !== "CONCLUIDO") {
      fc.status = "RASCUNHO";
    }
    fc.atualizadoEm = agora;
  }

  return obterFluxoCaixa(pId);
}

export function concluirFluxoCaixa(propostaId: string) {
  const pId = String(propostaId || "").trim();
  const fcObj = obterFluxoCaixa(pId);

  if (!fcObj.completo) {
    throw new Error(`Não é possível concluir o fluxo de caixa: ${fcObj.camposFaltantes.join(", ")}.`);
  }

  const ident = db.propostaIdentificacoes.find((i) => i.propostaId === pId);
  const fc = db.fluxoCaixa.find((f) => f.propostaId === pId)!;
  const agora = new Date().toISOString();

  fc.status = "CONCLUIDO";
  fc.concluidoEm = agora;
  fc.atualizadoEm = agora;
  fc.identificacaoRevisadaEm = ident ? String(ident.atualizadoEm) : agora;

  return obterFluxoCaixa(pId);
}

/* =========================================================
   LINHAS DE CRÉDITO
   ========================================================= */

export function listarLinhasCreditoAtivas() {
  return db.linhasCredito
    .filter((lc) => lc.ativo)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

/* =========================================================
   FINANCIAMENTO
   ========================================================= */

export function obterFinanciamento(propostaId: string) {
  const pId = String(propostaId || "").trim();
  let fin = db.financiamentos.find((f) => f.propostaId === pId);
  const agora = new Date().toISOString();

  if (!fin) {
    fin = {
      id: randomUUID(),
      propostaId: pId,
      linhaCreditoId: "",
      linhaCreditoNome: "",
      valorProposta: 0,
      percentualFinanciavel: 100,
      valorFinanciado: 0,
      percentualAter: 2.0,
      valorAter: 0,
      valorProjeto: 0,
      taxaJurosAnual: 0,
      prazoTotalAnos: 5,
      carenciaAnos: 1,
      numeroParcelas: 4,
      periodicidade: "ANUAL",
      jurosCarencia: "PAGAR",
      garantiasConfirmadas: false,
      cronogramaConfirmado: false,
      status: "PENDENTE",
      fluxoRevisadoEm: null,
      concluidoEm: null,
      criadoEm: agora,
      atualizadoEm: agora,
    };
    db.financiamentos.push(fin);
  }

  const garantias = db.financiamentoGarantias.filter((g) => g.propostaId === pId);
  const fc = db.fluxoCaixa.find((f) => f.propostaId === pId);
  const fcObj = obterFluxoCaixa(pId);

  let statusEfetivo = fin.status;
  let fluxoRevisado = true;

  if (fin.status === "CONCLUIDO" && fc) {
    if (fc.status !== "CONCLUIDO" || (fin.fluxoRevisadoEm && new Date(fc.atualizadoEm) > new Date(fin.fluxoRevisadoEm))) {
      statusEfetivo = "EM_REVISAO";
      fluxoRevisado = false;
    }
  }

  const cronograma = calcularCronogramaFinanciamento(fin);
  let capacidadeInsuficiente = false;
  const comparativoCapacidade = cronograma.map((item, idx) => {
    const saldoOp = fcObj.totaisPorAno.saldoOperacional[idx] || 0;
    const saldoAposDivida = saldoOp - item.prestacao;
    if (saldoAposDivida < 0) capacidadeInsuficiente = true;
    return {
      ano: item.ano,
      saldoOperacional: arredondarMoeda(saldoOp),
      prestacao: item.prestacao,
      saldoAposDivida: arredondarMoeda(saldoAposDivida),
      suficiente: saldoAposDivida >= 0,
    };
  });

  const faltantes: string[] = [];
  if (!fin.linhaCreditoId) faltantes.push("Linha de crédito selecionada");
  if (fin.valorProposta <= 0) faltantes.push("Valor da proposta maior que zero");
  if (!fin.garantiasConfirmadas) faltantes.push("Confirmação das garantias");
  if (!fin.cronogramaConfirmado) faltantes.push("Confirmação do cronograma e capacidade");
  if (!fc || fc.status !== "CONCLUIDO") faltantes.push("Fluxo de caixa concluído");

  const completo = faltantes.length === 0;

  return {
    financiamento: {
      ...fin,
      criadoEm: formatarDataHora(fin.criadoEm),
      atualizadoEm: formatarDataHora(fin.atualizadoEm),
      concluidoEm: formatarDataHora(fin.concluidoEm),
      fluxoRevisadoEm: formatarDataHora(fin.fluxoRevisadoEm),
    },
    garantias,
    cronograma,
    comparativoCapacidade,
    capacidadeInsuficiente,
    statusEfetivo,
    fluxoRevisado,
    completo,
    percentual: completo ? 100 : fin.valorProposta > 0 ? 50 : 0,
    camposFaltantes: faltantes,
  };
}

function calcularCronogramaFinanciamento(fin: any) {
  const taxa = Number(fin.taxaJurosAnual || 0) / 100;
  const prazoTotal = Math.min(Number(fin.prazoTotalAnos || 5), 7);
  const carencia = Number(fin.carenciaAnos || 0);
  const principal = Number(fin.valorProjeto || 0);
  const jurosCarencia = fin.jurosCarencia || "PAGAR";

  const cronograma = [];
  let saldoDevedor = principal;
  const anosAmortizacao = Math.max(prazoTotal - carencia, 1);
  const amortizacaoAnual = principal / anosAmortizacao;

  for (let ano = 1; ano <= 7; ano++) {
    if (ano > prazoTotal || saldoDevedor <= 0) {
      cronograma.push({
        ano,
        saldoInicial: 0,
        juros: 0,
        amortizacao: 0,
        prestacao: 0,
        saldoFinal: 0,
      });
      continue;
    }

    const saldoInicial = saldoDevedor;
    const juros = arredondarMoeda(saldoInicial * taxa);
    let amortizacao = 0;
    let prestacao = 0;

    if (ano <= carencia) {
      if (jurosCarencia === "PAGAR") {
        amortizacao = 0;
        prestacao = juros;
        saldoDevedor = saldoInicial;
      } else {
        amortizacao = 0;
        prestacao = 0;
        saldoDevedor = saldoInicial + juros;
      }
    } else {
      amortizacao = Math.min(arredondarMoeda(amortizacaoAnual), saldoDevedor);
      prestacao = arredondarMoeda(amortizacao + juros);
      saldoDevedor = Math.max(arredondarMoeda(saldoInicial - amortizacao), 0);
    }

    cronograma.push({
      ano,
      saldoInicial: arredondarMoeda(saldoInicial),
      juros,
      amortizacao,
      prestacao,
      saldoFinal: arredondarMoeda(saldoDevedor),
    });
  }

  return cronograma;
}

export function salvarFinanciamento(dados: any) {
  if (!dados) throw new Error("Dados do financiamento não informados.");
  const propostaId = String(dados.propostaId || "").trim();
  const linhaCreditoId = String(dados.linhaCreditoId || "").trim();

  if (!propostaId) throw new Error("ID da proposta não informado.");
  if (!linhaCreditoId) throw new Error("Selecione a linha de crédito.");

  const lc = db.linhasCredito.find((l) => l.id === linhaCreditoId);
  if (!lc) throw new Error("Linha de crédito não encontrada.");

  const valorProposta = Number(dados.valorProposta || 0);
  if (valorProposta <= 0) throw new Error("O valor da proposta deve ser maior que zero.");

  const percentualFinanciavel = Number(dados.percentualFinanciavel || lc.percentualFinanciavelMax);
  if (percentualFinanciavel > lc.percentualFinanciavelMax) {
    throw new Error(`O percentual financiável não pode exceder ${lc.percentualFinanciavelMax}%.`);
  }

  const valorFinanciado = arredondarMoeda(valorProposta * (percentualFinanciavel / 100));
  if (lc.tetoFinanciamento > 0 && valorFinanciado > lc.tetoFinanciamento) {
    throw new Error(`O valor financiado excede o teto da linha (${lc.tetoFinanciamento.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}).`);
  }

  const percentualAter = Number(dados.percentualAter !== undefined ? dados.percentualAter : lc.percentualAterPadrao);
  const valorAter = arredondarMoeda(valorProposta * (percentualAter / 100));
  const valorProjeto = arredondarMoeda(valorFinanciado + valorAter);

  const taxaJurosAnual = Number(dados.taxaJurosAnual !== undefined ? dados.taxaJurosAnual : lc.taxaJurosAnual);
  const prazoTotalAnos = Number(dados.prazoTotalAnos || lc.prazoMaxAnos);
  if (prazoTotalAnos > lc.prazoMaxAnos) {
    throw new Error(`O prazo total não pode exceder ${lc.prazoMaxAnos} anos.`);
  }

  const carenciaAnos = Number(dados.carenciaAnos !== undefined ? dados.carenciaAnos : lc.carenciaMaxAnos);
  if (carenciaAnos > lc.carenciaMaxAnos) {
    throw new Error(`A carência não pode exceder ${lc.carenciaMaxAnos} anos.`);
  }

  const jurosCarencia = dados.jurosCarencia === "CAPITALIZAR" ? "CAPITALIZAR" : "PAGAR";
  const numeroParcelas = Math.max(prazoTotalAnos - carenciaAnos, 1);
  const agora = new Date().toISOString();

  let fin = db.financiamentos.find((f) => f.propostaId === propostaId);
  if (!fin) {
    fin = {
      id: randomUUID(),
      propostaId,
      linhaCreditoId,
      linhaCreditoNome: lc.nome,
      valorProposta,
      percentualFinanciavel,
      valorFinanciado,
      percentualAter,
      valorAter,
      valorProjeto,
      taxaJurosAnual,
      prazoTotalAnos,
      carenciaAnos,
      numeroParcelas,
      periodicidade: "ANUAL",
      jurosCarencia,
      garantiasConfirmadas: Boolean(dados.garantiasConfirmadas),
      cronogramaConfirmado: Boolean(dados.cronogramaConfirmado),
      status: "RASCUNHO",
      fluxoRevisadoEm: null,
      concluidoEm: null,
      criadoEm: agora,
      atualizadoEm: agora,
    };
    db.financiamentos.push(fin);
  } else {
    fin.linhaCreditoId = linhaCreditoId;
    fin.linhaCreditoNome = lc.nome;
    fin.valorProposta = valorProposta;
    fin.percentualFinanciavel = percentualFinanciavel;
    fin.valorFinanciado = valorFinanciado;
    fin.percentualAter = percentualAter;
    fin.valorAter = valorAter;
    fin.valorProjeto = valorProjeto;
    fin.taxaJurosAnual = taxaJurosAnual;
    fin.prazoTotalAnos = prazoTotalAnos;
    fin.carenciaAnos = carenciaAnos;
    fin.numeroParcelas = numeroParcelas;
    fin.jurosCarencia = jurosCarencia;
    if (dados.garantiasConfirmadas !== undefined) fin.garantiasConfirmadas = Boolean(dados.garantiasConfirmadas);
    if (dados.cronogramaConfirmado !== undefined) fin.cronogramaConfirmado = Boolean(dados.cronogramaConfirmado);
    if (fin.status === "CONCLUIDO") {
      fin.status = "EM_REVISAO";
    } else {
      fin.status = "RASCUNHO";
    }
    fin.atualizadoEm = agora;
  }

  return obterFinanciamento(propostaId);
}

export function salvarRascunhoFinanciamento(propostaId: string, garantiasConfirmadas: boolean, cronogramaConfirmado: boolean) {
  const pId = String(propostaId || "").trim();
  let fin = db.financiamentos.find((f) => f.propostaId === pId);
  const agora = new Date().toISOString();

  if (fin) {
    fin.garantiasConfirmadas = Boolean(garantiasConfirmadas);
    fin.cronogramaConfirmado = Boolean(cronogramaConfirmado);
    if (fin.status !== "CONCLUIDO") {
      fin.status = "RASCUNHO";
    }
    fin.atualizadoEm = agora;
  }

  return obterFinanciamento(pId);
}

export function concluirFinanciamento(propostaId: string) {
  const pId = String(propostaId || "").trim();
  const finObj = obterFinanciamento(pId);

  if (!finObj.completo) {
    throw new Error(`Não é possível concluir o financiamento: ${finObj.camposFaltantes.join(", ")}.`);
  }

  const fc = db.fluxoCaixa.find((f) => f.propostaId === pId);
  const fin = db.financiamentos.find((f) => f.propostaId === pId)!;
  const agora = new Date().toISOString();

  fin.status = "CONCLUIDO";
  fin.concluidoEm = agora;
  fin.atualizadoEm = agora;
  fin.fluxoRevisadoEm = fc ? String(fc.atualizadoEm) : agora;

  return obterFinanciamento(pId);
}

export function salvarGarantiaFinanciamento(dados: any) {
  if (!dados) throw new Error("Dados da garantia não informados.");
  const propostaId = String(dados.propostaId || "").trim();
  const tipo = dados.tipo;
  const descricao = String(dados.descricao || "").trim();
  const id = String(dados.id || "").trim();

  if (!propostaId) throw new Error("ID da proposta não informado.");
  if (!["AVAL_PESSOAL", "BEM", "OUTRA"].includes(tipo)) throw new Error("Tipo de garantia inválido.");
  if (!descricao) throw new Error("Informe a descrição da garantia.");

  const garantidorNome = String(dados.garantidorNome || "").trim();
  const garantidorCpf = dados.garantidorCpf ? normalizarCpf(dados.garantidorCpf) : "";
  const garantidorTelefone = dados.garantidorTelefone ? normalizarTelefone(dados.garantidorTelefone) : "";
  const valorEstimado = Number(dados.valorEstimado || 0);
  const agora = new Date().toISOString();

  if (id) {
    const idx = db.financiamentoGarantias.findIndex((g) => g.id === id && g.propostaId === propostaId);
    if (idx >= 0) {
      db.financiamentoGarantias[idx] = {
        ...db.financiamentoGarantias[idx],
        tipo,
        descricao,
        garantidorNome,
        garantidorCpf,
        garantidorTelefone,
        valorEstimado,
        atualizadoEm: agora,
      };
    }
  } else {
    db.financiamentoGarantias.push({
      id: randomUUID(),
      propostaId,
      tipo,
      descricao,
      garantidorNome,
      garantidorCpf,
      garantidorTelefone,
      valorEstimado,
      criadoEm: agora,
      atualizadoEm: agora,
    });
  }

  const fin = db.financiamentos.find((f) => f.propostaId === propostaId);
  if (fin) {
    fin.atualizadoEm = agora;
    if (fin.status === "CONCLUIDO") {
      fin.status = "EM_REVISAO";
    }
  }

  return obterFinanciamento(propostaId);
}

export function excluirGarantiaFinanciamento(propostaId: string, garantiaId: string) {
  const pId = String(propostaId || "").trim();
  const gId = String(garantiaId || "").trim();

  db.financiamentoGarantias = db.financiamentoGarantias.filter((g) => !(g.id === gId && g.propostaId === pId));
  const agora = new Date().toISOString();
  const fin = db.financiamentos.find((f) => f.propostaId === pId);
  if (fin) {
    fin.atualizadoEm = agora;
    if (fin.status === "CONCLUIDO") {
      fin.status = "EM_REVISAO";
    }
  }

  return obterFinanciamento(pId);
}
