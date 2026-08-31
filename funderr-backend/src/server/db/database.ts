import crypto from "crypto";
import { getFirebaseAdminFirestore } from "../lib/firebase-admin";
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

const COLLECTIONS = {
  users: "users",
  beneficiaries: "beneficiaries",
  beneficiaryReferences: "beneficiary_references",
  properties: "properties",
  proposals: "proposals",
  proposalStatusHistory: "proposal_status_history",
  patrimonyItems: "patrimony_items",
  patrimonyDebts: "patrimony_debts",
  jobs: "proposal_jobs",
  usesSources: "proposal_uses_sources",
  identifications: "proposal_identifications",
  cashFlowItems: "cash_flow_items",
  creditLines: "credit_lines",
  financingScenarios: "financing_scenarios",
  guarantees: "guarantees",
  documents: "proposal_documents",
  auditLogs: "audit_logs",
} as const satisfies Partial<Record<keyof DatabaseSchema, string>>;

type CollectionKey = keyof typeof COLLECTIONS;

export class FirestoreBackedDatabase {
  private data: DatabaseSchema;
  private persisted: DatabaseSchema;
  private inTransaction = false;
  private dirty = false;
  private initialized = false;
  private flushing: Promise<void> = Promise.resolve();

  constructor() {
    this.data = this.getDefaultSchema();
    this.persisted = structuredClone(this.data);
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

  public async initialize(): Promise<void> {
    if (this.initialized) return;
    if (process.env.FUNDERR_DATA_BACKEND === "memory") {
      this.initialized = true;
      console.warn("[Database] Backend em memória ativo; alterações não serão persistidas");
      return;
    }
    const firestore = getFirebaseAdminFirestore();
    const entries = await Promise.all(
      Object.entries(COLLECTIONS).map(async ([key, collection]) => {
        const snapshot = await firestore.collection(collection).get();
        return [key, snapshot.docs.map((doc) => doc.data())] as const;
      })
    );
    const meta = await firestore.collection("funderr_meta").doc("application").get();
    const loaded = this.getDefaultSchema();
    for (const [key, records] of entries) (loaded[key as CollectionKey] as unknown[]) = records;
    if (meta.exists) {
      const value = meta.data() || {};
      loaded.remoteConfig = { ...loaded.remoteConfig, ...(value.remoteConfig || {}) };
      loaded.counters = value.counters || {};
    }
    this.data = loaded;
    this.persisted = structuredClone(loaded);
    this.initialized = true;
    console.log("[Database] Estado carregado do Cloud Firestore");
  }

  public save(): void {
    this.dirty = true;
  }

  public async flush(): Promise<void> {
    if (process.env.FUNDERR_DATA_BACKEND === "memory") return;
    if (!this.dirty) return this.flushing;
    this.dirty = false;
    const next = structuredClone(this.data);
    this.flushing = this.flushing.then(async () => {
      const previous = this.persisted;
      const firestore = getFirebaseAdminFirestore();
      const writer = firestore.bulkWriter();
      for (const [key, collectionName] of Object.entries(COLLECTIONS)) {
        const currentRecords = (next[key as CollectionKey] as Array<{ id: string }>);
        const previousRecords = (previous[key as CollectionKey] as Array<{ id: string }>);
        const current = new Map(currentRecords.map((record) => [record.id, record]));
        const old = new Map(previousRecords.map((record) => [record.id, record]));
        for (const [id, record] of current) {
          if (JSON.stringify(record) !== JSON.stringify(old.get(id))) {
            writer.set(
              firestore.collection(collectionName).doc(id),
              JSON.parse(JSON.stringify(record))
            );
          }
        }
        for (const id of old.keys()) {
          if (!current.has(id)) writer.delete(firestore.collection(collectionName).doc(id));
        }
      }
      writer.set(firestore.collection("funderr_meta").doc("application"), {
        remoteConfig: next.remoteConfig,
        counters: next.counters,
        updatedAt: new Date().toISOString(),
      });
      await writer.close();
      this.persisted = next;
    });
    return this.flushing;
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

export const db = new FirestoreBackedDatabase();
