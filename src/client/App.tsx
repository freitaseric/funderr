import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { GovHeader } from "./components/layout/GovHeader";
import { Sidebar, NavTab } from "./components/layout/Sidebar";
import { DashboardView } from "./views/DashboardView";
import { BeneficiariosView } from "./views/BeneficiariosView";
import { PropriedadesView } from "./views/PropriedadesView";
import { ProcessosView } from "./views/ProcessosView";
import { LinhasCreditoView } from "./views/LinhasCreditoView";
import { DocumentosGeraisView } from "./views/DocumentosGeraisView";
import { AuditoriaView } from "./views/AuditoriaView";
import { ConfiguracoesView } from "./views/ConfiguracoesView";
import { fetchApi } from "./api";
import { Beneficiary, CreditLine, Property, ProposalDocument, AuditLog } from "../domain/types";
import { ProposalDetailView } from "../server/services/proposal.service";

const MainAppContent: React.FC = () => {
  const { role } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>("dashboard");
  const [selectedProposalId, setSelectedProposalId] = useState<string | undefined>(undefined);

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
    setCurrentTab(tab);
    if (proposalId) {
      setSelectedProposalId(proposalId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <GovHeader />

      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col lg:flex-row">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            if (tab !== "processos") {
              setSelectedProposalId(undefined);
            }
          }}
          proposalCount={proposals.length}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {loading && proposals.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold">Carregando dados do FUNDERR...</p>
            </div>
          ) : (
            <>
              {currentTab === "dashboard" && (
                <DashboardView
                  proposals={proposals}
                  beneficiaries={beneficiaries}
                  properties={properties}
                  creditLines={creditLines}
                  onNavigate={handleNavigate}
                  onNewProposal={() => {
                    setCurrentTab("processos");
                    setSelectedProposalId(undefined);
                  }}
                />
              )}

              {currentTab === "processos" && (
                <ProcessosView
                  proposals={proposals}
                  beneficiaries={beneficiaries}
                  properties={properties}
                  selectedProposalId={selectedProposalId}
                  onSelectProposal={setSelectedProposalId}
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
            </>
          )}
        </main>
      </div>

      {/* GovBR Footer */}
      <footer className="bg-[#071d41] text-blue-200 text-xs border-t-4 border-[#1351b4] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-white block">FUNDERR — Versão 0.10.2</span>
            <span>Fundo de Desenvolvimento Rural do Estado de Roraima • FEMARH / SEADI</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Privacidade & LGPD</span>
            <span>Termos de Uso</span>
            <span>Suporte Técnico</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

export default App;
