import { Router, Request, Response } from "express";
import { AuthService } from "./services/auth.service";
import { BeneficiaryService } from "./services/beneficiary.service";
import { PropertyService } from "./services/property.service";
import { ProposalService } from "./services/proposal.service";
import { PatrimonyService } from "./services/patrimony.service";
import { IdentificationService } from "./services/identification.service";
import { CashFlowService } from "./services/cashflow.service";
import { FinancingService } from "./services/financing.service";
import { DocumentService } from "./services/document.service";
import { AuditService, CreditLineService, RemoteConfigService } from "./services/creditline.service";
import { beneficiarySchema, creditLineSchema, financingScenarioSchema, propertySchema, proposalSchema } from "../domain/validation";

export const apiRouter = Router();

// Middleware to resolve user
function getUser(req: Request) {
  return AuthService.getCurrentUser(req.headers as any);
}

// Health check
apiRouter.get("/health", (req, res) => {
  res.json({ status: "ok", app: "FUNDERR", version: "0.10.2", timestamp: new Date().toISOString() });
});

// Auth & Users
apiRouter.get("/auth/me", (req, res) => {
  try {
    const user = getUser(req);
    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get("/users", (req, res) => {
  try {
    const users = AuthService.listUsers();
    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.patch("/users/:id/role", (req, res) => {
  try {
    const actor = getUser(req);
    const { role, status } = req.body;
    const user = AuthService.updateUserRole(req.params.id, role, status, actor);
    res.json({ user });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Beneficiaries
apiRouter.get("/beneficiaries", (req, res) => {
  try {
    const list = BeneficiaryService.list();
    res.json({ beneficiaries: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get("/beneficiaries/:id", (req, res) => {
  try {
    const b = BeneficiaryService.getById(req.params.id);
    if (!b) return res.status(404).json({ error: "Beneficiário não encontrado" });
    res.json({ beneficiary: b });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post("/beneficiaries", (req, res) => {
  try {
    const actor = getUser(req);
    const parsed = beneficiarySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Dados inválidos" });
    }
    const b = BeneficiaryService.createOrUpdate(req.body, actor);
    res.json({ beneficiary: b });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Properties
apiRouter.get("/properties", (req, res) => {
  try {
    const list = PropertyService.list(req.query.beneficiaryId as string | undefined);
    res.json({ properties: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get("/properties/:id", (req, res) => {
  try {
    const p = PropertyService.getById(req.params.id);
    if (!p) return res.status(404).json({ error: "Propriedade não encontrada" });
    res.json({ property: p });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post("/properties", (req, res) => {
  try {
    const actor = getUser(req);
    const parsed = propertySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Dados inválidos" });
    }
    const p = PropertyService.createOrUpdate(req.body, actor);
    res.json({ property: p });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Proposals / Processos
apiRouter.get("/proposals", (req, res) => {
  try {
    const list = ProposalService.list();
    res.json({ proposals: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get("/proposals/:id", (req, res) => {
  try {
    const p = ProposalService.getById(req.params.id);
    if (!p) return res.status(404).json({ error: "Processo não encontrado" });
    res.json(p);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post("/proposals", (req, res) => {
  try {
    const actor = getUser(req);
    const parsed = proposalSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Dados inválidos" });
    }
    const p = ProposalService.create(req.body, actor);
    res.json({ proposal: p });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.patch("/proposals/:id", (req, res) => {
  try {
    const actor = getUser(req);
    const p = ProposalService.update(req.params.id, req.body, actor);
    res.json({ proposal: p });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Patrimônio
apiRouter.get("/proposals/:id/patrimony", (req, res) => {
  try {
    const data = PatrimonyService.getByProposalId(req.params.id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post("/proposals/:id/patrimony/items", (req, res) => {
  try {
    const actor = getUser(req);
    const data = PatrimonyService.addItem(req.params.id, req.body, actor);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete("/proposals/:id/patrimony/items/:itemId", (req, res) => {
  try {
    const actor = getUser(req);
    const data = PatrimonyService.deleteItem(req.params.id, req.params.itemId, actor);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post("/proposals/:id/patrimony/debts", (req, res) => {
  try {
    const actor = getUser(req);
    const data = PatrimonyService.addDebt(req.params.id, req.body, actor);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete("/proposals/:id/patrimony/debts/:debtId", (req, res) => {
  try {
    const actor = getUser(req);
    const data = PatrimonyService.deleteDebt(req.params.id, req.params.debtId, actor);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post("/proposals/:id/patrimony/complete", (req, res) => {
  try {
    const actor = getUser(req);
    const data = PatrimonyService.complete(req.params.id, actor);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Identificação
apiRouter.get("/proposals/:id/identification", (req, res) => {
  try {
    const data = IdentificationService.getByProposalId(req.params.id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post("/proposals/:id/identification", (req, res) => {
  try {
    const actor = getUser(req);
    const data = IdentificationService.save(req.params.id, req.body, actor);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post("/proposals/:id/identification/complete", (req, res) => {
  try {
    const actor = getUser(req);
    const data = IdentificationService.complete(req.params.id, actor);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Fluxo de Caixa
apiRouter.get("/proposals/:id/cashflow", (req, res) => {
  try {
    const data = CashFlowService.getByProposalId(req.params.id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post("/proposals/:id/cashflow/items", (req, res) => {
  try {
    const actor = getUser(req);
    const data = CashFlowService.addItem(req.params.id, req.body, actor);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete("/proposals/:id/cashflow/items/:itemId", (req, res) => {
  try {
    const actor = getUser(req);
    const data = CashFlowService.deleteItem(req.params.id, req.params.itemId, actor);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post("/proposals/:id/cashflow/complete", (req, res) => {
  try {
    const actor = getUser(req);
    const data = CashFlowService.complete(req.params.id, actor);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Financiamento & SAC
apiRouter.get("/proposals/:id/financing", (req, res) => {
  try {
    const data = FinancingService.getByProposalId(req.params.id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post("/proposals/:id/financing", (req, res) => {
  try {
    const actor = getUser(req);
    const data = FinancingService.save(req.params.id, req.body, actor);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post("/proposals/:id/financing/guarantees", (req, res) => {
  try {
    const actor = getUser(req);
    const data = FinancingService.addGuarantee(req.params.id, req.body, actor);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete("/proposals/:id/financing/guarantees/:guaranteeId", (req, res) => {
  try {
    const actor = getUser(req);
    const data = FinancingService.deleteGuarantee(req.params.id, req.params.guaranteeId, actor);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post("/proposals/:id/financing/complete", (req, res) => {
  try {
    const actor = getUser(req);
    const data = FinancingService.complete(req.params.id, actor);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Documentos
apiRouter.get("/proposals/:id/documents", (req, res) => {
  try {
    const docs = DocumentService.listByProposalId(req.params.id);
    res.json({ documents: docs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post("/proposals/:id/documents", async (req, res) => {
  try {
    const actor = getUser(req);
    const { nomeArquivo, mimeType, buffer, tipo } = req.body;
    if (!nomeArquivo || !buffer || !tipo) {
      return res.status(400).json({ error: "Arquivo, tipo e conteúdo são obrigatórios" });
    }
    const doc = await DocumentService.uploadDocument(
      req.params.id,
      { nomeArquivo, mimeType, buffer, tipo },
      actor
    );
    res.json({ document: doc });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post("/proposals/:id/documents/:docId/confirm", (req, res) => {
  try {
    const actor = getUser(req);
    const doc = DocumentService.confirmExtractedData(
      req.params.id,
      req.params.docId,
      req.body.verifiedData || {},
      actor
    );
    res.json({ document: doc });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete("/proposals/:id/documents/:docId", (req, res) => {
  try {
    const actor = getUser(req);
    const ok = DocumentService.delete(req.params.id, req.params.docId, actor);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Credit lines
apiRouter.get("/credit-lines", (req, res) => {
  try {
    const lines = CreditLineService.list(req.query.onlyActive === "true");
    res.json({ creditLines: lines });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post("/credit-lines", (req, res) => {
  try {
    const actor = getUser(req);
    const line = CreditLineService.createOrUpdate(req.body, actor);
    res.json({ creditLine: line });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Audit Logs
apiRouter.get("/audit-logs", (req, res) => {
  try {
    const logs = AuditService.list({
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      entidade: req.query.entidade as string,
      acao: req.query.acao as string,
      userId: req.query.userId as string,
    });
    res.json({ logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Remote Config
apiRouter.get("/remote-config", (req, res) => {
  try {
    const config = RemoteConfigService.get();
    res.json({ config });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post("/remote-config", (req, res) => {
  try {
    const actor = getUser(req);
    const config = RemoteConfigService.update(req.body, actor);
    res.json({ config });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Maps Geocoding Proxy (Roraima Coordinates)
apiRouter.get("/maps/geocode", (req, res) => {
  const query = String(req.query.address || "").toLowerCase();
  // Roraima coordinates map fallback
  const roraimaCoords: Record<string, { lat: number; lng: number }> = {
    "boa vista": { lat: 2.8235, lng: -60.6758 },
    "cantá": { lat: 2.6111, lng: -60.6019 },
    "mucajaí": { lat: 2.4303, lng: -60.9103 },
    "alto alegre": { lat: 2.9886, lng: -61.2953 },
    "bonfim": { lat: 3.3619, lng: -59.8336 },
    "rorainópolis": { lat: 0.9442, lng: -60.4208 },
    "pacaraima": { lat: 4.4789, lng: -61.1467 },
    "caracaraí": { lat: 1.8153, lng: -61.1278 },
    "amajari": { lat: 3.6558, lng: -61.4228 },
    "normandia": { lat: 3.8828, lng: -59.6278 },
    "iracema": { lat: 2.1814, lng: -61.0422 },
    "caroebe": { lat: 0.8833, lng: -59.6958 },
    "são joão da baliza": { lat: 0.9508, lng: -59.9111 },
    "são luiz": { lat: 0.9856, lng: -60.0983 },
    "uiramutã": { lat: 4.5958, lng: -60.1658 },
  };

  let match = { lat: 2.8235, lng: -60.6758 }; // default Boa Vista
  for (const [k, v] of Object.entries(roraimaCoords)) {
    if (query.includes(k)) {
      match = v;
      break;
    }
  }
  res.json({ results: [{ geometry: { location: match }, formatted_address: `${req.query.address || "Roraima"}, RR, Brasil` }] });
});
