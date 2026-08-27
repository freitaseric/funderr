import crypto from "crypto";
import { db } from "../db/database";
import { FinancingScenario, Guarantee, User } from "../../domain/types";
import { calculateFinancingSchedule, consolidateCashFlow, roundCurrency } from "../../domain/calculations";
import { RevisionService } from "./revision.service";

export class FinancingService {
  static getByProposalId(proposalId: string) {
    const raw = db.getRawData();
    const proposal = raw.proposals.find((p) => p.id === proposalId);
    if (!proposal) throw new Error("Processo não encontrado");

    const financing = raw.financingScenarios.find((f) => f.proposalId === proposalId);
    const creditLines = raw.creditLines.filter((l) => l.ativo);
    const guarantees = raw.guarantees.filter((g) => g.proposalId === proposalId);

    // Get 7-year operating balance from cash flow
    const cashItems = raw.cashFlowItems.filter((i) => i.proposalId === proposalId);
    const consolidation = consolidateCashFlow(cashItems);
    const saldoOperacional = consolidation.saldoOperacional;

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
    if (percFin > line.percentualFinanciavelMax) {
      throw new Error(`Percentual financiável excede o limite da linha (${line.percentualFinanciavelMax}%)`);
    }
    const percAter = data.percentualAter ?? line.percentualAterPadrao;
    if (carencia >= prazo) throw new Error("Carência deve ser menor que o prazo total");
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
        garantiasConfirmadas: false,
        cronogramaConfirmado: false,
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
      financing.cronogramaConfirmado = false;
      financing.status = "RASCUNHO";
      financing.concluidoEm = null;
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
    RevisionService.invalidateAfterFinancing(proposalId, actor);
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
    const financing = raw.financingScenarios.find((item) => item.proposalId === proposalId);
    if (!financing) throw new Error("Salve as condições do financiamento antes de cadastrar garantias");

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
    financing.status = "RASCUNHO";
    financing.garantiasConfirmadas = false;
    financing.concluidoEm = null;
    financing.updatedAt = now;
    proposal.updatedAt = now;
    RevisionService.invalidateAfterFinancing(proposalId, actor);

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

  static confirmGuarantees(proposalId: string, confirmed: boolean, actor: User) {
    return this.setConfirmation(proposalId, "garantiasConfirmadas", confirmed, actor);
  }

  static confirmSchedule(proposalId: string, confirmed: boolean, actor: User) {
    return this.setConfirmation(proposalId, "cronogramaConfirmado", confirmed, actor);
  }

  private static setConfirmation(
    proposalId: string,
    field: "garantiasConfirmadas" | "cronogramaConfirmado",
    confirmed: boolean,
    actor: User
  ) {
    const raw = db.getRawData();
    const proposal = raw.proposals.find((item) => item.id === proposalId);
    if (!proposal) throw new Error("Processo não encontrado");
    const financing = raw.financingScenarios.find((item) => item.proposalId === proposalId);
    if (!financing) throw new Error("Salve as condições do financiamento antes de confirmar a etapa");
    financing[field] = confirmed;
    financing.status = "RASCUNHO";
    financing.concluidoEm = null;
    financing.updatedAt = new Date().toISOString();
    proposal.updatedAt = financing.updatedAt;
    RevisionService.invalidateAfterFinancing(proposalId, actor);
    db.logAudit({
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role || undefined,
      acao: `financing.${field}.${confirmed ? "confirmed" : "unconfirmed"}`,
      entidade: "FinancingScenario",
      entityId: financing.id,
      correlationId: crypto.randomUUID(),
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
    const now = new Date().toISOString();
    const financing = raw.financingScenarios.find((item) => item.proposalId === proposalId);
    if (financing) {
      financing.status = "RASCUNHO";
      financing.garantiasConfirmadas = false;
      financing.concluidoEm = null;
      financing.updatedAt = now;
    }
    proposal.updatedAt = now;
    RevisionService.invalidateAfterFinancing(proposalId, actor);

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
    if (proposal.fluxoStatus !== "CONCLUIDO" || proposal.fluxoProjecaoConfirmada !== true) {
      throw new Error("A etapa anterior (Fluxo de Caixa) deve estar concluída antes de concluir o Financiamento");
    }

    const financing = raw.financingScenarios.find((f) => f.proposalId === proposalId);
    if (!financing) throw new Error("Cenário de financiamento não configurado");
    if (!financing.garantiasConfirmadas) throw new Error("Confirme a situação das garantias antes de concluir");
    if (!financing.cronogramaConfirmado) throw new Error("Confirme o cronograma financeiro antes de concluir");

    const now = new Date().toISOString();
    financing.status = "CONCLUIDO";
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
