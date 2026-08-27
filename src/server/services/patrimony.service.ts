import crypto from "crypto";
import { db } from "../db/database";
import { PatrimonyCategory, PatrimonyDebt, PatrimonyItem, StepStatus, User } from "../../domain/types";
import { calculatePatrimonyTotals, roundCurrency } from "../../domain/calculations";

export class PatrimonyService {
  static getByProposalId(proposalId: string) {
    const raw = db.getRawData();
    const proposal = raw.proposals.find((p) => p.id === proposalId);
    if (!proposal) throw new Error("Processo não encontrado");

    const items = raw.patrimonyItems.filter((i) => i.proposalId === proposalId);
    const debts = raw.patrimonyDebts.filter((d) => d.proposalId === proposalId);
    const totals = calculatePatrimonyTotals(items, debts);

    // Calculate completion status
    const hasItems = items.length > 0;
    // Status is tracked or derived
    return {
      proposalId,
      items,
      debts,
      totals,
      hasItems,
      dividasConfirmadas: (proposal as any).patrimonioDividasConfirmadas === true,
      status: (proposal as any).patrimonioStatus || (hasItems ? "RASCUNHO" : "PENDENTE"),
    };
  }

  static addItem(
    proposalId: string,
    data: {
      categoria: PatrimonyCategory;
      especificacao: string;
      unidade: string;
      quantidade: number;
      valorUnitario: number;
    },
    actor: User
  ) {
    const raw = db.getRawData();
    const proposal = raw.proposals.find((p) => p.id === proposalId);
    if (!proposal) throw new Error("Processo não encontrado");

    const id = `pat-item-${crypto.randomUUID()}`;
    const valorTotal = roundCurrency(Number(data.quantidade) * Number(data.valorUnitario));
    const now = new Date().toISOString();

    const item: PatrimonyItem = {
      id,
      proposalId,
      categoria: data.categoria,
      especificacao: data.especificacao.trim(),
      unidade: data.unidade.trim(),
      quantidade: Number(data.quantidade),
      valorUnitario: Number(data.valorUnitario),
      valorTotal,
      createdAt: now,
      updatedAt: now,
    };

    raw.patrimonyItems.push(item);
    (proposal as any).patrimonioStatus = "RASCUNHO";
    (proposal as any).patrimonioDividasConfirmadas = false;
    (proposal as any).patrimonioModificadoEm = now;
    proposal.updatedAt = now;

    db.logAudit({
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role || undefined,
      acao: "patrimony.item_added",
      entidade: "PatrimonyItem",
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

    const item = raw.patrimonyItems.find((i) => i.id === itemId && i.proposalId === proposalId);
    if (!item) throw new Error("Item de patrimônio não encontrado");

    raw.patrimonyItems = raw.patrimonyItems.filter((i) => i.id !== itemId);
    const now = new Date().toISOString();
    (proposal as any).patrimonioStatus = "RASCUNHO";
    (proposal as any).patrimonioDividasConfirmadas = false;
    (proposal as any).patrimonioModificadoEm = now;
    proposal.updatedAt = now;

    db.logAudit({
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role || undefined,
      acao: "patrimony.item_deleted",
      entidade: "PatrimonyItem",
      entityId: itemId,
      correlationId: crypto.randomUUID(),
      before: item,
    });

    db.save();
    return this.getByProposalId(proposalId);
  }

  static addDebt(
    proposalId: string,
    data: {
      credor: string;
      finalidade: string;
      vencimento: string;
      saldoDevedor: number;
    },
    actor: User
  ) {
    const raw = db.getRawData();
    const proposal = raw.proposals.find((p) => p.id === proposalId);
    if (!proposal) throw new Error("Processo não encontrado");

    const id = `debt-${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    const debt: PatrimonyDebt = {
      id,
      proposalId,
      credor: data.credor.trim(),
      finalidade: data.finalidade.trim(),
      vencimento: data.vencimento.trim(),
      saldoDevedor: roundCurrency(Number(data.saldoDevedor)),
      createdAt: now,
      updatedAt: now,
    };

    raw.patrimonyDebts.push(debt);
    (proposal as any).patrimonioStatus = "RASCUNHO";
    (proposal as any).patrimonioDividasConfirmadas = false;
    (proposal as any).patrimonioModificadoEm = now;
    proposal.updatedAt = now;

    db.logAudit({
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role || undefined,
      acao: "patrimony.debt_added",
      entidade: "PatrimonyDebt",
      entityId: id,
      correlationId: crypto.randomUUID(),
      after: debt,
    });

    db.save();
    return this.getByProposalId(proposalId);
  }

  static deleteDebt(proposalId: string, debtId: string, actor: User) {
    const raw = db.getRawData();
    const proposal = raw.proposals.find((p) => p.id === proposalId);
    if (!proposal) throw new Error("Processo não encontrado");

    const debt = raw.patrimonyDebts.find((d) => d.id === debtId && d.proposalId === proposalId);
    if (!debt) throw new Error("Dívida não encontrada");

    raw.patrimonyDebts = raw.patrimonyDebts.filter((d) => d.id !== debtId);
    const now = new Date().toISOString();
    (proposal as any).patrimonioStatus = "RASCUNHO";
    (proposal as any).patrimonioDividasConfirmadas = false;
    (proposal as any).patrimonioModificadoEm = now;
    proposal.updatedAt = now;

    db.logAudit({
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role || undefined,
      acao: "patrimony.debt_deleted",
      entidade: "PatrimonyDebt",
      entityId: debtId,
      correlationId: crypto.randomUUID(),
      before: debt,
    });

    db.save();
    return this.getByProposalId(proposalId);
  }

  static complete(proposalId: string, actor: User) {
    const raw = db.getRawData();
    const proposal = raw.proposals.find((p) => p.id === proposalId);
    if (!proposal) throw new Error("Processo não encontrado");

    const items = raw.patrimonyItems.filter((i) => i.proposalId === proposalId);
    if (items.length === 0) {
      throw new Error("Para concluir o levantamento, informe pelo menos 1 item patrimonial");
    }
    if ((proposal as any).patrimonioDividasConfirmadas !== true) {
      throw new Error("Confirme que a situação das dívidas foi revisada");
    }

    const now = new Date().toISOString();
    (proposal as any).patrimonioStatus = "CONCLUIDO";
    (proposal as any).patrimonioConcluidoEm = now;
    proposal.patrimonioRevisadoEm = now;
    proposal.updatedAt = now;

    db.logAudit({
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role || undefined,
      acao: "patrimony.completed",
      entidade: "Proposal",
      entityId: proposalId,
      correlationId: crypto.randomUUID(),
    });

    db.save();
    return this.getByProposalId(proposalId);
  }

  static confirmDebts(proposalId: string, confirmed: boolean, actor: User) {
    const raw = db.getRawData();
    const proposal = raw.proposals.find((item) => item.id === proposalId);
    if (!proposal) throw new Error("Processo não encontrado");
    const now = new Date().toISOString();
    (proposal as any).patrimonioDividasConfirmadas = confirmed;
    (proposal as any).patrimonioStatus = "RASCUNHO";
    (proposal as any).patrimonioModificadoEm = now;
    proposal.updatedAt = now;
    db.logAudit({
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role || undefined,
      acao: "patrimony.debts_review_confirmed",
      entidade: "Proposal",
      entityId: proposalId,
      correlationId: crypto.randomUUID(),
      after: { confirmed },
    });
    db.save();
    return this.getByProposalId(proposalId);
  }
}
