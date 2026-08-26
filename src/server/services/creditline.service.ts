import crypto from "crypto";
import { db } from "../db/database";
import { CreditLine, RemoteConfigFlags, User } from "../../domain/types";

export class CreditLineService {
  static list(onlyActive: boolean = false): CreditLine[] {
    const lines = db.getRawData().creditLines;
    if (onlyActive) {
      return lines.filter((l) => l.ativo);
    }
    return lines;
  }

  static createOrUpdate(data: Partial<CreditLine>, actor: User): CreditLine {
    if (actor.role !== "ADMIN" && actor.role !== "GESTOR") {
      throw new Error("Apenas Administradores e Gestores podem cadastrar ou editar linhas de crédito");
    }

    const raw = db.getRawData();
    const isNew = !data.id;
    const id = data.id || `lc-${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    let line: CreditLine;

    if (isNew) {
      line = {
        id,
        codigo: data.codigo?.trim().toUpperCase() || `LC_${Date.now()}`,
        nome: data.nome?.trim() || "Nova Linha de Crédito",
        ativo: data.ativo !== undefined ? data.ativo : true,
        tetoFinanciamento: Number(data.tetoFinanciamento || 50000),
        taxaJurosAnual: Number(data.taxaJurosAnual || 2.0),
        prazoMaxAnos: Number(data.prazoMaxAnos || 5),
        carenciaMaxAnos: Number(data.carenciaMaxAnos || 1),
        percentualFinanciavelMax: Number(data.percentualFinanciavelMax || 100),
        percentualAterPadrao: Number(data.percentualAterPadrao || 2.5),
        observacoes: data.observacoes?.trim() || "",
        createdAt: now,
        updatedAt: now,
      };
      raw.creditLines.push(line);

      db.logAudit({
        userId: actor.id,
        userName: actor.name,
        userRole: actor.role || undefined,
        acao: "credit_line.created",
        entidade: "CreditLine",
        entityId: id,
        correlationId: crypto.randomUUID(),
        after: line,
      });
    } else {
      const existing = raw.creditLines.find((l) => l.id === id);
      if (!existing) throw new Error("Linha de crédito não encontrada");
      const before = { ...existing };
      line = {
        ...existing,
        ...data,
        updatedAt: now,
      };
      const idx = raw.creditLines.findIndex((l) => l.id === id);
      raw.creditLines[idx] = line;

      db.logAudit({
        userId: actor.id,
        userName: actor.name,
        userRole: actor.role || undefined,
        acao: "credit_line.updated",
        entidade: "CreditLine",
        entityId: id,
        correlationId: crypto.randomUUID(),
        before,
        after: line,
      });
    }

    db.save();
    return line;
  }
}

export class AuditService {
  static list(params: {
    limit?: number;
    entidade?: string;
    acao?: string;
    userId?: string;
  }) {
    const raw = db.getRawData();
    let list = raw.auditLogs;

    if (params.entidade) {
      list = list.filter((l) => l.entidade.toLowerCase() === params.entidade!.toLowerCase());
    }
    if (params.acao) {
      list = list.filter((l) => l.acao.toLowerCase().includes(params.acao!.toLowerCase()));
    }
    if (params.userId) {
      list = list.filter((l) => l.userId === params.userId);
    }

    return list.slice(0, params.limit || 100);
  }
}

export class RemoteConfigService {
  static get(): RemoteConfigFlags {
    return db.getRawData().remoteConfig;
  }

  static update(flags: Partial<RemoteConfigFlags>, actor: User): RemoteConfigFlags {
    if (actor.role !== "ADMIN") {
      throw new Error("Apenas administradores podem alterar configurações remotas");
    }
    const raw = db.getRawData();
    raw.remoteConfig = { ...raw.remoteConfig, ...flags };
    db.save();
    return raw.remoteConfig;
  }
}
