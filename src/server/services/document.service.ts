import crypto from "crypto";
import fs from "fs";
import path from "path";
import { db } from "../db/database";
import { DocumentStatus, DocumentType, ProposalDocument, User } from "../../domain/types";

const UPLOAD_DIR = path.resolve(process.cwd(), "data", "uploads");
const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

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
    if (!ALLOWED_MIME_TYPES.has(file.mimeType)) throw new Error("Formato de documento não suportado");

    const id = `doc-${crypto.randomUUID()}`;
    const safeName = `${id}_${file.nomeArquivo.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const storagePath = path.join(UPLOAD_DIR, safeName);

    const content =
      typeof file.buffer === "string"
        ? Buffer.from(file.buffer.replace(/^data:.*,/, ""), "base64")
        : file.buffer;
    if (content.length === 0) throw new Error("O documento enviado está vazio");
    if (content.length > MAX_DOCUMENT_SIZE) throw new Error("O documento excede o limite de 25 MB");
    fs.writeFileSync(storagePath, content);
    const bytes = content.length;

    const now = new Date().toISOString();

    const doc: ProposalDocument = {
      id,
      proposalId,
      tipo: file.tipo,
      nomeArquivo: file.nomeArquivo,
      mimeType: file.mimeType || "application/pdf",
      tamanhoBytes: bytes,
      storagePath,
      status: "REVIEW_REQUIRED",
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

}
