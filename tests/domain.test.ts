import { describe, it, expect } from "vitest";
import {
  calculateBeneficiaryCompleteness,
  calculatePatrimonyTotals,
  consolidateCashFlow,
  calculateFinancingSchedule,
  determineEffectiveStepStatuses,
  formatCPF,
  isValidRoraimaMunicipality,
  validateCPF,
  validateCoordinates,
} from "../src/domain/calculations";
import { CashFlowItem, PatrimonyDebt, PatrimonyItem, Proposal } from "../src/domain/types";

describe("Domain Validation & Calculations", () => {
  it("validates CPF correctly with official check digits", () => {
    // Valid test CPFs
    expect(validateCPF("52998224725")).toBe(true);
    expect(validateCPF("529.982.247-25")).toBe(true);

    // Invalid CPFs
    expect(validateCPF("11111111111")).toBe(false);
    expect(validateCPF("12345678900")).toBe(false);
    expect(validateCPF("")).toBe(false);
    expect(validateCPF(null)).toBe(false);

    expect(formatCPF("52998224725")).toBe("529.982.247-25");
  });

  it("validates the 15 official Roraima municipalities", () => {
    expect(isValidRoraimaMunicipality("Boa Vista")).toBe(true);
    expect(isValidRoraimaMunicipality("Cantá")).toBe(true);
    expect(isValidRoraimaMunicipality("Mucajaí")).toBe(true);
    expect(isValidRoraimaMunicipality("São Paulo")).toBe(false);
  });

  it("validates coordinates in pair", () => {
    expect(validateCoordinates(2.8235, -60.6758).valid).toBe(true);
    expect(validateCoordinates(null, null).valid).toBe(true);
    expect(validateCoordinates(2.8235, null).valid).toBe(false);
    expect(validateCoordinates(null, -60.6758).valid).toBe(false);
    expect(validateCoordinates(100, -60).valid).toBe(false);
  });

  it("calculates beneficiary completeness percentage and detects spouse requirements", () => {
    const b1 = {
      nome: "João da Silva",
      cpf: "52998224725",
      telefone: "95991234567",
      estadoCivil: "SOLTEIRO",
    };
    const comp1 = calculateBeneficiaryCompleteness(b1);
    expect(comp1.percent).toBeGreaterThan(60);

    const b2 = {
      nome: "Maria Santos",
      cpf: "52998224725",
      telefone: "95991234567",
      estadoCivil: "CASADO",
      conjugeNome: "",
    };
    const comp2 = calculateBeneficiaryCompleteness(b2);
    expect(comp2.pendencias).toContain(
      "Nome do cônjuge obrigatório para estado civil casado/união estável"
    );
  });

  it("calculates Patrimônio totals and excludes OUTROS_BENS_URBANOS from rural gross worth", () => {
    const items: PatrimonyItem[] = [
      {
        id: "1",
        proposalId: "p1",
        categoria: "TERRA_COBERTURAS",
        especificacao: "Terra nua",
        unidade: "Ha",
        quantidade: 50,
        valorUnitario: 1000,
        valorTotal: 50000,
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "2",
        proposalId: "p1",
        categoria: "SEMOVENTES",
        especificacao: "Gado nelore",
        unidade: "Cab",
        quantidade: 20,
        valorUnitario: 2500,
        valorTotal: 50000,
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "3",
        proposalId: "p1",
        categoria: "OUTROS_BENS_URBANOS",
        especificacao: "Casa na cidade",
        unidade: "Un",
        quantidade: 1,
        valorUnitario: 120000,
        valorTotal: 120000,
        createdAt: "",
        updatedAt: "",
      },
    ];

    const debts: PatrimonyDebt[] = [
      {
        id: "d1",
        proposalId: "p1",
        credor: "Banco do Brasil",
        finalidade: "Trator",
        vencimento: "2027",
        saldoDevedor: 30000,
        createdAt: "",
        updatedAt: "",
      },
    ];

    const totals = calculatePatrimonyTotals(items, debts);
    // patrimonioBruto = 50,000 + 50,000 = 100,000 (urban excluded)
    expect(totals.patrimonioBruto).toBe(100000);
    expect(totals.outrosBensUrbanos).toBe(120000);
    expect(totals.totalDividas).toBe(30000);
    expect(totals.patrimonioLiquido).toBe(70000); // 100,000 - 30,000
    expect(totals.totalInformado).toBe(220000); // 100,000 + 120,000
  });

  it("consolidates 7-year Cash Flow correctly", () => {
    const items: CashFlowItem[] = [
      {
        id: "1",
        proposalId: "p1",
        tipo: "RECEITA",
        descricao: "Venda de Mandioca/Farinha",
        unidade: "Kg",
        quantidade: 1000,
        valorUnitario: 50,
        ano1: 20000,
        ano2: 30000,
        ano3: 40000,
        ano4: 50000,
        ano5: 50000,
        ano6: 50000,
        ano7: 50000,
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "2",
        proposalId: "p1",
        tipo: "CUSTO_VARIAVEL",
        descricao: "Insumos e Combustível",
        unidade: "Mês",
        quantidade: 12,
        valorUnitario: 500,
        ano1: 6000,
        ano2: 8000,
        ano3: 10000,
        ano4: 10000,
        ano5: 10000,
        ano6: 10000,
        ano7: 10000,
        createdAt: "",
        updatedAt: "",
      },
    ];

    const res = consolidateCashFlow(items);
    expect(res.receitas[0]).toBe(20000);
    expect(res.custosVariaveis[0]).toBe(6000);
    expect(res.despesasTotais[0]).toBe(6000);
    expect(res.saldoOperacional[0]).toBe(14000);
    expect(res.saldoAcumulado[0]).toBe(14000);

    expect(res.saldoOperacional[1]).toBe(22000);
    expect(res.saldoAcumulado[1]).toBe(36000); // 14,000 + 22,000
  });

  it("calculates SAC financing schedule with grace period and detects capacity warning", () => {
    const fin = calculateFinancingSchedule({
      valorProposta: 100000,
      percentualFinanciavel: 100,
      percentualAter: 2.5,
      taxaJurosAnual: 3.0,
      prazoTotalAnos: 5,
      carenciaAnos: 1,
      jurosCarencia: "PAGAR",
      saldoOperacionalProjetado: [2000, 30000, 30000, 30000, 30000],
    });

    expect(fin.valorFinanciado).toBe(100000);
    expect(fin.valorAter).toBe(2500);
    expect(fin.valorProjeto).toBe(102500);
    expect(fin.cronograma.length).toBe(5);

    // Year 1 (Grace period): interest only = 102,500 * 3% = 3075
    expect(fin.cronograma[0].amortizacao).toBe(0);
    expect(fin.cronograma[0].juros).toBe(3075);
    expect(fin.cronograma[0].prestacao).toBe(3075);

    // Year 1 installment (3075) > operating cash flow (2000) -> warning flag
    expect(fin.capacidadeInsuficiente).toBe(true);
    expect(fin.alertasCapacidade.length).toBe(1);
    expect(fin.alertasCapacidade[0].ano).toBe(1);
  });

  it("enforces Reverse Cascade EM_REVISAO status updates", () => {
    const proposal: Proposal = {
      id: "p1",
      numero: "2026-0001",
      beneficiaryId: "b1",
      propertyId: "pr1",
      data: "2026-08-26",
      atividade: "Pecuária",
      status: "EM ELABORAÇÃO",
      patrimonioRevisadoEm: "2026-08-26T10:00:00.000Z",
      identificacaoRevisadaEm: "2026-08-26T10:10:00.000Z",
      fluxoRevisadoEm: "2026-08-26T10:20:00.000Z",
      financiamentoRevisadoEm: "2026-08-26T10:30:00.000Z",
      createdAt: "",
      updatedAt: "",
    };

    // If Patrimônio was modified at 10:35 (after proposal.patrimonioRevisadoEm at 10:00)
    const effective = determineEffectiveStepStatuses({
      patrimonioStatus: "RASCUNHO",
      patrimonioUpdatedAt: "2026-08-26T10:35:00.000Z",
      identificacaoStatus: "CONCLUIDO",
      identificacaoConcluidoEm: "2026-08-26T10:10:00.000Z",
      fluxoStatus: "CONCLUIDO",
      fluxoConcluidoEm: "2026-08-26T10:20:00.000Z",
      financiamentoStatus: "CONCLUIDO",
      financiamentoConcluidoEm: "2026-08-26T10:30:00.000Z",
      proposal,
    });

    // Identificação, Fluxo, and Financiamento should all cascade to EM_REVISAO
    expect(effective.identificacao).toBe("EM_REVISAO");
    expect(effective.fluxo).toBe("EM_REVISAO");
    expect(effective.financiamento).toBe("EM_REVISAO");
  });
});
