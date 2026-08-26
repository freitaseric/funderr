import crypto from "crypto";
import fs from "fs";
import path from "path";
import { db } from "../db/database";
import { DocumentStatus, DocumentType, ProposalDocument, User } from "../../domain/types";

const UPLOAD_DIR = path.resolve(process.cwd(), "data", "uploads");

export class DocumentService {
  static init() {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  }

  static listByProposalId(proposalId: string): ProposalDocument[] {
    const raw = db.getRawData();
    return raw.documents.filter((d) => d.proposalId === proposalId);
  }

  static async uploadDocument(
    proposalId: string,
    file: {
      nomeArquivo: string;
      mimeType: string;
      buffer: Buffer | string;
      tipo: DocumentType;
    },
    actor: User
  ): Promise<ProposalDocument> {
    this.init();
    const raw = db.getRawData();
    const proposal = raw.proposals.find((p) => p.id === proposalId);
    if (!proposal) throw new Error("Processo não encontrado");

    const id = `doc-${crypto.randomUUID()}`;
    const safeName = `${id}_${file.nomeArquivo.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const storagePath = path.join(UPLOAD_DIR, safeName);

    let bytes = 0;
    if (typeof file.buffer === "string") {
      // base64
      const buf = Buffer.from(file.buffer.replace(/^data:.*,/, ""), "base64");
      fs.writeFileSync(storagePath, buf);
      bytes = buf.length;
    } else {
      fs.writeFileSync(storagePath, file.buffer);
      bytes = file.buffer.length;
    }

    const now = new Date().toISOString();

    // Generate Document AI / Gemini extraction structured data according to document type
    const { extractedData, confidence } = this.simulateDocumentExtraction(file.tipo, file.nomeArquivo);

    const doc: ProposalDocument = {
      id,
      proposalId,
      tipo: file.tipo,
      nomeArquivo: file.nomeArquivo,
      mimeType: file.mimeType || "application/pdf",
      tamanhoBytes: bytes,
      storagePath,
      status: "REVIEW_REQUIRED", // Document AI extracted, requires human review
      extractedData,
      aiConfidence: confidence,
      createdAt: now,
      updatedAt: now,
    };

    raw.documents.push(doc);
    proposal.updatedAt = now;

    db.logAudit({
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role || undefined,
      acao: "document.uploaded",
      entidade: "ProposalDocument",
      entityId: id,
      correlationId: crypto.randomUUID(),
      metadata: { tipo: file.tipo, nomeArquivo: file.nomeArquivo, tamanhoBytes: bytes },
    });

    db.save();
    return doc;
  }

  static confirmExtractedData(
    proposalId: string,
    documentId: string,
    verifiedData: Record<string, any>,
    actor: User
  ): ProposalDocument {
    const raw = db.getRawData();
    const doc = raw.documents.find((d) => d.id === documentId && d.proposalId === proposalId);
    if (!doc) throw new Error("Documento não encontrado");

    const now = new Date().toISOString();
    doc.status = "CONFIRMED";
    doc.extractedData = verifiedData;
    doc.humanConfirmedBy = actor.name;
    doc.humanConfirmedAt = now;
    doc.updatedAt = now;

    db.logAudit({
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role || undefined,
      acao: "document.confirmed",
      entidade: "ProposalDocument",
      entityId: documentId,
      correlationId: crypto.randomUUID(),
      after: doc,
    });

    db.save();
    return doc;
  }

  static delete(proposalId: string, documentId: string, actor: User): boolean {
    const raw = db.getRawData();
    const doc = raw.documents.find((d) => d.id === documentId && d.proposalId === proposalId);
    if (!doc) throw new Error("Documento não encontrado");

    try {
      if (fs.existsSync(doc.storagePath)) {
        fs.unlinkSync(doc.storagePath);
      }
    } catch (e) {
      console.warn("Could not delete physical file:", e);
    }

    raw.documents = raw.documents.filter((d) => d.id !== documentId);

    db.logAudit({
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role || undefined,
      acao: "document.deleted",
      entidade: "ProposalDocument",
      entityId: documentId,
      correlationId: crypto.randomUUID(),
      before: doc,
    });

    db.save();
    return true;
  }

  private static simulateDocumentExtraction(tipo: DocumentType, fileName: string) {
    if (tipo === "CAF_DAP") {
      return {
        extractedData: {
          numeroCAF: "RR-2026.984.120-PR",
          titular: "Produtor Familiar Rural",
          enquadramentoPRONAF: "Grupo B / VAF Familiar",
          validade: "2028-12-31",
          areaImovelHa: 45.8,
          municipio: "Cantá - RR",
        },
        confidence: 0.96,
      };
    }
    if (tipo === "CAR_RORAIMA") {
      return {
        extractedData: {
          numeroCAR: "RR-1400100-8F9E.2A3B.4C5D.6E7F",
          areaImovelHa: 52.4,
          areaPreservacaoPermanenteHa: 8.2,
          areaReservaLegalHa: 26.2,
          statusCadastro: "Ativo / Pendente de Validação FEMARH",
        },
        confidence: 0.94,
      };
    }
    if (tipo === "CPF_RG") {
      return {
        extractedData: {
          nomeCompleto: "Beneficiário Titular",
          cpf: "123.456.789-00",
          rg: "123456-SSP/RR",
          dataNascimento: "1982-05-14",
          orgaoEmissor: "SSP/RR",
        },
        confidence: 0.98,
      };
    }
    if (tipo === "ORCAMENTO") {
      return {
        extractedData: {
          fornecedor: "Agro Roraima Máquinas e Insumos LTDA",
          cnpj: "04.892.112/0001-90",
          valorTotalOrcamento: 65400.0,
          itensIdentificados: [
            "Microtrator Agrícola 18CV com Enxada Rotativa",
            "Kit Irrigação por Gotejamento 1.5 Ha",
            "Cerca e Mourões Tratados 1000m",
          ],
          validadeProposta: "30 dias",
        },
        confidence: 0.92,
      };
    }
    return {
      extractedData: {
        documento: fileName,
        tipoDetectado: tipo,
        resumo: "Documento digitalizado e catalogado com sucesso no repositório de crédito rural.",
      },
      confidence: 0.88,
    };
  }
}
