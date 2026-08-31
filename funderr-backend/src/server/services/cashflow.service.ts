import crypto from "crypto";
import { db } from "../db/database";
import { CashFlowItem, CashFlowItemType, User } from "../../domain/types";
import { consolidateCashFlow, roundCurrency } from "../../domain/calculations";
import { IdentificationService } from "./identification.service";
import { RevisionService } from "./revision.service";

export class CashFlowService {
  static getByProposalId(proposalId: string) {
    const raw = db.getRawData();
    const proposal = raw.proposals.find((p) => p.id === proposalId);
    if (!proposal) throw new Error("Processo não encontrado");

    const items = raw.cashFlowItems.filter((i) => i.proposalId === proposalId);
    const consolidation = consolidateCashFlow(items);

    return {
      proposalId,
      items,
      consolidation,
      projecaoConfirmada: proposal.fluxoProjecaoConfirmada === true,
      status: proposal.fluxoStatus || (items.length > 0 ? "RASCUNHO" : "PENDENTE"),
    };
  }

  static addItem(
    proposalId: string,
    data: {
      tipo: CashFlowItemType;
      descricao: string;
      unidade: string;
      quantidade: number;
      valorUnitario: number;
      ano2: number;
      ano3: number;
      ano4: number;
      ano5: number;
      ano6: number;
      ano7: number;
    },
    actor: User
  ) {
    const raw = db.getRawData();
    const proposal = raw.proposals.find((p) => p.id === proposalId);
    if (!proposal) throw new Error("Processo não encontrado");

    const id = `cf-${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    const item: CashFlowItem = {
      id,
      proposalId,
      tipo: data.tipo,
      descricao: data.descricao.trim(),
      unidade: data.unidade.trim(),
      quantidade: Number(data.quantidade),
      valorUnitario: Number(data.valorUnitario),
      ano1: roundCurrency(Number(data.quantidade) * Number(data.valorUnitario)),
      ano2: roundCurrency(Number(data.ano2 || 0)),
      ano3: roundCurrency(Number(data.ano3 || 0)),
      ano4: roundCurrency(Number(data.ano4 || 0)),
      ano5: roundCurrency(Number(data.ano5 || 0)),
      ano6: roundCurrency(Number(data.ano6 || 0)),
      ano7: roundCurrency(Number(data.ano7 || 0)),
      createdAt: now,
      updatedAt: now,
    };

    raw.cashFlowItems.push(item);
    proposal.fluxoStatus = "RASCUNHO";
    proposal.fluxoProjecaoConfirmada = false;
    proposal.fluxoModificadoEm = now;
    proposal.updatedAt = now;
    RevisionService.invalidateAfterCashFlow(proposalId, actor);

    db.logAudit({
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role || undefined,
      acao: "cashflow.item_added",
      entidade: "CashFlowItem",
      entityId: id,
      correlationId: crypto.randomUUID(),
      after: item,
    });

    db.save();
    return this.getByProposalId(proposalId);
  }

  static deleteItem(proposalId: string, itemId: string, actor: User) {
    const raw = db.getRawData();
    const proposal = raw.proposals.find((p) => p.id === proposalId);
    if (!proposal) throw new Error("Processo não encontrado");

    const item = raw.cashFlowItems.find((i) => i.id === itemId && i.proposalId === proposalId);
    if (!item) throw new Error("Item do fluxo de caixa não encontrado");

    raw.cashFlowItems = raw.cashFlowItems.filter((i) => i.id !== itemId);
    const now = new Date().toISOString();
    proposal.fluxoStatus = "RASCUNHO";
    proposal.fluxoProjecaoConfirmada = false;
    proposal.fluxoModificadoEm = now;
    proposal.updatedAt = now;
    RevisionService.invalidateAfterCashFlow(proposalId, actor);

    db.logAudit({
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role || undefined,
      acao: "cashflow.item_deleted",
      entidade: "CashFlowItem",
      entityId: itemId,
      correlationId: crypto.randomUUID(),
      before: item,
    });

    db.save();
    return this.getByProposalId(proposalId);
  }

  static confirmProjection(proposalId: string, confirmed: boolean, actor: User) {
    const raw = db.getRawData();
    const proposal = raw.proposals.find((item) => item.id === proposalId);
    if (!proposal) throw new Error("Processo não encontrado");
    const items = raw.cashFlowItems.filter((item) => item.proposalId === proposalId);
    const hasRevenue = items.some((item) => item.tipo === "RECEITA");
    const hasCost = items.some((item) => item.tipo !== "RECEITA");
    if (confirmed && (!hasRevenue || !hasCost)) {
      throw new Error("Inclua ao menos uma receita e um custo antes de confirmar a projeção");
    }

    proposal.fluxoProjecaoConfirmada = confirmed;
    proposal.fluxoStatus = "RASCUNHO";
    proposal.fluxoModificadoEm = new Date().toISOString();
    proposal.updatedAt = proposal.fluxoModificadoEm;
    RevisionService.invalidateAfterCashFlow(proposalId, actor);
    db.logAudit({
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role || undefined,
      acao: confirmed ? "cashflow.projection_confirmed" : "cashflow.projection_unconfirmed",
      entidade: "Proposal",
      entityId: proposalId,
      correlationId: crypto.randomUUID(),
    });
    db.save();
    return this.getByProposalId(proposalId);
  }

  static complete(proposalId: string, actor: User) {
    const raw = db.getRawData();
    const proposal = raw.proposals.find((p) => p.id === proposalId);
    if (!proposal) throw new Error("Processo não encontrado");

    // Identificação must be valid and concluded
    const ident = raw.identifications.find((i) => i.proposalId === proposalId);
    if (!ident || ident.status !== "CONCLUIDO" || IdentificationService.getPending(proposalId).length > 0) {
      throw new Error("A etapa anterior (Identificação da Proposta) deve estar concluída antes de concluir o Fluxo de Caixa");
    }

    const items = raw.cashFlowItems.filter((i) => i.proposalId === proposalId);
    const hasReceita = items.some((i) => i.tipo === "RECEITA");
    const hasCusto = items.some((i) => i.tipo === "CUSTO_VARIAVEL" || i.tipo === "CUSTO_FIXO");

    if (!hasReceita || !hasCusto) {
      throw new Error("O fluxo de caixa deve conter ao menos 1 item de Receita e 1 item de Custo para ser concluído");
    }
    if (proposal.fluxoProjecaoConfirmada !== true) {
      throw new Error("Confirme a revisão da projeção de sete anos antes de concluir o Fluxo de Caixa");
    }

    const now = new Date().toISOString();
    proposal.fluxoStatus = "CONCLUIDO";
    proposal.fluxoConcluidoEm = now;
    proposal.fluxoRevisadoEm = now;
    proposal.updatedAt = now;

    db.logAudit({
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role || undefined,
      acao: "cashflow.completed",
      entidade: "Proposal",
      entityId: proposalId,
      correlationId: crypto.randomUUID(),
    });

    db.save();
    return this.getByProposalId(proposalId);
  }
}
