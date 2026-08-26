import crypto from "crypto";
import { db } from "../db/database";
import { CashFlowItem, CashFlowItemType, User } from "../../domain/types";
import { consolidateCashFlow, roundCurrency } from "../../domain/calculations";

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
      projecaoConfirmada: (proposal as any).fluxoProjecaoConfirmada === true,
      status: (proposal as any).fluxoStatus || (items.length > 0 ? "RASCUNHO" : "PENDENTE"),
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
      ano1: number;
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
      quantidade: Number(data.quantidade || 1),
      valorUnitario: Number(data.valorUnitario || 0),
      ano1: roundCurrency(Number(data.ano1 || 0)),
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
    (proposal as any).fluxoStatus = "RASCUNHO";
    (proposal as any).fluxoModificadoEm = now;
    proposal.updatedAt = now;

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
    (proposal as any).fluxoStatus = "RASCUNHO";
    (proposal as any).fluxoModificadoEm = now;
    proposal.updatedAt = now;

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

  static complete(proposalId: string, actor: User) {
    const raw = db.getRawData();
    const proposal = raw.proposals.find((p) => p.id === proposalId);
    if (!proposal) throw new Error("Processo não encontrado");

    // Identificação must be CONCLUIDO
    const ident = raw.identifications.find((i) => i.proposalId === proposalId);
    if (!ident || ident.status !== "CONCLUIDO") {
      throw new Error("A etapa anterior (Identificação da Proposta) deve estar concluída antes de concluir o Fluxo de Caixa");
    }

    const items = raw.cashFlowItems.filter((i) => i.proposalId === proposalId);
    const hasReceita = items.some((i) => i.tipo === "RECEITA");
    const hasCusto = items.some((i) => i.tipo === "CUSTO_VARIAVEL" || i.tipo === "CUSTO_FIXO");

    if (!hasReceita || !hasCusto) {
      throw new Error("O fluxo de caixa deve conter ao menos 1 item de Receita e 1 item de Custo para ser concluído");
    }

    const now = new Date().toISOString();
    (proposal as any).fluxoStatus = "CONCLUIDO";
    (proposal as any).fluxoConcluidoEm = now;
    (proposal as any).fluxoProjecaoConfirmada = true;
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
