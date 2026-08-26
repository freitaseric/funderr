import crypto from "crypto";
import { db } from "../db/database";
import { Beneficiary, BeneficiaryReference, User } from "../../domain/types";
import { calculateBeneficiaryCompleteness, formatCPF, formatPhone, validateCPF } from "../../domain/calculations";

export class BeneficiaryService {
  static list(): (Beneficiary & { percentualCompletude: number; totalPropriedades: number })[] {
    const raw = db.getRawData();
    return raw.beneficiaries.map((b) => {
      const refs = raw.beneficiaryReferences.filter((r) => r.beneficiaryId === b.id);
      const props = raw.properties.filter((p) => p.beneficiaryId === b.id);
      const { percent } = calculateBeneficiaryCompleteness(b);
      return {
        ...b,
        references: refs,
        percentualCompletude: percent,
        totalPropriedades: props.length,
      };
    });
  }

  static getById(id: string): (Beneficiary & { percentualCompletude: number; pendencias: string[] }) | null {
    const raw = db.getRawData();
    const b = raw.beneficiaries.find((item) => item.id === id);
    if (!b) return null;
    const refs = raw.beneficiaryReferences.filter((r) => r.beneficiaryId === b.id);
    const { percent, pendencias } = calculateBeneficiaryCompleteness(b);
    return {
      ...b,
      references: refs,
      percentualCompletude: percent,
      pendencias,
    };
  }

  static createOrUpdate(
    data: Partial<Beneficiary> & { references?: { ordem: number; nome: string; telefone: string }[] },
    actor: User
  ): Beneficiary {
    const raw = db.getRawData();
    const isNew = !data.id;
    const id = data.id || `ben-${crypto.randomUUID()}`;

    // Normalize CPF
    const normalizedCpf = data.cpf ? data.cpf.replace(/\D/g, "") : "";
    if (!normalizedCpf || !validateCPF(normalizedCpf)) {
      throw new Error("CPF inválido ou não informado");
    }

    // Check unique CPF
    const existingCpf = raw.beneficiaries.find(
      (b) => b.id !== id && b.cpf.replace(/\D/g, "") === normalizedCpf
    );
    if (existingCpf) {
      throw new Error("Já existe um beneficiário cadastrado com este CPF");
    }

    const now = new Date().toISOString();
    let beneficiary: Beneficiary;

    if (isNew) {
      beneficiary = {
        id,
        nome: data.nome?.trim() || "",
        cpf: normalizedCpf,
        telefone: data.telefone ? data.telefone.replace(/\D/g, "") : "",
        apelido: data.apelido?.trim(),
        nacionalidade: data.nacionalidade || "Brasileira",
        naturalidade: data.naturalidade?.trim(),
        estadoCivil: data.estadoCivil || "SOLTEIRO",
        dataNascimento: data.dataNascimento,
        profissao: data.profissao?.trim(),
        rg: data.rg?.trim(),
        escolaridade: data.escolaridade,
        endereco: data.endereco?.trim(),
        dependentes: Number(data.dependentes || 0),
        conjugeNome: data.conjugeNome?.trim(),
        conjugeRg: data.conjugeRg?.trim(),
        conjugeCpf: data.conjugeCpf ? data.conjugeCpf.replace(/\D/g, "") : undefined,
        createdAt: now,
        updatedAt: now,
      };
      raw.beneficiaries.push(beneficiary);
    } else {
      const existing = raw.beneficiaries.find((b) => b.id === id);
      if (!existing) throw new Error("Beneficiário não encontrado");
      const before = { ...existing };
      beneficiary = {
        ...existing,
        ...data,
        cpf: normalizedCpf,
        telefone: data.telefone ? data.telefone.replace(/\D/g, "") : existing.telefone,
        updatedAt: now,
      };
      const idx = raw.beneficiaries.findIndex((b) => b.id === id);
      raw.beneficiaries[idx] = beneficiary;

      db.logAudit({
        userId: actor.id,
        userName: actor.name,
        userRole: actor.role || undefined,
        acao: "beneficiary.updated",
        entidade: "Beneficiary",
        entityId: id,
        correlationId: crypto.randomUUID(),
        before,
        after: beneficiary,
      });
    }

    // Save references
    if (data.references) {
      raw.beneficiaryReferences = raw.beneficiaryReferences.filter((r) => r.beneficiaryId !== id);
      data.references.forEach((r, idx) => {
        raw.beneficiaryReferences.push({
          id: `ref-${crypto.randomUUID()}`,
          beneficiaryId: id,
          ordem: idx + 1,
          nome: r.nome,
          telefone: r.telefone.replace(/\D/g, ""),
          createdAt: now,
          updatedAt: now,
        });
      });
    }

    if (isNew) {
      db.logAudit({
        userId: actor.id,
        userName: actor.name,
        userRole: actor.role || undefined,
        acao: "beneficiary.created",
        entidade: "Beneficiary",
        entityId: id,
        correlationId: crypto.randomUUID(),
        after: beneficiary,
      });
    }

    db.save();
    return beneficiary;
  }
}
