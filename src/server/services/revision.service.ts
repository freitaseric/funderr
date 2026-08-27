import crypto from "crypto";
import { User } from "../../domain/types";
import { db } from "../db/database";

export class RevisionService {
  static invalidateAfterIdentification(proposalId: string, actor: User): void {
    const raw = db.getRawData();
    const proposal = raw.proposals.find((item) => item.id === proposalId);
    if (!proposal) return;
    if (proposal.fluxoStatus === "CONCLUIDO") proposal.fluxoStatus = "EM_REVISAO";
    const financing = raw.financingScenarios.find((item) => item.proposalId === proposalId);
    if (financing) {
      if (financing.status === "CONCLUIDO") financing.status = "EM_REVISAO";
      financing.cronogramaConfirmado = false;
    }
    this.reopenGlobalProposal(proposalId, "Identificação alterada", actor);
  }

  static invalidateAfterCashFlow(proposalId: string, actor: User): void {
    const raw = db.getRawData();
    const financing = raw.financingScenarios.find((item) => item.proposalId === proposalId);
    if (financing) {
      if (financing.status === "CONCLUIDO") financing.status = "EM_REVISAO";
      financing.cronogramaConfirmado = false;
    }
    this.reopenGlobalProposal(proposalId, "Fluxo de caixa alterado", actor);
  }

  static invalidateAfterFinancing(proposalId: string, actor: User): void {
    this.reopenGlobalProposal(proposalId, "Financiamento alterado", actor);
  }

  static invalidateByBeneficiary(beneficiaryId: string, actor: User): void {
    const proposalIds = db.getRawData().proposals
      .filter((proposal) => proposal.beneficiaryId === beneficiaryId)
      .map((proposal) => proposal.id);
    proposalIds.forEach((proposalId) =>
      this.invalidateBaseData(proposalId, "Cadastro do beneficiário alterado", actor)
    );
  }

  static invalidateByProperty(propertyId: string, actor: User): void {
    const proposalIds = db.getRawData().proposals
      .filter((proposal) => proposal.propertyId === propertyId)
      .map((proposal) => proposal.id);
    proposalIds.forEach((proposalId) =>
      this.invalidateBaseData(proposalId, "Cadastro da propriedade alterado", actor)
    );
  }

  private static invalidateBaseData(proposalId: string, reason: string, actor: User): void {
    const raw = db.getRawData();
    const proposal = raw.proposals.find((item) => item.id === proposalId);
    if (!proposal) return;
    const now = new Date().toISOString();

    if ((proposal as any).patrimonioStatus === "CONCLUIDO") {
      (proposal as any).patrimonioStatus = "EM_REVISAO";
    }
    const identification = raw.identifications.find((item) => item.proposalId === proposalId);
    if (identification?.status === "CONCLUIDO") identification.status = "EM_REVISAO";
    if ((proposal as any).fluxoStatus === "CONCLUIDO") {
      (proposal as any).fluxoStatus = "EM_REVISAO";
    }
    const financing = raw.financingScenarios.find((item) => item.proposalId === proposalId);
    if (financing) {
      if (financing.status === "CONCLUIDO") financing.status = "EM_REVISAO";
      financing.cronogramaConfirmado = false;
    }

    this.reopenGlobalProposal(proposalId, reason, actor);
    proposal.updatedAt = now;
    db.logAudit({
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role || undefined,
      acao: "proposal.base_data_invalidated",
      entidade: "Proposal",
      entityId: proposalId,
      correlationId: crypto.randomUUID(),
      metadata: { reason },
    });
  }

  private static reopenGlobalProposal(proposalId: string, reason: string, actor: User): void {
    const raw = db.getRawData();
    const proposal = raw.proposals.find((item) => item.id === proposalId);
    if (!proposal || (proposal.status !== "APROVADO" && proposal.status !== "CONCLUÍDO")) return;
    const previousStatus = proposal.status;
    const now = new Date().toISOString();
    proposal.status = "EM ANÁLISE";
    proposal.updatedAt = now;
    raw.proposalStatusHistory.unshift({
      id: `proposal-status-${crypto.randomUUID()}`,
      proposalId,
      statusAnterior: previousStatus,
      statusNovo: "EM ANÁLISE",
      motivo: reason,
      changedById: actor.id,
      changedAt: now,
    });
  }
}
