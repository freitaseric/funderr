import crypto from "crypto";
import { db } from "../db/database";
import { Proposal, ProposalStatusHistory, StepStatus, User } from "../../domain/types";
import { calculateBeneficiaryCompleteness, calculatePropertyCompleteness, calculateProposalCompleteness, determineEffectiveStepStatuses } from "../../domain/calculations";
import { IdentificationService } from "./identification.service";

export interface ProposalDetailView {
  proposal: Proposal;
  beneficiaryNome: string;
  beneficiaryCpf: string;
  propertyDenominacao: string;
  propertyMunicipio: string;
  etapas: {
    dadosGerais: { status: StepStatus; percent: number; pendencias: string[] };
    beneficiario: { status: StepStatus; percent: number; pendencias: string[] };
    propriedade: { status: StepStatus; percent: number; pendencias: string[] };
    patrimonio: { status: StepStatus; percent: number; pendencias: string[] };
    identificacao: { status: StepStatus; percent: number; pendencias: string[] };
    fluxoCaixa: { status: StepStatus; percent: number; pendencias: string[] };
    financiamento: { status: StepStatus; percent: number; pendencias: string[] };
    documentos: { status: StepStatus; total: number; confirmados: number; pendencias: string[] };
  };
  percentualGlobal: number;
  totalPendencias: number;
}

export interface ProposalStatusHistoryView extends ProposalStatusHistory {
  changedByName: string;
}

export class ProposalService {
  private static readonly allowedStatusTransitions: Record<Proposal["status"], Proposal["status"][]> = {
    "EM ELABORAÇÃO": ["EM ANÁLISE"],
    "EM ANÁLISE": ["EM ELABORAÇÃO", "APROVADO", "RECUSADO"],
    APROVADO: ["EM ANÁLISE", "CONCLUÍDO"],
    RECUSADO: ["EM ELABORAÇÃO", "EM ANÁLISE"],
    "CONCLUÍDO": ["EM ANÁLISE"],
  };

  static list(): ProposalDetailView[] {
    const raw = db.getRawData();
    return raw.proposals.map((p) => this.getDetailedView(p.id)!);
  }

  static getById(id: string): ProposalDetailView | null {
    return this.getDetailedView(id);
  }

