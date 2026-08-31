import crypto from "crypto";
import { db } from "../db/database";
import { Property, User } from "../../domain/types";
import {
  calculatePropertyCompleteness,
  isValidRoraimaMunicipality,
  validateCoordinates,
} from "../../domain/calculations";
import { RevisionService } from "./revision.service";

export class PropertyService {
  static list(beneficiaryId?: string): (Property & { percentualCompletude: number; pendencias: string[] })[] {
    const raw = db.getRawData();
    let list = raw.properties;
    if (beneficiaryId) {
      list = list.filter((p) => p.beneficiaryId === beneficiaryId);
    }
    return list.map((p) => {
      const b = raw.beneficiaries.find((item) => item.id === p.beneficiaryId);
      const { percent, pendencias } = calculatePropertyCompleteness(p);
      return {
        ...p,
        beneficiaryNome: b?.nome || "Beneficiário não localizado",
        percentualCompletude: percent,
        pendencias,
      };
    });
  }

  static getById(id: string): (Property & { percentualCompletude: number; pendencias: string[] }) | null {
    const raw = db.getRawData();
    const p = raw.properties.find((item) => item.id === id);
    if (!p) return null;
    const b = raw.beneficiaries.find((item) => item.id === p.beneficiaryId);
    const { percent, pendencias } = calculatePropertyCompleteness(p);
    return {
      ...p,
      beneficiaryNome: b?.nome || "Beneficiário não localizado",
      percentualCompletude: percent,
      pendencias,
    };
  }

  static createOrUpdate(data: Partial<Property>, actor: User): Property {
    const raw = db.getRawData();
    const isNew = !data.id;
    const id = data.id || `prop-${crypto.randomUUID()}`;

    // Validate beneficiary exists
    if (!data.beneficiaryId) throw new Error("Beneficiário é obrigatório");
    const ben = raw.beneficiaries.find((b) => b.id === data.beneficiaryId);
    if (!ben) throw new Error("Beneficiário informado não existe");

    // Validate municipality is in Roraima
    if (data.municipio && !isValidRoraimaMunicipality(data.municipio)) {
      throw new Error("Município deve ser um dos 15 municípios oficiais do Estado de Roraima");
    }

    // Validate coordinates
    const coordCheck = validateCoordinates(data.latitude, data.longitude);
    if (!coordCheck.valid && coordCheck.error) {
      throw new Error(coordCheck.error);
    }

    const now = new Date().toISOString();
    let property: Property;

    if (isNew) {
      property = {
        id,
        beneficiaryId: data.beneficiaryId,
        denominacao: data.denominacao?.trim() || "",
        endereco: data.endereco?.trim() || "",
        municipio: data.municipio || "",
        estado: "RR",
        areaTotal: Number(data.areaTotal || 0),
        areaDisponivel: data.areaDisponivel !== undefined ? Number(data.areaDisponivel) : undefined,
        areaLegal: data.areaLegal !== undefined ? Number(data.areaLegal) : undefined,
        formaOcupacao: data.formaOcupacao?.trim() || "",
        tempoExploracao: data.tempoExploracao?.trim(),
        modulo: data.modulo?.trim(),
        documentoExistente: data.documentoExistente?.trim() || "",
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        placeId: data.placeId?.trim(),
        confrontacaoNorte: data.confrontacaoNorte?.trim(),
        confrontacaoSul: data.confrontacaoSul?.trim(),
        confrontacaoLeste: data.confrontacaoLeste?.trim(),
        confrontacaoOeste: data.confrontacaoOeste?.trim(),
        administracao: data.administracao?.trim(),
        createdAt: now,
        updatedAt: now,
      };
      raw.properties.push(property);

      db.logAudit({
        userId: actor.id,
        userName: actor.name,
        userRole: actor.role || undefined,
        acao: "property.created",
        entidade: "Property",
        entityId: id,
        correlationId: crypto.randomUUID(),
        after: property,
      });
    } else {
      const existing = raw.properties.find((p) => p.id === id);
      if (!existing) throw new Error("Propriedade não encontrada");

      // Immutable beneficiary constraint (prevents orphan proposals)
      if (data.beneficiaryId && data.beneficiaryId !== existing.beneficiaryId) {
        throw new Error("Não é permitido alterar o beneficiário de uma propriedade existente");
      }

      const before = { ...existing };
      property = {
        ...existing,
        ...data,
        beneficiaryId: existing.beneficiaryId, // enforce immutable
        updatedAt: now,
      };
      const idx = raw.properties.findIndex((p) => p.id === id);
      raw.properties[idx] = property;
      RevisionService.invalidateByProperty(id, actor);

      db.logAudit({
        userId: actor.id,
        userName: actor.name,
        userRole: actor.role || undefined,
        acao: "property.updated",
        entidade: "Property",
        entityId: id,
        correlationId: crypto.randomUUID(),
        before,
        after: property,
      });
    }

    db.save();
    return property;
  }
}
