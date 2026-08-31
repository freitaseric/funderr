import crypto from "crypto";
import { db } from "../db/database";
import {
  ProposalIdentification,
  ProposalJob,
  ProposalJobCategory,
  ProposalUseSource,
  User,
} from "../../domain/types";
import { roundCurrency } from "../../domain/calculations";
import { RevisionService } from "./revision.service";

const JOB_CATEGORIES: ProposalJobCategory[] = [
  "ADMINISTRATIVOS",
  "TECNICOS",
  "PRODUTIVOS",
  "OUTROS",
];

type IdentificationInput = {
  finalidade?: string;
  mercado?: string;
  faturamentoUltimoAno?: number;
  analiseLocalizacao?: string;
  consideracoes?: string;
  empregosConfirmados?: boolean;
  usosFontesConfirmados?: boolean;
  jobs?: { categoria: ProposalJobCategory; faseAtual: number; faseExpansao: number }[];
  usesSources?: {
    tipo: "USO" | "FONTE";
    categoria: string;
    realizado: number;
    aRealizar: number;
  }[];
};

function emptyIdentification(proposalId: string): ProposalIdentification {
  const now = new Date().toISOString();
  return {
    id: "",
    proposalId,
    finalidade: "",
    mercado: "",
    faturamentoUltimoAno: 0,
    analiseLocalizacao: "",
    consideracoes: "",
    empregosConfirmados: false,
    usosFontesConfirmados: false,
    status: "PENDENTE",
    createdAt: now,
    updatedAt: now,
  };
}

function emptyJobs(proposalId: string): ProposalJob[] {
  const now = new Date().toISOString();
  return JOB_CATEGORIES.map((categoria) => ({
    id: `form-${categoria}`,
    proposalId,
    categoria,
    faseAtual: 0,
    faseExpansao: 0,
    total: 0,
    createdAt: now,
    updatedAt: now,
  }));
}

function normalizeUseSource(item: ProposalUseSource): ProposalUseSource {
  const legacyValue = Number((item as ProposalUseSource & { valor?: number }).valor || 0);
  const realizado = roundCurrency(Number(item.realizado || 0));
  const aRealizar = roundCurrency(
    Number(item.aRealizar ?? (item.total === undefined ? legacyValue : 0))
  );
  return {
    ...item,
    realizado,
    aRealizar,
    total: roundCurrency(realizado + aRealizar),
  };
}

export class IdentificationService {
  static getByProposalId(proposalId: string) {
    const raw = db.getRawData();
    const proposal = raw.proposals.find((item) => item.id === proposalId);
    if (!proposal) throw new Error("Processo não encontrado");

    const identification =
      raw.identifications.find((item) => item.proposalId === proposalId) ||
      emptyIdentification(proposalId);
    const storedJobs = raw.jobs.filter((item) => item.proposalId === proposalId);
    const jobs = storedJobs.length > 0 ? storedJobs : emptyJobs(proposalId);
    const usesSources = raw.usesSources
      .filter((item) => item.proposalId === proposalId)
      .map(normalizeUseSource);

    const totalUsos = usesSources
      .filter((item) => item.tipo === "USO")
      .reduce((total, item) => roundCurrency(total + item.total), 0);
    const totalFontes = usesSources
      .filter((item) => item.tipo === "FONTE")
      .reduce((total, item) => roundCurrency(total + item.total), 0);

    const patrimonioRealizado = raw.patrimonyItems
      .filter((item) => item.proposalId === proposalId)
      .reduce<Record<string, number>>((totals, item) => {
        const categoria = item.categoria
          .toLowerCase()
          .replaceAll("_", " ")
          .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
        totals[categoria] = roundCurrency((totals[categoria] || 0) + item.valorTotal);
        return totals;
      }, {});

    return {
      proposalId,
      identification,
      jobs,
      usesSources,
      patrimonioRealizado: Object.entries(patrimonioRealizado).map(([categoria, realizado]) => ({
        tipo: "USO" as const,
        categoria,
        realizado,
        aRealizar: 0,
        total: realizado,
      })),
      totalUsos,
      totalFontes,
      diferenca: roundCurrency(totalFontes - totalUsos),
      pendencias: this.getPending(proposalId),
    };
  }

