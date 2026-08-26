import crypto from "crypto";
import { db } from "../db/database";
import { Proposal, StepStatus, User } from "../../domain/types";
import { calculateBeneficiaryCompleteness, calculatePropertyCompleteness, determineEffectiveStepStatuses } from "../../domain/calculations";

export interface ProposalDetailView {
  proposal: Proposal;
  beneficiaryNome: string;
  beneficiaryCpf: string;
  propertyDenominacao: string;
  propertyMunicipio: string;
  etapas: {
    dadosGerais: { status: StepStatus; percent: number };
    beneficiario: { status: StepStatus; percent: number };
    propriedade: { status: StepStatus; percent: number };
    patrimonio: { status: StepStatus; percent: number };
    identificacao: { status: StepStatus; percent: number };
    fluxoCaixa: { status: StepStatus; percent: number };
    financiamento: { status: StepStatus; percent: number };
    documentos: { status: StepStatus; total: number; confirmados: number };
  };
  percentualGlobal: number;
  totalPendencias: number;
}

export class ProposalService {
  static list(): ProposalDetailView[] {
    const raw = db.getRawData();
    return raw.proposals.map((p) => this.getDetailedView(p.id)!);
  }

  static getById(id: string): ProposalDetailView | null {
    return this.getDetailedView(id);
  }

