import {
  AmortizationRow,
  Beneficiary,
  CashFlowItem,
  PatrimonyCategory,
  PatrimonyDebt,
  PatrimonyItem,
  Property,
  Proposal,
  ProposalIdentification,
  RORAIMA_MUNICIPALITIES,
  RoraimaMunicipality,
  StepStatus,
} from "./types";

/**
 * Validates Brazilian CPF with checksum algorithms
 */
export function validateCPF(cpfRaw?: string | null): boolean {
  if (!cpfRaw) return false;
  const cpf = String(cpfRaw).replace(/\D/g, "");
  if (cpf.length !== 11) return false;
  // Check known repeated numbers
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i), 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(9), 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i), 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(10), 10)) return false;

  return true;
}

export function formatCPF(cpfRaw?: string | null): string {
  if (!cpfRaw) return "";
  const digits = String(cpfRaw).replace(/\D/g, "").slice(0, 11);
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function formatPhone(phoneRaw?: string | null): string {
  if (!phoneRaw) return "";
  const digits = String(phoneRaw).replace(/\D/g, "").slice(0, 11);
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return digits;
}

export function isValidRoraimaMunicipality(mun: string): boolean {
  return RORAIMA_MUNICIPALITIES.includes(mun as RoraimaMunicipality);
}

export function validateCoordinates(
  lat?: number | null,
  lng?: number | null
): { valid: boolean; error?: string } {
  if (lat === null || lat === undefined || lat === 0) {
    if (lng === null || lng === undefined || lng === 0) {
      return { valid: true }; // optional empty
    }
    return { valid: false, error: "Latitude e Longitude devem ser preenchidas em conjunto" };
  }
  if (lng === null || lng === undefined || lng === 0) {
    return { valid: false, error: "Latitude e Longitude devem ser preenchidas em conjunto" };
  }
  if (lat < -90 || lat > 90) {
    return { valid: false, error: "Latitude deve estar entre -90 e 90" };
  }
  if (lng < -180 || lng > 180) {
    return { valid: false, error: "Longitude deve estar entre -180 e 180" };
  }
  return { valid: true };
}

export function roundCurrency(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Beneficiary completeness calculation
 */
export function calculateBeneficiaryCompleteness(b: Partial<Beneficiary>): {
  percent: number;
  pendencias: string[];
} {
  const pendencias: string[] = [];
  if (!b.nome?.trim()) pendencias.push("Nome do beneficiário não informado");
  if (!b.cpf || !validateCPF(b.cpf)) pendencias.push("CPF inválido ou não informado");
  if (!b.telefone?.trim()) pendencias.push("Telefone não informado");
  if (!b.estadoCivil) pendencias.push("Estado civil não informado");
  if (
    (b.estadoCivil === "CASADO" || b.estadoCivil === "UNIAO_ESTAVEL") &&
    !b.conjugeNome?.trim()
  ) {
    pendencias.push("Nome do cônjuge obrigatório para estado civil casado/união estável");
  }
  if (
    (b.estadoCivil === "CASADO" || b.estadoCivil === "UNIAO_ESTAVEL") &&
    b.conjugeCpf &&
    !validateCPF(b.conjugeCpf)
  ) {
    pendencias.push("CPF do cônjuge inválido");
  }
  if (
    (b.estadoCivil === "CASADO" || b.estadoCivil === "UNIAO_ESTAVEL") &&
    b.conjugeCpf &&
    b.cpf &&
    b.conjugeCpf.replace(/\D/g, "") === b.cpf.replace(/\D/g, "")
  ) {
    pendencias.push("CPF do cônjuge não pode ser igual ao do titular");
  }

  const totalChecks = 6;
  const passed = totalChecks - pendencias.length;
  const percent = Math.max(0, Math.min(100, Math.round((passed / totalChecks) * 100)));
  return { percent, pendencias };
}

/**
 * Property completeness calculation
 */
export function calculatePropertyCompleteness(p: Partial<Property>): {
  percent: number;
  pendencias: string[];
} {
  const pendencias: string[] = [];
  if (!p.denominacao?.trim()) pendencias.push("Denominação do imóvel não informada");
  if (!p.municipio || !isValidRoraimaMunicipality(p.municipio))
    pendencias.push("Município de Roraima inválido");
  if (!p.areaTotal || p.areaTotal <= 0) pendencias.push("Área total deve ser maior que 0");
  if (!p.formaOcupacao?.trim()) pendencias.push("Forma de ocupação não informada");
  if (!p.documentoExistente?.trim()) pendencias.push("Documento fundiário não informado");

  const coordCheck = validateCoordinates(p.latitude, p.longitude);
  if (!coordCheck.valid && coordCheck.error) {
    pendencias.push(coordCheck.error);
  }

  const totalChecks = 5;
  const passed = totalChecks - pendencias.length;
  const percent = Math.max(0, Math.min(100, Math.round((passed / totalChecks) * 100)));
  return { percent, pendencias };
}

/**
 * Patrimony Totals Calculation (Excludes OUTROS_BENS_URBANOS from patrimonioBruto)
 */
export interface PatrimonyTotals {
  patrimonioBruto: number;
  outrosBensUrbanos: number;
  totalDividas: number;
  patrimonioLiquido: number;
  totalInformado: number;
  porCategoria: Record<PatrimonyCategory, number>;
}

export function calculatePatrimonyTotals(
  items: PatrimonyItem[],
  debts: PatrimonyDebt[]
): PatrimonyTotals {
  const porCategoria: Record<PatrimonyCategory, number> = {
    TERRA_COBERTURAS: 0,
    CONSTRUCOES_CIVIS: 0,
    ESTRUTURA_AGROPECUARIA: 0,
    INFRAESTRUTURA: 0,
    MAQUINAS_EQUIPAMENTOS: 0,
    SEMOVENTES: 0,
    OUTROS_BENS_URBANOS: 0,
  };

  let patrimonioBruto = 0;
  let outrosBensUrbanos = 0;

  for (const item of items) {
    const total = roundCurrency(item.quantidade * item.valorUnitario);
    porCategoria[item.categoria] = roundCurrency(
      (porCategoria[item.categoria] || 0) + total
    );
    if (item.categoria === "OUTROS_BENS_URBANOS") {
      outrosBensUrbanos = roundCurrency(outrosBensUrbanos + total);
    } else {
      patrimonioBruto = roundCurrency(patrimonioBruto + total);
    }
  }

  let totalDividas = 0;
  for (const debt of debts) {
    totalDividas = roundCurrency(totalDividas + Number(debt.saldoDevedor || 0));
  }

  const patrimonioLiquido = roundCurrency(patrimonioBruto - totalDividas);
  const totalInformado = roundCurrency(patrimonioBruto + outrosBensUrbanos);

  return {
    patrimonioBruto,
    outrosBensUrbanos,
    totalDividas,
    patrimonioLiquido,
    totalInformado,
    porCategoria,
  };
}

/**
 * 7-Year Cash Flow Consolidated Calculations
 */
export interface CashFlowConsolidation {
  receitas: number[];
  custosVariaveis: number[];
  custosFixos: number[];
  despesasTotais: number[];
  saldoOperacional: number[];
  saldoAcumulado: number[];
}

export function consolidateCashFlow(items: CashFlowItem[]): CashFlowConsolidation {
  const receitas = [0, 0, 0, 0, 0, 0, 0];
  const custosVariaveis = [0, 0, 0, 0, 0, 0, 0];
  const custosFixos = [0, 0, 0, 0, 0, 0, 0];

  for (const item of items) {
    const vals = [
      Number(item.ano1 || 0),
      Number(item.ano2 || 0),
      Number(item.ano3 || 0),
      Number(item.ano4 || 0),
      Number(item.ano5 || 0),
      Number(item.ano6 || 0),
      Number(item.ano7 || 0),
    ];

    for (let y = 0; y < 7; y++) {
      if (item.tipo === "RECEITA") {
        receitas[y] = roundCurrency(receitas[y] + vals[y]);
      } else if (item.tipo === "CUSTO_VARIAVEL") {
        custosVariaveis[y] = roundCurrency(custosVariaveis[y] + vals[y]);
      } else if (item.tipo === "CUSTO_FIXO") {
        custosFixos[y] = roundCurrency(custosFixos[y] + vals[y]);
      }
    }
  }

  const despesasTotais: number[] = [];
  const saldoOperacional: number[] = [];
  const saldoAcumulado: number[] = [];

  let acumulado = 0;
  for (let y = 0; y < 7; y++) {
    const desp = roundCurrency(custosVariaveis[y] + custosFixos[y]);
    const oper = roundCurrency(receitas[y] - desp);
    acumulado = roundCurrency(acumulado + oper);

    despesasTotais.push(desp);
    saldoOperacional.push(oper);
    saldoAcumulado.push(acumulado);
  }

  return {
    receitas,
    custosVariaveis,
    custosFixos,
    despesasTotais,
    saldoOperacional,
    saldoAcumulado,
  };
}

/**
 * SAC Rural Financing Amortization Schedule & Payment Capacity Verification
 */
export interface FinancingCalculations {
  valorFinanciado: number;
  valorAter: number;
  valorProjeto: number;
  cronograma: AmortizationRow[];
  totalJuros: number;
  totalAmortizacao: number;
  totalPrestacoes: number;
  capacidadeInsuficiente: boolean;
  alertasCapacidade: { ano: number; prestacao: number; saldoOperacional: number }[];
}

export function calculateFinancingSchedule(params: {
  valorProposta: number;
  percentualFinanciavel: number;
  percentualAter: number;
  taxaJurosAnual: number;
  prazoTotalAnos: number;
  carenciaAnos: number;
  jurosCarencia: "PAGAR" | "CAPITALIZAR";
  saldoOperacionalProjetado?: number[];
}): FinancingCalculations {
  const {
    valorProposta,
    percentualFinanciavel,
    percentualAter,
    taxaJurosAnual,
    prazoTotalAnos,
    carenciaAnos,
    jurosCarencia,
    saldoOperacionalProjetado = [],
  } = params;

  const valorFinanciado = roundCurrency(
    valorProposta * (percentualFinanciavel / 100)
  );
  const valorAter = roundCurrency(valorProposta * (percentualAter / 100));
  const valorProjeto = roundCurrency(valorFinanciado + valorAter);

  const taxaDecimal = taxaJurosAnual / 100;
  const anosAmortizacao = Math.max(1, prazoTotalAnos - carenciaAnos);
  const cronograma: AmortizationRow[] = [];

  let saldoAtual = valorProjeto;
  let totalJuros = 0;
  let totalAmortizacao = 0;
  let totalPrestacoes = 0;

  // Track capacity warnings (Warning only in v0.10.2, not blocking)
  const alertasCapacidade: { ano: number; prestacao: number; saldoOperacional: number }[] = [];

  // Phase 1: Grace period
  for (let ano = 1; ano <= carenciaAnos && ano <= prazoTotalAnos; ano++) {
    const saldoInicial = saldoAtual;
    const juros = roundCurrency(saldoInicial * taxaDecimal);
    let amortizacao = 0;
    let prestacao = 0;
    let saldoFinal = saldoInicial;

    if (jurosCarencia === "PAGAR") {
      amortizacao = 0;
      prestacao = juros;
      saldoFinal = saldoInicial;
    } else {
      // CAPITALIZAR
      amortizacao = 0;
      prestacao = 0;
      saldoFinal = roundCurrency(saldoInicial + juros);
    }

    saldoAtual = saldoFinal;
    totalJuros = roundCurrency(totalJuros + juros);
    totalAmortizacao = roundCurrency(totalAmortizacao + amortizacao);
    totalPrestacoes = roundCurrency(totalPrestacoes + prestacao);

    cronograma.push({
      ano,
      saldoInicial,
      juros,
      amortizacao,
      prestacao,
      saldoFinal,
    });

    const saldoOp = saldoOperacionalProjetado[ano - 1] ?? 0;
    if (prestacao > saldoOp && saldoOperacionalProjetado.length >= ano) {
      alertasCapacidade.push({ ano, prestacao, saldoOperacional: saldoOp });
    }
  }

  // Principal to amortize after grace period
  const principalAmortizar = saldoAtual;
  const quotaAmortizacaoConstante = roundCurrency(
    principalAmortizar / anosAmortizacao
  );

  // Phase 2: Amortization period
  for (let ano = carenciaAnos + 1; ano <= prazoTotalAnos; ano++) {
    const saldoInicial = saldoAtual;
    const juros = roundCurrency(saldoInicial * taxaDecimal);
    // Last year adjusts for small rounding differences
    const amortizacao =
      ano === prazoTotalAnos ? saldoInicial : quotaAmortizacaoConstante;
    const prestacao = roundCurrency(amortizacao + juros);
    const saldoFinal = roundCurrency(Math.max(0, saldoInicial - amortizacao));

    saldoAtual = saldoFinal;
    totalJuros = roundCurrency(totalJuros + juros);
    totalAmortizacao = roundCurrency(totalAmortizacao + amortizacao);
    totalPrestacoes = roundCurrency(totalPrestacoes + prestacao);

    cronograma.push({
      ano,
      saldoInicial,
      juros,
      amortizacao,
      prestacao,
      saldoFinal,
    });

    const saldoOp = saldoOperacionalProjetado[ano - 1] ?? 0;
    if (prestacao > saldoOp && saldoOperacionalProjetado.length >= ano) {
      alertasCapacidade.push({ ano, prestacao, saldoOperacional: saldoOp });
    }
  }

  return {
    valorFinanciado,
    valorAter,
    valorProjeto,
    cronograma,
    totalJuros,
    totalAmortizacao,
    totalPrestacoes,
    capacidadeInsuficiente: alertasCapacidade.length > 0,
    alertasCapacidade,
  };
}

/**
 * Reverse Cascade Status Determination
 * When an upstream step is modified after dependent steps have been concluded,
 * the dependent steps effectively revert to EM_REVISAO until re-concluded.
 */
export function determineEffectiveStepStatuses(params: {
  patrimonioStatus: StepStatus;
  patrimonioUpdatedAt?: string;
  identificacaoStatus: StepStatus;
  identificacaoConcluidoEm?: string | null;
  identificacaoUpdatedAt?: string;
  fluxoStatus: StepStatus;
  fluxoConcluidoEm?: string | null;
  fluxoUpdatedAt?: string;
  financiamentoStatus: StepStatus;
  financiamentoConcluidoEm?: string | null;
  proposal: Proposal;
}): {
  patrimonio: StepStatus;
  identificacao: StepStatus;
  fluxo: StepStatus;
  financiamento: StepStatus;
} {
  const {
    patrimonioStatus,
    patrimonioUpdatedAt,
    identificacaoStatus,
    identificacaoConcluidoEm,
    identificacaoUpdatedAt,
    fluxoStatus,
    fluxoConcluidoEm,
    fluxoUpdatedAt,
    financiamentoStatus,
    financiamentoConcluidoEm,
    proposal,
  } = params;

  let effPatrimonio = patrimonioStatus;
  let effIdentificacao = identificacaoStatus;
  let effFluxo = fluxoStatus;
  let effFinanciamento = financiamentoStatus;

  // 1. If Patrimônio was modified after proposal.patrimonioRevisadoEm (or after Identificação conclusion)
  const revPatrimonioTs = proposal.patrimonioRevisadoEm
    ? new Date(proposal.patrimonioRevisadoEm).getTime()
    : 0;
  const modPatrimonioTs = patrimonioUpdatedAt
    ? new Date(patrimonioUpdatedAt).getTime()
    : 0;

  if (modPatrimonioTs > revPatrimonioTs && effIdentificacao === "CONCLUIDO") {
    effIdentificacao = "EM_REVISAO";
  }

  // 2. If Identificação is EM_REVISAO or was modified after proposal.identificacaoRevisadaEm
  const revIdentTs = proposal.identificacaoRevisadaEm
    ? new Date(proposal.identificacaoRevisadaEm).getTime()
    : 0;
  const modIdentTs = identificacaoUpdatedAt
    ? new Date(identificacaoUpdatedAt).getTime()
    : 0;

  if (
    effIdentificacao === "EM_REVISAO" ||
    (modIdentTs > revIdentTs && effFluxo === "CONCLUIDO")
  ) {
    if (effFluxo === "CONCLUIDO") effFluxo = "EM_REVISAO";
  }

  // 3. If Fluxo is EM_REVISAO or was modified after proposal.fluxoRevisadoEm
  const revFluxoTs = proposal.fluxoRevisadoEm
    ? new Date(proposal.fluxoRevisadoEm).getTime()
    : 0;
  const modFluxoTs = fluxoUpdatedAt
    ? new Date(fluxoUpdatedAt).getTime()
    : 0;

  if (
    effFluxo === "EM_REVISAO" ||
    (modFluxoTs > revFluxoTs && effFinanciamento === "CONCLUIDO")
  ) {
    if (effFinanciamento === "CONCLUIDO") effFinanciamento = "EM_REVISAO";
  }

  return {
    patrimonio: effPatrimonio,
    identificacao: effIdentificacao,
    fluxo: effFluxo,
    financiamento: effFinanciamento,
  };
}

export { RORAIMA_MUNICIPALITIES };

export function formatCurrency(value?: number | null): string {
  if (value === undefined || value === null || isNaN(value)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