  static save(proposalId: string, data: IdentificationInput, actor: User) {
    const raw = db.getRawData();
    const proposal = raw.proposals.find((item) => item.id === proposalId);
    if (!proposal) throw new Error("Processo não encontrado");

    let identification = raw.identifications.find((item) => item.proposalId === proposalId);
    const now = new Date().toISOString();
    if (!identification) {
      identification = {
        ...emptyIdentification(proposalId),
        id: `ident-${crypto.randomUUID()}`,
        createdAt: now,
      };
      raw.identifications.push(identification);
    }

    if (data.finalidade !== undefined) identification.finalidade = data.finalidade.trim();
    if (data.mercado !== undefined) identification.mercado = data.mercado.trim();
    if (data.faturamentoUltimoAno !== undefined) identification.faturamentoUltimoAno = Number(data.faturamentoUltimoAno);
    if (data.analiseLocalizacao !== undefined) identification.analiseLocalizacao = data.analiseLocalizacao.trim();
    if (data.consideracoes !== undefined) identification.consideracoes = data.consideracoes.trim();

    if (data.jobs) {
      raw.jobs = raw.jobs.filter((item) => item.proposalId !== proposalId);
      for (const job of data.jobs) {
        const faseAtual = Number(job.faseAtual);
        const faseExpansao = Number(job.faseExpansao);
        raw.jobs.push({
          id: `job-${crypto.randomUUID()}`,
          proposalId,
          categoria: job.categoria,
          faseAtual,
          faseExpansao,
          total: faseAtual + faseExpansao,
          createdAt: now,
          updatedAt: now,
        });
      }
      identification.empregosConfirmados = data.empregosConfirmados === true;
    } else if (data.empregosConfirmados !== undefined) {
      identification.empregosConfirmados = data.empregosConfirmados;
    }

    if (data.usesSources) {
      raw.usesSources = raw.usesSources.filter((item) => item.proposalId !== proposalId);
      for (const item of data.usesSources) {
        const realizado = roundCurrency(Number(item.realizado));
        const aRealizar = roundCurrency(Number(item.aRealizar));
        raw.usesSources.push({
          id: `us-${crypto.randomUUID()}`,
          proposalId,
          tipo: item.tipo,
          categoria: item.categoria.trim(),
          realizado,
          aRealizar,
          total: roundCurrency(realizado + aRealizar),
          createdAt: now,
          updatedAt: now,
        });
      }
      identification.usosFontesConfirmados = data.usosFontesConfirmados === true;
    } else if (data.usosFontesConfirmados !== undefined) {
      identification.usosFontesConfirmados = data.usosFontesConfirmados;
    }

    identification.status = "RASCUNHO";
    identification.concluidoEm = null;
    identification.updatedAt = now;
    proposal.updatedAt = now;
    RevisionService.invalidateAfterIdentification(proposalId, actor);

    db.logAudit({
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role || undefined,
      acao: "identification.saved",
      entidade: "ProposalIdentification",
      entityId: identification.id,
      correlationId: crypto.randomUUID(),
    });
    db.save();
    return this.getByProposalId(proposalId);
  }

  static complete(proposalId: string, actor: User) {
    const raw = db.getRawData();
    const proposal = raw.proposals.find((item) => item.id === proposalId);
    if (!proposal) throw new Error("Processo não encontrado");
    const pending = this.getPending(proposalId);
    if (pending.length > 0) throw new Error(`Não é possível concluir a Identificação: ${pending.join("; ")}`);

    const identification = raw.identifications.find((item) => item.proposalId === proposalId)!;
    const now = new Date().toISOString();
    identification.status = "CONCLUIDO";
    identification.concluidoEm = now;
    identification.updatedAt = now;
    proposal.identificacaoRevisadaEm = now;
    proposal.updatedAt = now;

    db.logAudit({
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role || undefined,
      acao: "identification.completed",
      entidade: "ProposalIdentification",
      entityId: identification.id,
      correlationId: crypto.randomUUID(),
    });
    db.save();
    return this.getByProposalId(proposalId);
  }

  static getPending(proposalId: string): string[] {
    const raw = db.getRawData();
    const proposal = raw.proposals.find((item) => item.id === proposalId);
    if (!proposal) return ["Processo não encontrado"];
    const pending: string[] = [];
    const identification = raw.identifications.find((item) => item.proposalId === proposalId);
    const jobs = raw.jobs.filter((item) => item.proposalId === proposalId);
    const usesSources = raw.usesSources.filter((item) => item.proposalId === proposalId).map(normalizeUseSource);

    if (proposal.patrimonioStatus !== "CONCLUIDO") pending.push("Conclua o Patrimônio antes da Identificação");
    if (!identification?.finalidade.trim()) pending.push("Informe a finalidade da proposta");
    if (!identification?.mercado.trim()) pending.push("Informe o mercado e a comercialização");
    if (!identification?.analiseLocalizacao.trim()) pending.push("Informe a análise de localização e acesso");
    if (!identification?.consideracoes.trim()) pending.push("Informe as considerações técnicas");

    const registeredCategories = new Set(jobs.map((job) => job.categoria));
    if (jobs.length !== JOB_CATEGORIES.length || JOB_CATEGORIES.some((item) => !registeredCategories.has(item))) {
      pending.push("Preencha as quatro categorias de empregos");
    }
    if (!identification?.empregosConfirmados) pending.push("Confirme a matriz de empregos");

    const totalUsos = usesSources.filter((item) => item.tipo === "USO").reduce((total, item) => roundCurrency(total + item.total), 0);
    const totalFontes = usesSources.filter((item) => item.tipo === "FONTE").reduce((total, item) => roundCurrency(total + item.total), 0);
    if (totalUsos <= 0) pending.push("Informe ao menos um uso com valor positivo");
    if (totalFontes <= 0) pending.push("Informe ao menos uma fonte com valor positivo");
    if (Math.abs(totalUsos - totalFontes) >= 0.01) pending.push("O total das fontes deve ser igual ao total dos usos");
    if (!identification?.usosFontesConfirmados) pending.push("Confirme a revisão de usos e fontes");
    return pending;
  }
}
