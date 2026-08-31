import fs from "node:fs";
import path from "node:path";
import type { DatabaseSchema } from "../../src/server/db/database";
import { getFirebaseAdminFirestore } from "../../src/server/lib/firebase-admin";

const collections = {
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
} as const;

const execute = process.argv.includes("--execute");
const sourceArg = process.argv.find((argument) => argument.startsWith("--source="));
const sourcePath = path.resolve(sourceArg?.slice("--source=".length) || "data/funderr_db.json");

if (!fs.existsSync(sourcePath)) throw new Error(`Arquivo não encontrado: ${sourcePath}`);
const data = JSON.parse(fs.readFileSync(sourcePath, "utf8")) as DatabaseSchema;

let total = 0;
for (const key of Object.keys(collections) as Array<keyof typeof collections>) {
  const records = data[key] as Array<{ id?: string }>;
  if (!Array.isArray(records)) throw new Error(`Coleção inválida no JSON: ${key}`);
  for (const record of records) {
    if (!record.id) throw new Error(`Registro sem id encontrado em ${key}`);
  }
  total += records.length;
  console.log(`${collections[key]}: ${records.length} registros`);
}

if (!execute) {
  console.log(`\nValidação concluída: ${total} registros.`);
  console.log("Nenhuma escrita realizada. Use --execute para importar no Firestore.");
  process.exit(0);
}

const firestore = getFirebaseAdminFirestore();
const writer = firestore.bulkWriter();
for (const key of Object.keys(collections) as Array<keyof typeof collections>) {
  const records = data[key] as Array<{ id: string }>;
  for (const record of records) {
    writer.set(
      firestore.collection(collections[key]).doc(record.id),
      JSON.parse(JSON.stringify(record)),
      { merge: true }
    );
  }
}
writer.set(firestore.collection("funderr_meta").doc("application"), {
  remoteConfig: data.remoteConfig || {},
  counters: data.counters || {},
  migratedAt: new Date().toISOString(),
  source: path.basename(sourcePath),
});
await writer.close();
console.log(`Migração concluída: ${total} registros gravados de forma idempotente.`);
