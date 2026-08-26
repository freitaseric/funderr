import crypto from "crypto";
import { db } from "../db/database";
import { FinancingScenario, Guarantee, User } from "../../domain/types";
import { calculateFinancingSchedule, consolidateCashFlow, roundCurrency } from "../../domain/calculations";

export class FinancingService {
  static getByProposalId(proposalId: string) {
    const raw = db.getRawData();
    const proposal = raw.proposals.find((p) => p.id === proposalId);
    if (!proposal) throw new Error("Processo não encontrado");

    let financing = raw.financingScenarios.find((f) => f.proposalId === proposalId);
    const creditLines = raw.creditLines.filter((l) => l.ativo);
    const guarantees = raw.guarantees.filter((g) => g.proposalId === proposalId);

    // Get 7-year operating balance from cash flow
    const cashItems = raw.cashFlowItems.filter((i) => i.proposalId === proposalId);
    const consolidation = consolidateCashFlow(cashItems);
    const saldoOperacional = consolidation.saldoOperacional;

    if (!financing && creditLines.length > 0) {
      const defaultLine = creditLines[0];
      financing = {
        id: `fin-${crypto.randomUUID()}`,
        proposalId,
        linhaCreditoId: defaultLine.id,
        linhaCreditoNome: defaultLine.nome,
        valorProposta: 50000,
        percentualFinanciavel: defaultLine.percentualFinanciavelMax || 100,
        valorFinanciado: 50000,
        percentualAter: defaultLine.percentualAterPadrao || 2.5,
        valorAter: 1250,
        valorProjeto: 51250,
        taxaJurosAnual: defaultLine.taxaJurosAnual || 2.0,
        prazoTotalAnos: defaultLine.prazoMaxAnos || 5,
        carenciaAnos: defaultLine.carenciaMaxAnos || 1,
        numeroParcelas: (defaultLine.prazoMaxAnos || 5) - (defaultLine.carenciaMaxAnos || 1),
        periodicidade: "ANUAL",
        jurosCarencia: "PAGAR",
        garantiasConfirmadas: false,
        cronogramaConfirmado: false,
        status: "PENDENTE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      raw.financingScenarios.push(financing);
      db.save();
    }

    let calculations = null;
    if (financing) {
      calculations = calculateFinancingSchedule({
        valorProposta: financing.valorProposta,
        percentualFinanciavel: financing.percentualFinanciavel,
        percentualAter: financing.percentualAter,
        taxaJurosAnual: financing.taxaJurosAnual,
        prazoTotalAnos: financing.prazoTotalAnos,
        carenciaAnos: financing.carenciaAnos,
        jurosCarencia: financing.jurosCarencia,
        saldoOperacionalProjetado: saldoOperacional,
      });
    }

    return {
      proposalId,
      financing,
      guarantees,
      calculations,
      creditLines,
      saldoOperacional,
    };
  }

  static save(
    proposalId: string,
    data: {
      linhaCreditoId: string;
      valorProposta: number;
      percentualFinanciavel?: number;
      percentualAter?: number;
      taxaJurosAnual?: number;
      prazoTotalAnos?: number;
      carenciaAnos?: number;
      jurosCarencia?: "PAGAR" | "CAPITALIZAR";
      garantiasConfirmadas?: boolean;
      cronogramaConfirmado?: boolean;
    },
    actor: User
  ) {
    const raw = db.getRawData();
    const proposal = raw.proposals.find((p) => p.id === proposalId);
    if (!proposal) throw new Error("Processo não encontrado");

    const line = raw.creditLines.find((l) => l.id === data.linhaCreditoId);
    if (!line) throw new Error("Linha de crédito selecionada não existe");

    // Validate limits
    if (data.valorProposta > line.tetoFinanciamento) {
      throw new Error(`Valor da proposta excede o teto da linha (${line.tetoFinanciamento.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })})`);
    }

    const prazo = data.prazoTotalAnos ?? line.prazoMaxAnos;
    if (prazo > line.prazoMaxAnos) {
      throw new Error(`Prazo total excede o máximo permitido pela linha (${line.prazoMaxAnos} anos)`);
    }

    const carencia = data.carenciaAnos ?? line.carenciaMaxAnos;
    if (carencia > line.carenciaMaxAnos) {
      throw new Error(`Carência excede o máximo permitido pela linha (${line.carenciaMaxAnos} anos)`);
    }

    const percFin = data.percentualFinanciavel ?? line.percentualFinanciavelMax;
    const percAter = data.percentualAter ?? line.percentualAterPadrao;
    const valorFinanciado = roundCurrency(data.valorProposta * (percFin / 100));
    const valorAter = roundCurrency(data.valorProposta * (percAter / 100));
    const valorProjeto = roundCurrency(valorFinanciado + valorAter);

    const now = new Date().toISOString();
    let financing = raw.financingScenarios.find((f) => f.proposalId === proposalId);

    if (!financing) {
      financing = {
        id: `fin-${crypto.randomUUID()}`,
        proposalId,
        linhaCreditoId: line.id,
        linhaCreditoNome: line.nome,
        valorProposta: Number(data.valorProposta),
        percentualFinanciavel: percFin,
        valorFinanciado,
        percentualAter: percAter,
        valorAter,
        valorProjeto,
        taxaJurosAnual: data.taxaJurosAnual ?? line.taxaJurosAnual,
        prazoTotalAnos: prazo,
        carenciaAnos: carencia,
        numeroParcelas: prazo - carencia,
        periodicidade: "ANUAL",
        jurosCarencia: data.jurosCarencia || "PAGAR",
        garantiasConfirmadas: !!data.garantiasConfirmadas,
        cronogramaConfirmado: !!data.cronogramaConfirmado,
        status: "RASCUNHO",
        createdAt: now,
        updatedAt: now,
      };
      raw.financingScenarios.push(financing);
    } else {
      const before = { ...financing };
      financing.linhaCreditoId = line.id;
      financing.linhaCreditoNome = line.nome;
      financing.valorProposta = Number(data.valorProposta);
      financing.percentualFinanciavel = percFin;
      financing.valorFinanciado = valorFinanciado;
      financing.percentualAter = percAter;
      financing.valorAter = valorAter;
      financing.valorProjeto = valorProjeto;
      financing.taxaJurosAnual = data.taxaJurosAnual ?? line.taxaJurosAnual;
      financing.prazoTotalAnos = prazo;
      financing.carenciaAnos = carencia;
      financing.numeroParcelas = prazo - carencia;
      financing.jurosCarencia = data.jurosCarencia || financing.jurosCarencia;
      financing.garantiasConfirmadas = data.garantiasConfirmadas !== undefined ? !!data.garantiasConfirmadas : financing.garantiasConfirmadas;
      financing.cronogramaConfirmado = data.cronogramaConfirmado !== undefined ? !!data.cronogramaConfirmado : financing.cronogramaConfirmado;
      if (financing.status !== "CONCLUIDO") {
        financing.status = "RASCUNHO";
      }
      financing.updatedAt = now;

      db.logAudit({
        userId: actor.id,
        userName: actor.name,
        userRole: actor.role || undefined,
        acao: "financing.updated",
        entidade: "FinancingScenario",
        entityId: financing.id,
        correlationId: crypto.randomUUID(),
        before,
        after: financing,
      });
    }

    proposal.updatedAt = now;
    db.save();
    return this.getByProposalId(proposalId);
  }

  static addGuarantee(
    proposalId: string,
    data: {
      tipo: "AVAL_PESSOAL" | "BEM" | "OUTRA";
      descricao: string;
      garantidorNome?: string;
      garantidorCpf?: string;
      garantidorTelefone?: string;
      valorEstimado?: number;
    },
    actor: User
  ) {
    const raw = db.getRawData();
    const proposal = raw.proposals.find((p) => p.id === proposalId);
    if (!proposal) throw new Error("Processo não encontrado");

    const id = `guar-${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    const guarantee: Guarantee = {
      id,
      proposalId,
      tipo: data.tipo,
      descricao: data.descricao.trim(),
      garantidorNome: data.garantidorNome?.trim(),
      garantidorCpf: data.garantidorCpf ? data.garantidorCpf.replace(/\D/g, "") : undefined,
      garantidorTelefone: data.garantidorTelefone ? data.garantidorTelefone.replace(/\D/g, "") : undefined,
      valorEstimado: data.valorEstimado !== undefined ? roundCurrency(Number(data.valorEstimado)) : undefined,
      createdAt: now,
      updatedAt: now,
    };

    raw.guarantees.push(guarantee);
    proposal.updatedAt = now;

    db.logAudit({
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role || undefined,
      acao: "guarantee.added",
      entidade: "Guarantee",
      entityId: id,
      correlationId: crypto.randomUUID(),
      after: guarantee,
    });

    db.save();
    return this.getByProposalId(proposalId);
  }

  static deleteGuarantee(proposalId: string, guaranteeId: string, actor: User) {
    const raw = db.getRawData();
    const proposal = raw.proposals.find((p) => p.id === proposalId);
    if (!proposal) throw new Error("Processo não encontrado");

    const g = raw.guarantees.find((item) => item.id === guaranteeId && item.proposalId === proposalId);
    if (!g) throw new Error("Garantia não encontrada");

    raw.guarantees = raw.guarantees.filter((item) => item.id !== guaranteeId);
    proposal.updatedAt = new Date().toISOString();

    db.logAudit({
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role || undefined,
      acao: "guarantee.deleted",
      entidade: "Guarantee",
      entityId: guaranteeId,
      correlationId: crypto.randomUUID(),
      before: g,
    });

    db.save();
    return this.getByProposalId(proposalId);
  }

  static complete(proposalId: string, actor: User) {
    const raw = db.getRawData();
    const proposal = raw.proposals.find((p) => p.id === proposalId);
    if (!proposal) throw new Error("Processo não encontrado");

    // Fluxo de Caixa must be CONCLUIDO
    const fluxoStatus = (proposal as any).fluxoStatus;
    if (fluxoStatus !== "CONCLUIDO") {
      throw new Error("A etapa anterior (Fluxo de Caixa) deve estar concluída antes de concluir o Financiamento");
    }

    const financing = raw.financingScenarios.find((f) => f.proposalId === proposalId);
    if (!financing) throw new Error("Cenário de financiamento não configurado");

    const now = new Date().toISOString();
    financing.status = "CONCLUIDO";
    financing.garantiasConfirmadas = true;
    financing.cronogramaConfirmado = true;
    financing.concluidoEm = now;
    financing.updatedAt = now;
    proposal.financiamentoRevisadoEm = now;
    proposal.updatedAt = now;

    db.logAudit({
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role || undefined,
      acao: "financing.completed",
      entidade: "FinancingScenario",
      entityId: financing.id,
      correlationId: crypto.randomUUID(),
    });

    db.save();
    return this.getByProposalId(proposalId);
  }
}
