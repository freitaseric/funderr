import React, { useState, useEffect } from "react";
import { AppButton } from "./components/ui/AppButton";
import { useNavigate, useParams, useRouterState } from "@tanstack/react-router";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppHeader } from "./components/layout/AppHeader";
import { Sidebar, NavTab } from "./components/layout/Sidebar";
import { AuthView } from "./views/AuthView";
import { fetchApi } from "./api";
import { Box, CircularProgress, Link, Typography } from "@mui/material";
import type { Beneficiary, CreditLine, Property, ProposalDocument, AuditLog, ProposalDetailView } from "./domain/types";

const DashboardView = React.lazy(() => import("./views/DashboardView").then((module) => ({ default: module.DashboardView })));
const BeneficiariosView = React.lazy(() => import("./views/BeneficiariosView").then((module) => ({ default: module.BeneficiariosView })));
const PropriedadesView = React.lazy(() => import("./views/PropriedadesView").then((module) => ({ default: module.PropriedadesView })));
const ProcessosView = React.lazy(() => import("./views/ProcessosView").then((module) => ({ default: module.ProcessosView })));
const LinhasCreditoView = React.lazy(() => import("./views/LinhasCreditoView").then((module) => ({ default: module.LinhasCreditoView })));
const DocumentosGeraisView = React.lazy(() => import("./views/DocumentosGeraisView").then((module) => ({ default: module.DocumentosGeraisView })));
const AuditoriaView = React.lazy(() => import("./views/AuditoriaView").then((module) => ({ default: module.AuditoriaView })));
const ConfiguracoesView = React.lazy(() => import("./views/ConfiguracoesView").then((module) => ({ default: module.ConfiguracoesView })));