  static create(
    data: {
      beneficiaryId: string;
      propertyId: string;
      data: string;
      atividade: string;
    },
    actor: User
  ): Proposal {
    const raw = db.getRawData();

    // Validate beneficiary & property match
    const ben = raw.beneficiaries.find((b) => b.id === data.beneficiaryId);
    if (!ben) throw new Error("Beneficiário não encontrado");

    const prop = raw.properties.find((p) => p.id === data.propertyId);
    if (!prop) throw new Error("Propriedade não encontrada");

    if (prop.beneficiaryId !== data.beneficiaryId) {
      throw new Error("A propriedade selecionada não pertence ao beneficiário informado");
    }

    const year = new Date(data.data || new Date()).getFullYear();
    const numero = db.getNextProposalNumber(year);
    const id = `prop-proc-${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    const proposal: Proposal = {
      id,
      numero,
      beneficiaryId: data.beneficiaryId,
      propertyId: data.propertyId,
      data: data.data || now.slice(0, 10),
      atividade: data.atividade?.trim() || "Agricultura Familiar Diversificada",
      status: "EM ELABORAÇÃO",
      createdById: actor.id,
      createdAt: now,
      updatedAt: now,
    };

    raw.proposals.push(proposal);

    db.logAudit({
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role || undefined,
      acao: "proposal.created",
      entidade: "Proposal",
      entityId: id,
      correlationId: crypto.randomUUID(),
      after: proposal,
    });

    db.save();
    return proposal;
  }

  static update(
    id: string,
    data: {
      beneficiaryId?: string;
      propertyId?: string;
      data?: string;
      atividade?: string;
      status?: "EM ELABORAÇÃO" | "EM ANÁLISE" | "APROVADO" | "RECUSADO" | "CONCLUÍDO";
    },
    actor: User
  ): Proposal {
    const raw = db.getRawData();
    const proposal = raw.proposals.find((p) => p.id === id);
    if (!proposal) throw new Error("Processo não encontrado");

    const before = { ...proposal };
    const now = new Date().toISOString();

    if (data.beneficiaryId && data.beneficiaryId !== proposal.beneficiaryId) {
      const ben = raw.beneficiaries.find((b) => b.id === data.beneficiaryId);
      if (!ben) throw new Error("Beneficiário não encontrado");
      proposal.beneficiaryId = data.beneficiaryId;
    }

    if (data.propertyId && data.propertyId !== proposal.propertyId) {
      const prop = raw.properties.find((p) => p.id === data.propertyId);
      if (!prop) throw new Error("Propriedade não encontrada");
      if (prop.beneficiaryId !== proposal.beneficiaryId) {
        throw new Error("A propriedade selecionada não pertence ao beneficiário");
      }
      proposal.propertyId = data.propertyId;
    }

    if (data.data) proposal.data = data.data;
    if (data.atividade) proposal.atividade = data.atividade.trim();
    if (data.status) proposal.status = data.status;
    proposal.updatedAt = now;

    db.logAudit({
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role || undefined,
      acao: "proposal.updated",
      entidade: "Proposal",
      entityId: id,
      correlationId: crypto.randomUUID(),
      before,
      after: proposal,
    });

    db.save();
    return proposal;
  }

  private static getDetailedView(id: string): ProposalDetailView | null {
    const raw = db.getRawData();
    const proposal = raw.proposals.find((p) => p.id === id);
    if (!proposal) return null;

    const ben = raw.beneficiaries.find((b) => b.id === proposal.beneficiaryId);
    const prop = raw.properties.find((p) => p.id === proposal.propertyId);

    const benCompleteness = ben ? calculateBeneficiaryCompleteness(ben) : { percent: 0, pendencias: [] };
    const propCompleteness = prop ? calculatePropertyCompleteness(prop) : { percent: 0, pendencias: [] };

    const patItems = raw.patrimonyItems.filter((i) => i.proposalId === id);
    const rawPatStatus: StepStatus = (proposal as any).patrimonioStatus || (patItems.length > 0 ? "RASCUNHO" : "PENDENTE");

    const ident = raw.identifications.find((i) => i.proposalId === id);
    const rawIdentStatus: StepStatus = ident?.status || "PENDENTE";

    const cashItems = raw.cashFlowItems.filter((i) => i.proposalId === id);
    const rawFluxoStatus: StepStatus = (proposal as any).fluxoStatus || (cashItems.length > 0 ? "RASCUNHO" : "PENDENTE");

    const financing = raw.financingScenarios.find((f) => f.proposalId === id);
    const rawFinStatus: StepStatus = financing?.status || "PENDENTE";

    // Compute effective step statuses with reverse cascade EM_REVISAO logic
    const effective = determineEffectiveStepStatuses({
      patrimonioStatus: rawPatStatus,
      patrimonioUpdatedAt: (proposal as any).patrimonioModificadoEm,
      identificacaoStatus: rawIdentStatus,
      identificacaoConcluidoEm: ident?.concluidoEm,
      identificacaoUpdatedAt: ident?.updatedAt,
      fluxoStatus: rawFluxoStatus,
      fluxoConcluidoEm: (proposal as any).fluxoConcluidoEm,
      fluxoUpdatedAt: (proposal as any).fluxoModificadoEm,
      financiamentoStatus: rawFinStatus,
      financiamentoConcluidoEm: financing?.concluidoEm,
      proposal,
    });

    const docs = raw.documents.filter((d) => d.proposalId === id);
    const docsConfirmed = docs.filter((d) => d.status === "CONFIRMED").length;

    const etapaDadosGerais = { status: "CONCLUIDO" as StepStatus, percent: 100 };
    const etapaBen = {
      status: (benCompleteness.percent === 100 ? "CONCLUIDO" : benCompleteness.percent > 0 ? "RASCUNHO" : "PENDENTE") as StepStatus,
      percent: benCompleteness.percent,
    };
    const etapaProp = {
      status: (propCompleteness.percent === 100 ? "CONCLUIDO" : propCompleteness.percent > 0 ? "RASCUNHO" : "PENDENTE") as StepStatus,
      percent: propCompleteness.percent,
    };
    const etapaPat = {
      status: effective.patrimonio,
      percent: effective.patrimonio === "CONCLUIDO" ? 100 : patItems.length > 0 ? 50 : 0,
    };
    const etapaIdent = {
      status: effective.identificacao,
      percent: effective.identificacao === "CONCLUIDO" ? 100 : ident?.status === "RASCUNHO" ? 50 : 0,
    };
    const etapaFluxo = {
      status: effective.fluxo,
      percent: effective.fluxo === "CONCLUIDO" ? 100 : cashItems.length > 0 ? 50 : 0,
    };
    const etapaFin = {
      status: effective.financiamento,
      percent: effective.financiamento === "CONCLUIDO" ? 100 : financing?.status === "RASCUNHO" ? 50 : 0,
    };
    const etapaDocs = {
      status: (docs.length > 0 && docsConfirmed === docs.length ? "CONCLUIDO" : docs.length > 0 ? "RASCUNHO" : "PENDENTE") as StepStatus,
      total: docs.length,
      confirmados: docsConfirmed,
    };

    // Calculate global percentage (weights of 8 stages)
    const weights = [
      etapaDadosGerais.percent,
      etapaBen.percent,
      etapaProp.percent,
      etapaPat.percent,
      etapaIdent.percent,
      etapaFluxo.percent,
      etapaFin.percent,
      docs.length > 0 ? Math.round((docsConfirmed / docs.length) * 100) : 0,
    ];
    const percentualGlobal = Math.round(weights.reduce((a, b) => a + b, 0) / 8);

    const totalPendencias =
      benCompleteness.pendencias.length +
      propCompleteness.pendencias.length +
      (effective.patrimonio !== "CONCLUIDO" ? 1 : 0) +
      (effective.identificacao !== "CONCLUIDO" ? 1 : 0) +
      (effective.fluxo !== "CONCLUIDO" ? 1 : 0) +
      (effective.financiamento !== "CONCLUIDO" ? 1 : 0);

    return {
      proposal,
      beneficiaryNome: ben?.nome || "Não informado",
      beneficiaryCpf: ben?.cpf || "",
      propertyDenominacao: prop?.denominacao || "Não informada",
      propertyMunicipio: prop?.municipio || "",
      etapas: {
        dadosGerais: etapaDadosGerais,
        beneficiario: etapaBen,
        propriedade: etapaProp,
        patrimonio: etapaPat,
        identificacao: etapaIdent,
        fluxoCaixa: etapaFluxo,
        financiamento: etapaFin,
        documentos: etapaDocs,
      },
      percentualGlobal,
      totalPendencias,
    };
  }
}