  static getStatusHistory(id: string): ProposalStatusHistoryView[] {
    const raw = db.getRawData();
    if (!raw.proposals.some((proposal) => proposal.id === id)) {
      throw new Error("Processo não encontrado");
    }

    return raw.proposalStatusHistory
      .filter((item) => item.proposalId === id)
      .sort((a, b) => b.changedAt.localeCompare(a.changedAt))
      .map((item) => ({
        ...item,
        changedByName:
          raw.users.find((user) => user.id === item.changedById)?.name || "Usuário não localizado",
      }));
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

    if (data.status && data.status !== proposal.status) {
      throw new Error("Use a transição de status do processo para alterar a situação global");
    }

    const beneficiaryId = data.beneficiaryId || proposal.beneficiaryId;
    const propertyId = data.propertyId || proposal.propertyId;
    const ben = raw.beneficiaries.find((item) => item.id === beneficiaryId);
    if (!ben) throw new Error("Beneficiário não encontrado");
    const prop = raw.properties.find((item) => item.id === propertyId);
    if (!prop) throw new Error("Propriedade não encontrada");
    if (prop.beneficiaryId !== beneficiaryId) {
      throw new Error("A propriedade selecionada não pertence ao beneficiário");
    }
    proposal.beneficiaryId = beneficiaryId;
    proposal.propertyId = propertyId;

    if (data.data) proposal.data = data.data;
    if (data.atividade) proposal.atividade = data.atividade.trim();
    proposal.updatedAt = now;

    const baseChanged =
      before.beneficiaryId !== proposal.beneficiaryId ||
      before.propertyId !== proposal.propertyId ||
      before.data !== proposal.data ||
      before.atividade !== proposal.atividade;
    if (baseChanged && (proposal.status === "APROVADO" || proposal.status === "CONCLUÍDO")) {
      const previousStatus = proposal.status;
      proposal.status = "EM ANÁLISE";
      this.recordStatusChange(
        proposal,
        previousStatus,
        "EM ANÁLISE",
        "Dados gerais do processo foram alterados e exigem nova análise",
        actor
      );
    }

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

  static changeStatus(
    id: string,
    nextStatus: Proposal["status"],
    reason: string,
    actor: User
  ): ProposalDetailView {
    const raw = db.getRawData();
    const proposal = raw.proposals.find((item) => item.id === id);
    if (!proposal) throw new Error("Processo não encontrado");
    if (nextStatus === proposal.status) return this.getDetailedView(id)!;
    if (!this.allowedStatusTransitions[proposal.status].includes(nextStatus)) {
      throw new Error(`Transição de ${proposal.status} para ${nextStatus} não permitida`);
    }

    const managerialTransition = ["APROVADO", "RECUSADO", "CONCLUÍDO"].includes(nextStatus) ||
      proposal.status === "CONCLUÍDO";
    if (managerialTransition && actor.role !== "ADMIN" && actor.role !== "GESTOR") {
      throw new Error("Apenas administradores e gestores podem aprovar, recusar ou concluir processos");
    }
    if ((nextStatus === "RECUSADO" || proposal.status === "CONCLUÍDO") && !reason.trim()) {
      throw new Error("Informe o motivo desta transição de status");
    }

    if (nextStatus === "CONCLUÍDO") {
      const detail = this.getDetailedView(id)!;
      const incompleteStages = Object.entries(detail.etapas)
        .filter(([, stage]) => stage.status !== "CONCLUIDO")
        .map(([stage]) => stage);
      if (incompleteStages.length > 0) {
        throw new Error(`Processo não pode ser concluído. Etapas pendentes: ${incompleteStages.join(", ")}`);
      }
    }

    const previousStatus = proposal.status;
    proposal.status = nextStatus;
    proposal.updatedAt = new Date().toISOString();
    this.recordStatusChange(proposal, previousStatus, nextStatus, reason.trim(), actor);
    db.logAudit({
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role || undefined,
      acao: "proposal.status_changed",
      entidade: "Proposal",
      entityId: proposal.id,
      correlationId: crypto.randomUUID(),
      before: { status: previousStatus },
      after: { status: nextStatus, reason: reason.trim() },
    });
    db.save();
    return this.getDetailedView(id)!;
  }

  private static recordStatusChange(
    proposal: Proposal,
    previousStatus: Proposal["status"],
    nextStatus: Proposal["status"],
    reason: string,
    actor: User
  ): void {
    db.getRawData().proposalStatusHistory.unshift({
      id: `proposal-status-${crypto.randomUUID()}`,
      proposalId: proposal.id,
      statusAnterior: previousStatus,
      statusNovo: nextStatus,
      motivo: reason,
      changedById: actor.id,
      changedAt: new Date().toISOString(),
    });
  }

  private static getDetailedView(id: string): ProposalDetailView | null {
    const raw = db.getRawData();
    const proposal = raw.proposals.find((p) => p.id === id);
    if (!proposal) return null;

    const ben = raw.beneficiaries.find((b) => b.id === proposal.beneficiaryId);
    const prop = raw.properties.find((p) => p.id === proposal.propertyId);

    const beneficiaryReferences = ben
      ? raw.beneficiaryReferences.filter((reference) => reference.beneficiaryId === ben.id)
      : [];
    const benCompleteness = ben
      ? calculateBeneficiaryCompleteness({ ...ben, references: beneficiaryReferences })
      : { percent: 0, pendencias: ["Beneficiário não localizado"] };
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

    const proposalCompleteness = calculateProposalCompleteness(proposal);
    const etapaDadosGerais = {
      status: (proposalCompleteness.percent === 100
        ? "CONCLUIDO"
        : proposalCompleteness.percent > 0
          ? "RASCUNHO"
          : "PENDENTE") as StepStatus,
      percent: proposalCompleteness.percent,
      pendencias: proposalCompleteness.pendencias,
    };
    const etapaBen = {
      status: (benCompleteness.percent === 100 ? "CONCLUIDO" : benCompleteness.percent > 0 ? "RASCUNHO" : "PENDENTE") as StepStatus,
      percent: benCompleteness.percent,
      pendencias: benCompleteness.pendencias,
    };
    const etapaProp = {
      status: (propCompleteness.percent === 100 ? "CONCLUIDO" : propCompleteness.percent > 0 ? "RASCUNHO" : "PENDENTE") as StepStatus,
      percent: propCompleteness.percent,
      pendencias: propCompleteness.pendencias,
    };
    const etapaPat = {
      status: effective.patrimonio,
      percent: effective.patrimonio === "CONCLUIDO" ? 100 : patItems.length > 0 ? 50 : 0,
      pendencias:
        effective.patrimonio === "CONCLUIDO"
          ? []
          : [
              ...(patItems.length === 0 ? ["Informe ao menos um item patrimonial"] : []),
              ...((proposal as any).patrimonioDividasConfirmadas === true
                ? []
                : ["Confirme a revisão da situação das dívidas"]),
              ...(effective.patrimonio === "EM_REVISAO"
                ? ["Revise e reconfirme o patrimônio após alterações"]
                : []),
            ],
    };
    const identificationPending = IdentificationService.getPending(id);
    const effectiveIdentificationStatus: StepStatus =
      effective.identificacao === "CONCLUIDO" && identificationPending.length > 0
        ? "EM_REVISAO"
        : effective.identificacao;
    const etapaIdent = {
      status: effectiveIdentificationStatus,
      percent: effectiveIdentificationStatus === "CONCLUIDO" ? 100 : ident?.status === "RASCUNHO" ? 50 : 0,
      pendencias:
        effectiveIdentificationStatus === "CONCLUIDO"
          ? []
          : [
              ...identificationPending,
              ...(effectiveIdentificationStatus === "EM_REVISAO"
                ? ["Revise a identificação após alterações no patrimônio"]
                : []),
            ],
    };
    const hasCashRevenue = cashItems.some((item) => item.tipo === "RECEITA");
    const hasCashCost = cashItems.some(
      (item) => item.tipo === "CUSTO_VARIAVEL" || item.tipo === "CUSTO_FIXO"
    );
    const etapaFluxo = {
      status: effective.fluxo,
      percent: effective.fluxo === "CONCLUIDO" ? 100 : cashItems.length > 0 ? 50 : 0,
      pendencias:
        effective.fluxo === "CONCLUIDO"
          ? []
          : [
              ...(hasCashRevenue ? [] : ["Informe ao menos uma receita"]),
              ...(hasCashCost ? [] : ["Informe ao menos um custo"]),
              ...(proposal.fluxoProjecaoConfirmada ? [] : ["Confirme a revisão da projeção de sete anos"]),
              ...(effective.fluxo === "EM_REVISAO" ? ["Revise o fluxo após alterações na identificação"] : []),
            ],
    };
    const etapaFin = {
      status: effective.financiamento,
      percent: effective.financiamento === "CONCLUIDO" ? 100 : financing?.status === "RASCUNHO" ? 50 : 0,
      pendencias:
        effective.financiamento === "CONCLUIDO"
          ? []
          : [
              ...(financing ? [] : ["Configure o cenário de financiamento"]),
              ...(financing?.garantiasConfirmadas ? [] : ["Confirme a situação das garantias"]),
              ...(financing?.cronogramaConfirmado ? [] : ["Confirme o cronograma financeiro"]),
              ...(effective.financiamento === "EM_REVISAO" ? ["Revise o financiamento após alterações no fluxo de caixa"] : []),
            ],
    };
    const etapaDocs = {
      status: (docs.length > 0 && docsConfirmed === docs.length ? "CONCLUIDO" : docs.length > 0 ? "RASCUNHO" : "PENDENTE") as StepStatus,
      total: docs.length,
      confirmados: docsConfirmed,
      pendencias:
        docs.length === 0
          ? ["Anexe os documentos do processo"]
          : docsConfirmed < docs.length
            ? [`Confirme ${docs.length - docsConfirmed} documento(s) pendente(s)`]
            : [],
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

    const totalPendencias = [
      etapaDadosGerais,
      etapaBen,
      etapaProp,
      etapaPat,
      etapaIdent,
      etapaFluxo,
      etapaFin,
      etapaDocs,
    ].reduce((total, etapa) => total + etapa.pendencias.length, 0);

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