const MainAppContent: React.FC = () => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { proposalId: selectedProposalId } = useParams({ strict: false });
  const routeSegment = pathname.split("/")[1];
  const currentTab: NavTab = routeSegment === "" ? "dashboard" : routeSegment as NavTab;

  // Global state
  const [proposals, setProposals] = useState<ProposalDetailView[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [creditLines, setCreditLines] = useState<CreditLine[]>([]);
  const [documents, setDocuments] = useState<ProposalDocument[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [pRes, bRes, prRes, clRes, aRes] = await Promise.all([
        fetchApi<{ proposals: ProposalDetailView[] }>("/api/proposals", {}, role),
        fetchApi<{ beneficiaries: Beneficiary[] }>("/api/beneficiaries", {}, role),
        fetchApi<{ properties: Property[] }>("/api/properties", {}, role),
        fetchApi<{ creditLines: CreditLine[] }>("/api/credit-lines", {}, role),
        fetchApi<{ logs: AuditLog[] }>("/api/audit-logs", {}, role),
      ]);

      setProposals(pRes.proposals);
      setBeneficiaries(bRes.beneficiaries);
      setProperties(prRes.properties);
      setCreditLines(clRes.creditLines);
      setAuditLogs(aRes.logs);

      // Collect all documents from proposals
      const docsArr: ProposalDocument[] = [];
      for (const p of pRes.proposals) {
        try {
          const docRes = await fetchApi<{ documents: ProposalDocument[] }>(
            `/api/proposals/${p.proposal.id}/documents`,
            {},
            role
          );
          docsArr.push(...docRes.documents);
        } catch (e) {
          // ignore
        }
      }
      setDocuments(docsArr);
    } catch (err) {
      console.error("Error loading application state:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [role]);

  const handleSaveBeneficiary = async (data: any) => {
    await fetchApi(
      "/api/beneficiaries",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      role
    );
    await loadAllData();
  };

  const handleSaveProperty = async (data: any) => {
    await fetchApi(
      "/api/properties",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      role
    );
    await loadAllData();
  };

  const handleSaveCreditLine = async (data: any) => {
    await fetchApi(
      "/api/credit-lines",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      role
    );
    await loadAllData();
  };

  const handleNavigate = (tab: NavTab, proposalId?: string) => {
    if (tab === "processos" && proposalId) {
      void navigate({ to: "/processos/$proposalId", params: { proposalId } });
      return;
    }

    const destinations = {
      dashboard: "/",
      processos: "/processos",
      beneficiarios: "/beneficiarios",
      propriedades: "/propriedades",
      "linhas-credito": "/linhas-credito",
      documentos: "/documentos",
      auditoria: "/auditoria",
      configuracoes: "/configuracoes",
    } as const;
    void navigate({ to: destinations[tab] });
  };

  return (
    <div className="funderr-shell min-h-screen flex flex-col">
      <nav aria-label="Atalhos de acessibilidade">
        <a className="md3-skip-link" href="#main-content">Ir para o conteúdo</a>
        <a className="md3-skip-link" href="#main-navigation">Ir para o menu</a>
      </nav>
      <AppHeader />

      <div className="funderr-content flex-1 flex flex-col lg:flex-row">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => handleNavigate(tab)}
          proposalCount={proposals.length}
        />

        <main id="main-content" tabIndex={-1} className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {loading && proposals.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CircularProgress size={36} />
              <p className="text-sm font-semibold">Carregando dados do FUNDERR...</p>
            </div>
          ) : (
            <React.Suspense fallback={
              <div className="p-12 text-center">
                <CircularProgress size={32} aria-label="Carregando seção" />
              </div>
            }>
              {currentTab === "dashboard" && (
                <DashboardView
                  proposals={proposals}
                  beneficiaries={beneficiaries}
                  properties={properties}
                  creditLines={creditLines}
                  onNavigate={handleNavigate}
                  onNewProposal={() => handleNavigate("processos")}
                />
              )}

              {currentTab === "processos" && (
                <ProcessosView
                  proposals={proposals}
                  beneficiaries={beneficiaries}
                  properties={properties}
                  selectedProposalId={selectedProposalId}
                  onSelectProposal={(proposalId) => handleNavigate("processos", proposalId)}
                  onRefresh={loadAllData}
                />
              )}

              {currentTab === "beneficiarios" && (
                <BeneficiariosView
                  beneficiaries={beneficiaries}
                  onSave={handleSaveBeneficiary}
                />
              )}

              {currentTab === "propriedades" && (
                <PropriedadesView
                  properties={properties}
                  beneficiaries={beneficiaries}
                  onSave={handleSaveProperty}
                />
              )}

              {currentTab === "linhas-credito" && (
                <LinhasCreditoView
                  creditLines={creditLines}
                  onSave={handleSaveCreditLine}
                />
              )}

              {currentTab === "documentos" && (
                <DocumentosGeraisView
                  documents={documents}
                  onOpenProposal={(pId) => handleNavigate("processos", pId)}
                />
              )}

              {currentTab === "auditoria" && <AuditoriaView logs={auditLogs} />}

              {currentTab === "configuracoes" && <ConfiguracoesView />}
            </React.Suspense>
          )}
        </main>
      </div>

      <Box component="footer" id="footer" className="md3-footer">
        <Box className="md3-footer-content">
          <Box>
            <Typography variant="subtitle2">FUNDERR · versão 0.10.2</Typography>
            <Typography variant="caption">Fundo de Desenvolvimento Rural do Estado de Roraima · FEMARH / SEADI</Typography>
          </Box>
          <Box className="md3-footer-links">
            <Link href="#privacidade" color="inherit">Privacidade e LGPD</Link>
            <Link href="#termos" color="inherit">Termos de uso</Link>
            <Link href="#suporte" color="inherit">Suporte</Link>
          </Box>
        </Box>
      </Box>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppGate />
    </AuthProvider>
  );
}

const AppGate: React.FC = () => {
  const { user, loading, isPending, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600">
        <Box className="md3-loading-state">
          <CircularProgress size={40} />
          <Typography variant="body2">Validando acesso com o Firebase…</Typography>
        </Box>
      </div>
    );
  }
  if (!user) return <AuthView />;
  if (isPending) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <section className="max-w-md bg-surface border rounded-2xl shadow-sm p-6 text-center space-y-3">
          <h1 className="text-lg font-bold text-slate-900">Acesso aguardando aprovação</h1>
          <p className="text-sm text-slate-600">
            Sua identidade foi validada pelo Firebase, mas um administrador do FUNDERR ainda precisa atribuir seu perfil de acesso.
          </p>
          <AppButton onClick={() => void logout()} className="px-4 py-2 bg-[#386a20] text-white rounded-lg text-sm font-bold">
            Sair
          </AppButton>
        </section>
      </main>
    );
  }
  return <MainAppContent />;
};

export default App;
