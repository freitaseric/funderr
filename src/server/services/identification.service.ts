import crypto from "crypto";
import { db } from "../db/database";
import { ProposalIdentification, ProposalJob, ProposalUseSource, User } from "../../domain/types";
import { roundCurrency } from "../../domain/calculations";

export class IdentificationService {
  static getByProposalId(proposalId: string) {
    const raw = db.getRawData();
    const proposal = raw.proposals.find((p) => p.id === proposalId);
    if (!proposal) throw new Error("Processo não encontrado");

    let ident = raw.identifications.find((i) => i.proposalId === proposalId);
    if (!ident) {
      ident = {
        id: `ident-${crypto.randomUUID()}`,
        proposalId,
        finalidade: "",
        mercado: "",
        faturamentoUltimoAno: 0,
        analiseLocalizacao: "",
        consideracoes: "",
        empregosConfirmados: false,
        usosFontesConfirmados: false,
        status: "PENDENTE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      raw.identifications.push(ident);
      db.save();
    }

    const jobs = raw.jobs.filter((j) => j.proposalId === proposalId);
    const usesSources = raw.usesSources.filter((u) => u.proposalId === proposalId);

    const totalUsos = usesSources
      .filter((u) => u.tipo === "USO")
      .reduce((acc, curr) => roundCurrency(acc + Number(curr.valor || 0)), 0);
    const totalFontes = usesSources
      .filter((u) => u.tipo === "FONTE")
      .reduce((acc, curr) => roundCurrency(acc + Number(curr.valor || 0)), 0);

    return {
      proposalId,
      identification: ident,
      jobs,
      usesSources,
      totalUsos,
      totalFontes,
    };
  }

  static save(
    proposalId: string,
    data: {
      finalidade?: string;
      mercado?: string;
      faturamentoUltimoAno?: number;
      analiseLocalizacao?: string;
      consideracoes?: string;
      empregosConfirmados?: boolean;
      usosFontesConfirmados?: boolean;
      jobs?: { categoria: string; faseAtual: number; faseExpansao: number }[];
      usesSources?: { tipo: "USO" | "FONTE"; categoria: string; valor: number }[];
    },
    actor: User
  ) {
    const raw = db.getRawData();
    const proposal = raw.proposals.find((p) => p.id === proposalId);
    if (!proposal) throw new Error("Processo não encontrado");

    let ident = raw.identifications.find((i) => i.proposalId === proposalId);
    const now = new Date().toISOString();

    if (!ident) {
      ident = {
        id: `ident-${crypto.randomUUID()}`,
        proposalId,
        finalidade: data.finalidade?.trim() || "",
        mercado: data.mercado?.trim() || "",
        faturamentoUltimoAno: Number(data.faturamentoUltimoAno || 0),
        analiseLocalizacao: data.analiseLocalizacao?.trim() || "",
        consideracoes: data.consideracoes?.trim() || "",
        empregosConfirmados: !!data.empregosConfirmados,
        usosFontesConfirmados: !!data.usosFontesConfirmados,
        status: "RASCUNHO",
        createdAt: now,
        updatedAt: now,
      };
      raw.identifications.push(ident);
    } else {
      ident.finalidade = data.finalidade !== undefined ? data.finalidade.trim() : ident.finalidade;
      ident.mercado = data.mercado !== undefined ? data.mercado.trim() : ident.mercado;
      ident.faturamentoUltimoAno =
        data.faturamentoUltimoAno !== undefined
          ? Number(data.faturamentoUltimoAno)
          : ident.faturamentoUltimoAno;
      ident.analiseLocalizacao =
        data.analiseLocalizacao !== undefined
          ? data.analiseLocalizacao.trim()
          : ident.analiseLocalizacao;
      ident.consideracoes =
        data.consideracoes !== undefined ? data.consideracoes.trim() : ident.consideracoes;
      ident.empregosConfirmados =
        data.empregosConfirmados !== undefined
          ? !!data.empregosConfirmados
          : ident.empregosConfirmados;
      ident.usosFontesConfirmados =
        data.usosFontesConfirmados !== undefined
          ? !!data.usosFontesConfirmados
          : ident.usosFontesConfirmados;
      if (ident.status !== "CONCLUIDO") {
        ident.status = "RASCUNHO";
      }
      ident.updatedAt = now;
    }

    if (data.jobs) {
      raw.jobs = raw.jobs.filter((j) => j.proposalId !== proposalId);
      data.jobs.forEach((j) => {
        raw.jobs.push({
          id: `job-${crypto.randomUUID()}`,
          proposalId,
          categoria: j.categoria,
          faseAtual: Number(j.faseAtual || 0),
          faseExpansao: Number(j.faseExpansao || 0),
          total: Number(j.faseAtual || 0) + Number(j.faseExpansao || 0),
          createdAt: now,
          updatedAt: now,
        });
      });
    }

    if (data.usesSources) {
      raw.usesSources = raw.usesSources.filter((u) => u.proposalId !== proposalId);
      data.usesSources.forEach((u) => {
        raw.usesSources.push({
          id: `us-${crypto.randomUUID()}`,
          proposalId,
          tipo: u.tipo,
          categoria: u.categoria,
          valor: roundCurrency(Number(u.valor || 0)),
          createdAt: now,
          updatedAt: now,
        });
      });
    }

    proposal.updatedAt = now;

    db.logAudit({
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role || undefined,
      acao: "identification.saved",
      entidade: "ProposalIdentification",
      entityId: ident.id,
      correlationId: crypto.randomUUID(),
    });

    db.save();
    return this.getByProposalId(proposalId);
  }

  static complete(proposalId: string, actor: User) {
    const raw = db.getRawData();
    const proposal = raw.proposals.find((p) => p.id === proposalId);
    if (!proposal) throw new Error("Processo não encontrado");

    // Must have patrimônio completed first
    const patStatus = (proposal as any).patrimonioStatus;
    if (patStatus !== "CONCLUIDO") {
      throw new Error("A etapa anterior (Patrimônio) deve estar concluída antes de concluir a Identificação");
    }

    const ident = raw.identifications.find((i) => i.proposalId === proposalId);
    if (!ident || !ident.finalidade.trim() || !ident.mercado.trim()) {
      throw new Error("Preencha a finalidade e o mercado antes de concluir a identificação");
    }

    const now = new Date().toISOString();
    ident.status = "CONCLUIDO";
    ident.concluidoEm = now;
    ident.updatedAt = now;
    proposal.identificacaoRevisadaEm = now;
    proposal.updatedAt = now;

    db.logAudit({
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role || undefined,
      acao: "identification.completed",
      entidade: "ProposalIdentification",
      entityId: ident.id,
      correlationId: crypto.randomUUID(),
    });

    db.save();
    return this.getByProposalId(proposalId);
  }
}
