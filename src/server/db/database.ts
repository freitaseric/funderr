import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  AuditLog,
  Beneficiary,
  BeneficiaryReference,
  CashFlowItem,
  CreditLine,
  FinancingScenario,
  Guarantee,
  PatrimonyDebt,
  PatrimonyItem,
  Property,
  Proposal,
  ProposalDocument,
  ProposalIdentification,
  ProposalJob,
  ProposalStatusHistory,
  ProposalUseSource,
  RemoteConfigFlags,
  User,
} from "../../domain/types";

export interface DatabaseSchema {
  users: User[];
  beneficiaries: Beneficiary[];
  beneficiaryReferences: BeneficiaryReference[];
  properties: Property[];
  proposals: Proposal[];
  proposalStatusHistory: ProposalStatusHistory[];
  patrimonyItems: PatrimonyItem[];
  patrimonyDebts: PatrimonyDebt[];
  jobs: ProposalJob[];
  usesSources: ProposalUseSource[];
  identifications: ProposalIdentification[];
  cashFlowItems: CashFlowItem[];
  creditLines: CreditLine[];
  financingScenarios: FinancingScenario[];
  guarantees: Guarantee[];
  documents: ProposalDocument[];
  auditLogs: AuditLog[];
  remoteConfig: RemoteConfigFlags;
  counters: Record<string, number>;
}

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "funderr_db.json");

export class RelationalDatabase {
  private data: DatabaseSchema;
  private inTransaction = false;

  constructor() {
    this.data = this.load();
  }

  private getDefaultSchema(): DatabaseSchema {
    return {
      users: [],
      beneficiaries: [],
      beneficiaryReferences: [],
      properties: [],
      proposals: [],
      proposalStatusHistory: [],
      patrimonyItems: [],
      patrimonyDebts: [],
      jobs: [],
      usesSources: [],
      identifications: [],
      cashFlowItems: [],
      creditLines: [],
      financingScenarios: [],
      guarantees: [],
      documents: [],
      auditLogs: [],
      remoteConfig: {
        documents_ai: false,
        realtime_presence: false,
        assistant: false,
        advanced_maps: false,
        new_financing_ui: true,
      },
      counters: {},
    };
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        return { ...this.getDefaultSchema(), ...JSON.parse(raw) };
      }
    } catch (err) {
      console.error("[Database] Error reading db file, using fresh schema:", err);
    }
    return this.getDefaultSchema();
  }

  public save(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tempPath = `${DB_FILE}.${Date.now()}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), "utf-8");
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error("[Database] Error writing db file:", err);
    }
  }

  public transaction<T>(fn: () => T): T {
    this.inTransaction = true;
    try {
      const res = fn();
      this.save();
      return res;
    } finally {
      this.inTransaction = false;
    }
  }

  public getRawData(): DatabaseSchema {
    return this.data;
  }

  // --- Sequences & Next Proposal Number AAAA-NNNN ---
  public getNextProposalNumber(year: number = new Date().getFullYear()): string {
    const key = `proposals-${year}`;
    const current = this.data.counters[key] || 0;
    const next = current + 1;
    this.data.counters[key] = next;
    this.save();
    const seqStr = String(next).padStart(4, "0");
    return `${year}-${seqStr}`;
  }

  // --- Audit Logger ---
  public logAudit(log: Omit<AuditLog, "id" | "timestamp">): void {
    const newLog: AuditLog = {
      id: `audit-${crypto.randomUUID()}`,
      timestamp: new Date().toISOString(),
      ...log,
    };
    this.data.auditLogs.unshift(newLog);
    // Keep max 5000 logs in memory
    if (this.data.auditLogs.length > 5000) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 5000);
    }
    if (!this.inTransaction) this.save();
  }
}

export const db = new RelationalDatabase();
