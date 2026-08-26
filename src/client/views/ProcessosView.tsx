import React, { useState, useEffect } from "react";
import { ProposalDetailView } from "../../server/services/proposal.service";
import {
  Beneficiary,
  Property,
  StepStatus,
  PatrimonyItem,
  PatrimonyDebt,
  PatrimonyCategory,
  CashFlowItem,
  CashFlowItemType,
  CreditLine,
  ProposalDocument,
  DocumentType,
} from "../../domain/types";
import { formatCurrency, formatCPF, formatPhone, roundCurrency } from "../../domain/calculations";
import { fetchApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Modal } from "../components/ui/Modal";
import {
  FileSpreadsheet,
  Plus,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Trash2,
  Upload,
  CheckCheck,
  ShieldAlert,
  Info,
  HelpCircle,
  ExternalLink,
  DollarSign,
  TrendingUp,
} from "lucide-react";

interface ProcessosViewProps {
  proposals: ProposalDetailView[];
  beneficiaries: Beneficiary[];
  properties: Property[];
  selectedProposalId?: string;
  onSelectProposal: (id: string | undefined) => void;
  onRefresh: () => Promise<void>;
}

type StepKey =
  | "dadosGerais"
  | "beneficiario"
  | "propriedade"
  | "patrimonio"
  | "identificacao"
  | "fluxoCaixa"
  | "financiamento"
  | "documentos";

export const ProcessosView: React.FC<ProcessosViewProps> = ({
  proposals,
  beneficiaries,
  properties,
  selectedProposalId,
  onSelectProposal,
  onRefresh,
}) => {
  const { role, canEdit } = useAuth();
  const [activeStep, setActiveStep] = useState<StepKey>("dadosGerais");

  // New proposal modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newBeneficiaryId, setNewBeneficiaryId] = useState("");
  const [newPropertyId, setNewPropertyId] = useState("");
  const [newAtividade, setNewAtividade] = useState("Agricultura Familiar Diversificada");
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [creationError, setCreationError] = useState("");
  const [creating, setCreating] = useState(false);

  // Selected proposal data state
  const selectedProposal = proposals.find((p) => p.proposal.id === selectedProposalId);

  // Step specific states
  const [patrimonyData, setPatrimonyData] = useState<any>(null);
  const [identificationData, setIdentificationData] = useState<any>(null);
  const [cashFlowData, setCashFlowData] = useState<any>(null);
  const [financingData, setFinancingData] = useState<any>(null);
  const [documentsData, setDocumentsData] = useState<ProposalDocument[]>([]);
  const [loadingStep, setLoadingStep] = useState(false);
  const [stepActionError, setStepActionError] = useState("");

  // Patrimônio item form
  const [newPatItem, setNewPatItem] = useState({
    categoria: "SEMOVENTES" as PatrimonyCategory,
    especificacao: "",
    unidade: "Cab",
    quantidade: 10,
    valorUnitario: 2500,
  });

  // Patrimônio debt form
  const [newPatDebt, setNewPatDebt] = useState({
    credor: "",
    finalidade: "",
    vencimento: "2027",
    saldoDevedor: 0,
  });

  // Cash flow item form
  const [newCashItem, setNewCashItem] = useState({
    tipo: "RECEITA" as CashFlowItemType,
    descricao: "",
    unidade: "Kg",
    quantidade: 100,
    valorUnitario: 20,
    ano1: 15000,
    ano2: 20000,
    ano3: 25000,
    ano4: 30000,
    ano5: 30000,
    ano6: 30000,
    ano7: 30000,
  });

  // Financing form
  const [financingForm, setFinancingForm] = useState({
    linhaCreditoId: "",
    valorProposta: 50000,
    percentualFinanciavel: 100,
    percentualAter: 2.5,
    taxaJurosAnual: 2.0,
    prazoTotalAnos: 5,
    carenciaAnos: 1,
    jurosCarencia: "PAGAR" as "PAGAR" | "CAPITALIZAR",
  });

  // Guarantee form
  const [newGuarantee, setNewGuarantee] = useState({
    tipo: "AVAL_PESSOAL" as "AVAL_PESSOAL" | "BEM" | "OUTRA",
    descricao: "Avalista Solidário com Renda Comprovada",
    garantidorNome: "",
    garantidorCpf: "",
    garantidorTelefone: "",
    valorEstimado: 50000,
  });

  // Document upload form
  const [uploadDocType, setUploadDocType] = useState<DocumentType>("CAF_DAP");

  // Load step details when proposal changes
  useEffect(() => {
    if (selectedProposalId) {
      loadAllStepData(selectedProposalId);
    }
  }, [selectedProposalId, activeStep]);

  const loadAllStepData = async (proposalId: string) => {
    try {
      setLoadingStep(true);
      setStepActionError("");

      if (activeStep === "patrimonio") {
        const data = await fetchApi(`/api/proposals/${proposalId}/patrimony`, {}, role);
        setPatrimonyData(data);
      } else if (activeStep === "identificacao") {
        const data = await fetchApi(`/api/proposals/${proposalId}/identification`, {}, role);
        setIdentificationData(data);
      } else if (activeStep === "fluxoCaixa") {
        const data = await fetchApi(`/api/proposals/${proposalId}/cashflow`, {}, role);
        setCashFlowData(data);
      } else if (activeStep === "financiamento") {
        const data = await fetchApi(`/api/proposals/${proposalId}/financing`, {}, role);
        setFinancingData(data);
        if (data.financing) {
          setFinancingForm({
            linhaCreditoId: data.financing.linhaCreditoId,
            valorProposta: data.financing.valorProposta,
            percentualFinanciavel: data.financing.percentualFinanciavel,
            percentualAter: data.financing.percentualAter,
            taxaJurosAnual: data.financing.taxaJurosAnual,
            prazoTotalAnos: data.financing.prazoTotalAnos,
            carenciaAnos: data.financing.carenciaAnos,
            jurosCarencia: data.financing.jurosCarencia,
          });
        }
      } else if (activeStep === "documentos") {
        const data = await fetchApi<{ documents: ProposalDocument[] }>(
          `/api/proposals/${proposalId}/documents`,
          {},
          role
        );
        setDocumentsData(data.documents);
      }
    } catch (err: any) {
      setStepActionError(err.message);
    } finally {
      setLoadingStep(false);
    }
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreationError("");
    try {
      setCreating(true);
      const res = await fetchApi<{ proposal: any }>(
        "/api/proposals",
        {
          method: "POST",
          body: JSON.stringify({
            beneficiaryId: newBeneficiaryId,
            propertyId: newPropertyId,
            atividade: newAtividade,
            data: newDate,
          }),
        },
        role
      );
      await onRefresh();
      setIsNewModalOpen(false);
      onSelectProposal(res.proposal.id);
    } catch (err: any) {
      setCreationError(err.message || "Erro ao criar processo");
    } finally {
      setCreating(false);
    }
  };

  // Patrimônio Handlers
  const handleAddPatrimonyItem = async () => {
    if (!selectedProposalId) return;
    try {
      const data = await fetchApi(
        `/api/proposals/${selectedProposalId}/patrimony/items`,
        {
          method: "POST",
          body: JSON.stringify(newPatItem),
        },
        role
      );
      setPatrimonyData(data);
      await onRefresh();
    } catch (err: any) {
      setStepActionError(err.message);
    }
  };

  const handleDeletePatrimonyItem = async (itemId: string) => {
    if (!selectedProposalId) return;
    try {
      const data = await fetchApi(
        `/api/proposals/${selectedProposalId}/patrimony/items/${itemId}`,
        { method: "DELETE" },
        role
      );
      setPatrimonyData(data);
      await onRefresh();
    } catch (err: any) {
      setStepActionError(err.message);
    }
  };

  const handleAddPatrimonyDebt = async () => {
    if (!selectedProposalId || !newPatDebt.credor) return;
    try {
      const data = await fetchApi(
        `/api/proposals/${selectedProposalId}/patrimony/debts`,
        {
          method: "POST",
          body: JSON.stringify(newPatDebt),
        },
        role
      );
      setPatrimonyData(data);
      await onRefresh();
    } catch (err: any) {
      setStepActionError(err.message);
    }
  };

  const handleDeletePatrimonyDebt = async (debtId: string) => {
    if (!selectedProposalId) return;
    try {
      const data = await fetchApi(
        `/api/proposals/${selectedProposalId}/patrimony/debts/${debtId}`,
        { method: "DELETE" },
        role
      );
      setPatrimonyData(data);
      await onRefresh();
    } catch (err: any) {
      setStepActionError(err.message);
    }
  };

  const handleCompletePatrimony = async () => {
    if (!selectedProposalId) return;
    try {
      const data = await fetchApi(
        `/api/proposals/${selectedProposalId}/patrimony/complete`,
        { method: "POST" },
        role
      );
      setPatrimonyData(data);
      await onRefresh();
      setActiveStep("identificacao");
    } catch (err: any) {
      setStepActionError(err.message);
    }
  };

  // Identificação Handlers
  const handleSaveIdentification = async () => {
    if (!selectedProposalId || !identificationData?.identification) return;
    try {
      const data = await fetchApi(
        `/api/proposals/${selectedProposalId}/identification`,
        {
          method: "POST",
          body: JSON.stringify({
            finalidade: identificationData.identification.finalidade,
            mercado: identificationData.identification.mercado,
            faturamentoUltimoAno: identificationData.identification.faturamentoUltimoAno,
            analiseLocalizacao: identificationData.identification.analiseLocalizacao,
            consideracoes: identificationData.identification.consideracoes,
            jobs: identificationData.jobs,
            usesSources: identificationData.usesSources,
          }),
        },
        role
      );
      setIdentificationData(data);
      await onRefresh();
    } catch (err: any) {
      setStepActionError(err.message);
    }
  };

  const handleCompleteIdentification = async () => {
    if (!selectedProposalId) return;
    try {
      await handleSaveIdentification();
      const data = await fetchApi(
        `/api/proposals/${selectedProposalId}/identification/complete`,
        { method: "POST" },
        role
      );
      setIdentificationData(data);
      await onRefresh();
      setActiveStep("fluxoCaixa");
    } catch (err: any) {
      setStepActionError(err.message);
    }
  };

  // Cash Flow Handlers
  const handleAddCashFlowItem = async () => {
    if (!selectedProposalId || !newCashItem.descricao) return;
    try {
      const data = await fetchApi(
        `/api/proposals/${selectedProposalId}/cashflow/items`,
        {
          method: "POST",
          body: JSON.stringify(newCashItem),
        },
        role
      );
      setCashFlowData(data);
      await onRefresh();
    } catch (err: any) {
      setStepActionError(err.message);
    }
  };

  const handleDeleteCashFlowItem = async (itemId: string) => {
    if (!selectedProposalId) return;
    try {
      const data = await fetchApi(
        `/api/proposals/${selectedProposalId}/cashflow/items/${itemId}`,
        { method: "DELETE" },
        role
      );
      setCashFlowData(data);
      await onRefresh();
    } catch (err: any) {
      setStepActionError(err.message);
    }
  };

  const handleCompleteCashFlow = async () => {
    if (!selectedProposalId) return;
    try {
      const data = await fetchApi(
        `/api/proposals/${selectedProposalId}/cashflow/complete`,
        { method: "POST" },
        role
      );
      setCashFlowData(data);
      await onRefresh();
      setActiveStep("financiamento");
    } catch (err: any) {
      setStepActionError(err.message);
    }
  };

  // Financing Handlers
  const handleSaveFinancing = async () => {
    if (!selectedProposalId || !financingForm.linhaCreditoId) return;
    try {
      const data = await fetchApi(
        `/api/proposals/${selectedProposalId}/financing`,
        {
          method: "POST",
          body: JSON.stringify(financingForm),
        },
        role
      );
      setFinancingData(data);
      await onRefresh();
    } catch (err: any) {
      setStepActionError(err.message);
    }
  };

  const handleAddGuarantee = async () => {
    if (!selectedProposalId || !newGuarantee.descricao) return;
    try {
      const data = await fetchApi(
        `/api/proposals/${selectedProposalId}/financing/guarantees`,
        {
          method: "POST",
          body: JSON.stringify(newGuarantee),
        },
        role
      );
      setFinancingData(data);
      await onRefresh();
    } catch (err: any) {
      setStepActionError(err.message);
    }
  };

  const handleDeleteGuarantee = async (guaranteeId: string) => {
    if (!selectedProposalId) return;
    try {
      const data = await fetchApi(
        `/api/proposals/${selectedProposalId}/financing/guarantees/${guaranteeId}`,
        { method: "DELETE" },
        role
      );
      setFinancingData(data);
      await onRefresh();
    } catch (err: any) {
      setStepActionError(err.message);
    }
  };

  const handleCompleteFinancing = async () => {
    if (!selectedProposalId) return;
    try {
      await handleSaveFinancing();
      const data = await fetchApi(
        `/api/proposals/${selectedProposalId}/financing/complete`,
        { method: "POST" },
        role
      );
      setFinancingData(data);
      await onRefresh();
      setActiveStep("documentos");
    } catch (err: any) {
      setStepActionError(err.message);
    }
  };

  // Document Upload & AI Handlers
  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProposalId) return;

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        await fetchApi(
          `/api/proposals/${selectedProposalId}/documents`,
          {
            method: "POST",
            body: JSON.stringify({
              nomeArquivo: file.name,
              mimeType: file.type || "application/pdf",
              buffer: base64,
              tipo: uploadDocType,
            }),
          },
          role
        );
        loadAllStepData(selectedProposalId);
        onRefresh();
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setStepActionError(err.message);
    }
  };

  const handleConfirmDocumentAI = async (docId: string, verifiedData: any) => {
    if (!selectedProposalId) return;
    try {
      await fetchApi(
        `/api/proposals/${selectedProposalId}/documents/${docId}/confirm`,
        {
          method: "POST",
          body: JSON.stringify({ verifiedData }),
        },
        role
      );
      loadAllStepData(selectedProposalId);
      onRefresh();
    } catch (err: any) {
      setStepActionError(err.message);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!selectedProposalId) return;
    try {
      await fetchApi(
        `/api/proposals/${selectedProposalId}/documents/${docId}`,
        { method: "DELETE" },
        role
      );
      loadAllStepData(selectedProposalId);
      onRefresh();
    } catch (err: any) {
      setStepActionError(err.message);
    }
  };

  // Steps definition for Stepper Header
  const steps: { key: StepKey; num: number; label: string; status: StepStatus }[] = selectedProposal
    ? [
        { key: "dadosGerais", num: 1, label: "Dados Gerais", status: selectedProposal.etapas.dadosGerais.status },
        { key: "beneficiario", num: 2, label: "Beneficiário", status: selectedProposal.etapas.beneficiario.status },
        { key: "propriedade", num: 3, label: "Propriedade", status: selectedProposal.etapas.propriedade.status },
        { key: "patrimonio", num: 4, label: "Patrimônio", status: selectedProposal.etapas.patrimonio.status },
        { key: "identificacao", num: 5, label: "Identificação", status: selectedProposal.etapas.identificacao.status },
        { key: "fluxoCaixa", num: 6, label: "Fluxo de Caixa", status: selectedProposal.etapas.fluxoCaixa.status },
        { key: "financiamento", num: 7, label: "Financiamento", status: selectedProposal.etapas.financiamento.status },
        { key: "documentos", num: 8, label: "Documentos & IA", status: selectedProposal.etapas.documentos.status },
      ]
    : [];

  const availablePropertiesForNew = properties.filter((p) => p.beneficiaryId === newBeneficiaryId);

  // If no proposal selected, show list
  if (!selectedProposal) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Processos de Crédito Rural</h2>
            <p className="text-xs text-slate-500">
              Esteira técnica com validação rigorosa de patrimônio, fluxo de caixa e SAC
            </p>
          </div>
          {canEdit && (
            <button
              onClick={() => {
                setNewBeneficiaryId(beneficiaries[0]?.id || "");
                setIsNewModalOpen(true);
              }}
              className="bg-[#1351b4] hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-lg text-sm shadow-xs transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo Processo de Crédito
            </button>
          )}
        </div>

        {/* Proposals List Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-100 font-semibold">
                <tr>
                  <th className="px-6 py-3">Número</th>
                  <th className="px-6 py-3">Produtor Titular</th>
                  <th className="px-6 py-3">Propriedade / Município</th>
                  <th className="px-6 py-3">Atividade Produtiva</th>
                  <th className="px-6 py-3">Progresso da Esteira</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {proposals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400 text-sm">
                      Nenhum processo em tramitação no momento.
                    </td>
                  </tr>
                ) : (
                  proposals.map((p) => (
                    <tr key={p.proposal.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-3.5 font-bold font-mono text-blue-700">
                        {p.proposal.numero}
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-slate-900">
                        {p.beneficiaryNome}
                        <span className="block text-[11px] font-mono text-slate-400">
                          {formatCPF(p.beneficiaryCpf)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-600">
                        {p.propertyDenominacao}
                        <span className="block font-semibold text-blue-700 text-[11px]">
                          {p.propertyMunicipio}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs">{p.proposal.atividade}</td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                p.percentualGlobal === 100
                                  ? "bg-emerald-500"
                                  : p.percentualGlobal > 50
                                  ? "bg-blue-600"
                                  : "bg-amber-500"
                              }`}
                              style={{ width: `${p.percentualGlobal}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold font-mono">{p.percentualGlobal}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <StatusBadge status={p.proposal.status} size="sm" />
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => onSelectProposal(p.proposal.id)}
                          className="text-xs font-bold bg-[#1351b4] text-white hover:bg-blue-700 px-3 py-1.5 rounded-md shadow-xs transition-colors"
                        >
                          Abrir Processo
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Novo Processo */}
        <Modal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          title="Iniciar Novo Processo de Crédito FUNDERR"
          subtitle="Selecione o produtor rural e a propriedade vinculada"
        >
          <form onSubmit={handleCreateProposal} className="space-y-4 text-xs">
            {creationError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {creationError}
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">Beneficiário Titular *</label>
              <select
                required
                value={newBeneficiaryId}
                onChange={(e) => {
                  setNewBeneficiaryId(e.target.value);
                  const firstProp = properties.find((p) => p.beneficiaryId === e.target.value);
                  setNewPropertyId(firstProp?.id || "");
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-md outline-hidden focus:border-blue-600 bg-white"
              >
                <option value="">Selecione um beneficiário</option>
                {beneficiaries.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nome} ({formatCPF(b.cpf)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Propriedade Vinculada *</label>
              <select
                required
                value={newPropertyId}
                onChange={(e) => setNewPropertyId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md outline-hidden focus:border-blue-600 bg-white"
              >
                <option value="">Selecione a propriedade</option>
                {availablePropertiesForNew.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.denominacao} - {p.municipio} ({p.areaTotalHa} ha)
                  </option>
                ))}
              </select>
              {newBeneficiaryId && availablePropertiesForNew.length === 0 && (
                <p className="text-amber-600 font-semibold mt-1">
                  ⚠️ Este beneficiário ainda não tem propriedades cadastradas. Cadastre uma na aba Propriedades primeiro.
                </p>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Atividade Produtiva Principal *</label>
              <input
                type="text"
                required
                value={newAtividade}
                onChange={(e) => setNewAtividade(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md outline-hidden focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Data de Abertura</label>
              <input
                type="date"
                required
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md outline-hidden focus:border-blue-600"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={creating || !newPropertyId}
                className="px-5 py-2 bg-[#1351b4] hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs disabled:opacity-50"
              >
                {creating ? "Criando Processo..." : "Criar Processo"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // Active Esteira View
  return (
    <div className="space-y-6">
      {/* Header with Back button and General Proposal Info */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onSelectProposal(undefined)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            title="Voltar para a lista"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                PROCESSO {selectedProposal.proposal.numero}
              </span>
              <StatusBadge status={selectedProposal.proposal.status} size="sm" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              {selectedProposal.beneficiaryNome} — {selectedProposal.propertyDenominacao} ({selectedProposal.propertyMunicipio})
            </h2>
            <p className="text-xs text-slate-500">
              Atividade: {selectedProposal.proposal.atividade} | Abertura: {selectedProposal.proposal.data}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 border-t md:border-t-0 pt-3 md:pt-0">
          <div className="text-right">
            <span className="text-xs font-semibold text-slate-500 block">Completude Global</span>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-24 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    selectedProposal.percentualGlobal === 100
                      ? "bg-emerald-500"
                      : selectedProposal.percentualGlobal > 50
                      ? "bg-blue-600"
                      : "bg-amber-500"
                  }`}
                  style={{ width: `${selectedProposal.percentualGlobal}%` }}
                />
              </div>
              <span className="text-sm font-extrabold font-mono text-slate-900">
                {selectedProposal.percentualGlobal}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stepper Navigation (8 stages) */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <div className="flex items-center justify-between min-w-[850px] gap-2">
          {steps.map((s) => {
            const isActive = activeStep === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setActiveStep(s.key)}
                className={`flex-1 flex flex-col items-center p-2.5 rounded-xl border text-center transition-all ${
                  isActive
                    ? "bg-blue-50/80 border-[#1351b4] shadow-xs"
                    : "bg-slate-50/50 border-slate-200 hover:bg-slate-100/70"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                      isActive
                        ? "bg-[#1351b4] text-white"
                        : s.status === "CONCLUIDO"
                        ? "bg-emerald-600 text-white"
                        : s.status === "EM_REVISAO"
                        ? "bg-amber-500 text-white animate-pulse"
                        : "bg-slate-300 text-slate-700"
                    }`}
                  >
                    {s.num}
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      isActive ? "text-[#1351b4]" : "text-slate-700"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                <StatusBadge status={s.status} size="sm" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Error Banner */}
      {stepActionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{stepActionError}</span>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs min-h-[400px]">
        {/* TAB 1: Dados Gerais */}
        {activeStep === "dadosGerais" && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">
              Etapa 1: Dados Gerais do Processo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border">
                <span className="text-slate-400 font-semibold block">Número Oficial</span>
                <span className="text-sm font-bold text-slate-900 font-mono">
                  {selectedProposal.proposal.numero}
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border">
                <span className="text-slate-400 font-semibold block">Data de Formalização</span>
                <span className="text-sm font-bold text-slate-900">
                  {selectedProposal.proposal.data}
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border">
                <span className="text-slate-400 font-semibold block">Atividade Desenvolvida</span>
                <span className="text-sm font-bold text-slate-900">
                  {selectedProposal.proposal.atividade}
                </span>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setActiveStep("beneficiario")}
                className="bg-[#1351b4] text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2"
              >
                Avançar para Beneficiário <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Beneficiário */}
        {activeStep === "beneficiario" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-base font-bold text-slate-900">
                Etapa 2: Dados do Beneficiário Titular
              </h3>
              <StatusBadge status={selectedProposal.etapas.beneficiario.status} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border space-y-2">
                <h4 className="font-bold text-slate-700 uppercase">Titular</h4>
                <p>
                  <strong>Nome:</strong> {selectedProposal.beneficiaryNome}
                </p>
                <p>
                  <strong>CPF:</strong> {formatCPF(selectedProposal.beneficiaryCpf)}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border space-y-2">
                <h4 className="font-bold text-slate-700 uppercase">Validação de Completude</h4>
                <p>
                  <strong>Progresso Cadastral:</strong>{" "}
                  {selectedProposal.etapas.beneficiario.percent}%
                </p>
                {selectedProposal.etapas.beneficiario.percent < 100 && (
                  <p className="text-amber-700 font-semibold">
                    Complete os dados na aba "Beneficiários (PF)" se houver pendências de cônjuge
                    ou referências.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setActiveStep("dadosGerais")}
                className="border text-slate-700 text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
              <button
                onClick={() => setActiveStep("propriedade")}
                className="bg-[#1351b4] text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2"
              >
                Avançar para Propriedade <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: Propriedade */}
        {activeStep === "propriedade" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-base font-bold text-slate-900">
                Etapa 3: Propriedade e Localização Roraima
              </h3>
              <StatusBadge status={selectedProposal.etapas.propriedade.status} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border space-y-2">
                <h4 className="font-bold text-slate-700 uppercase">Imóvel Rural</h4>
                <p>
                  <strong>Denominação:</strong> {selectedProposal.propertyDenominacao}
                </p>
                <p>
                  <strong>Município de Roraima:</strong> {selectedProposal.propertyMunicipio}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border space-y-2">
                <h4 className="font-bold text-slate-700 uppercase">Completude Fundiária</h4>
                <p>
                  <strong>Status:</strong> {selectedProposal.etapas.propriedade.percent}%
                </p>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setActiveStep("beneficiario")}
                className="border text-slate-700 text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
              <button
                onClick={() => setActiveStep("patrimonio")}
                className="bg-[#1351b4] text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2"
              >
                Avançar para Patrimônio <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: Patrimônio */}
        {activeStep === "patrimonio" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Etapa 4: Levantamento Patrimonial e Dívidas
                </h3>
                <p className="text-xs text-slate-500">
                  Totalização rural, bens urbanos segregados e apuração de patrimônio líquido
                </p>
              </div>
              <StatusBadge status={patrimonyData?.status || "PENDENTE"} />
            </div>

            {/* Totals Summary Cards */}
            {patrimonyData?.totals && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <span className="text-[11px] font-semibold text-blue-700 block">Patrimônio Bruto Rural</span>
                  <span className="text-sm font-extrabold text-blue-950">
                    {formatCurrency(patrimonyData.totals.patrimonioBruto)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-600 block">Bens Urbanos</span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {formatCurrency(patrimonyData.totals.outrosBensUrbanos)}
                  </span>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <span className="text-[11px] font-semibold text-rose-700 block">Total de Dívidas</span>
                  <span className="text-sm font-extrabold text-rose-950">
                    {formatCurrency(patrimonyData.totals.totalDividas)}
                  </span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[11px] font-semibold text-emerald-700 block">Patrimônio Líquido</span>
                  <span className="text-sm font-extrabold text-emerald-950">
                    {formatCurrency(patrimonyData.totals.patrimonioLiquido)}
                  </span>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <span className="text-[11px] font-semibold text-purple-700 block">Total Geral Informado</span>
                  <span className="text-sm font-extrabold text-purple-950">
                    {formatCurrency(patrimonyData.totals.totalInformado)}
                  </span>
                </div>
              </div>
            )}

            {/* Items Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Bens e Ativos Rurais / Urbanos
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-semibold text-slate-600 border-b">
                    <tr>
                      <th className="px-4 py-2.5">Categoria</th>
                      <th className="px-4 py-2.5">Especificação</th>
                      <th className="px-4 py-2.5">Unidade</th>
                      <th className="px-4 py-2.5">Quantidade</th>
                      <th className="px-4 py-2.5">Valor Unitário</th>
                      <th className="px-4 py-2.5">Valor Total</th>
                      <th className="px-4 py-2.5 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {patrimonyData?.items?.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                          Nenhum item patrimonial lançado ainda.
                        </td>
                      </tr>
                    ) : (
                      patrimonyData?.items?.map((item: PatrimonyItem) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2 font-semibold text-blue-900">
                            {item.categoria.replace(/_/g, " ")}
                          </td>
                          <td className="px-4 py-2">{item.especificacao}</td>
                          <td className="px-4 py-2">{item.unidade}</td>
                          <td className="px-4 py-2 font-mono">{item.quantidade}</td>
                          <td className="px-4 py-2 font-mono">{formatCurrency(item.valorUnitario)}</td>
                          <td className="px-4 py-2 font-bold font-mono text-slate-900">
                            {formatCurrency(item.valorTotal)}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {canEdit && (
                              <button
                                onClick={() => handleDeletePatrimonyItem(item.id)}
                                className="text-rose-600 hover:text-rose-800 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add Item Form */}
              {canEdit && (
                <div className="p-4 bg-slate-50 rounded-xl border space-y-3">
                  <span className="text-xs font-bold text-slate-700 block">Adicionar Bem / Ativo</span>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                    <select
                      value={newPatItem.categoria}
                      onChange={(e) =>
                        setNewPatItem({ ...newPatItem, categoria: e.target.value as any })
                      }
                      className="px-2 py-1.5 border rounded bg-white"
                    >
                      <option value="TERRA_COBERTURAS">Terra e Benfeitorias</option>
                      <option value="MAQUINAS_EQUIPAMENTOS">Máquinas e Equipamentos</option>
                      <option value="SEMOVENTES">Semoventes / Rebanho</option>
                      <option value="VEICULOS">Veículos</option>
                      <option value="PRODUTOS_ESTOQUE">Produtos em Estoque</option>
                      <option value="CULTURAS_PERMANENTES">Culturas Permanentes</option>
                      <option value="OUTROS_BENS_URBANOS">Bens Urbanos</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Especificação"
                      value={newPatItem.especificacao}
                      onChange={(e) =>
                        setNewPatItem({ ...newPatItem, especificacao: e.target.value })
                      }
                      className="px-2 py-1.5 border rounded bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Unidade (ex: Ha, Cab)"
                      value={newPatItem.unidade}
                      onChange={(e) => setNewPatItem({ ...newPatItem, unidade: e.target.value })}
                      className="px-2 py-1.5 border rounded bg-white"
                    />
                    <input
                      type="number"
                      placeholder="Qtd"
                      value={newPatItem.quantidade}
                      onChange={(e) =>
                        setNewPatItem({ ...newPatItem, quantidade: Number(e.target.value) })
                      }
                      className="px-2 py-1.5 border rounded bg-white font-mono"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Valor Unitário (R$)"
                        value={newPatItem.valorUnitario}
                        onChange={(e) =>
                          setNewPatItem({ ...newPatItem, valorUnitario: Number(e.target.value) })
                        }
                        className="px-2 py-1.5 border rounded bg-white font-mono w-full"
                      />
                      <button
                        onClick={handleAddPatrimonyItem}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded text-xs shrink-0"
                      >
                        + Adicionar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Debts Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Dívidas e Obrigações Financeiras Existentes
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-3">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-semibold text-slate-600 border-b">
                    <tr>
                      <th className="px-4 py-2.5">Credor / Banco</th>
                      <th className="px-4 py-2.5">Finalidade</th>
                      <th className="px-4 py-2.5">Vencimento</th>
                      <th className="px-4 py-2.5">Saldo Devedor</th>
                      <th className="px-4 py-2.5 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {patrimonyData?.debts?.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 text-center text-slate-400">
                          Nenhuma dívida declarada (Declaração Negativa de Débitos).
                        </td>
                      </tr>
                    ) : (
                      patrimonyData?.debts?.map((debt: PatrimonyDebt) => (
                        <tr key={debt.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2 font-semibold">{debt.credor}</td>
                          <td className="px-4 py-2">{debt.finalidade}</td>
                          <td className="px-4 py-2">{debt.vencimento}</td>
                          <td className="px-4 py-2 font-mono font-bold text-rose-700">
                            {formatCurrency(debt.saldoDevedor)}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {canEdit && (
                              <button
                                onClick={() => handleDeletePatrimonyDebt(debt.id)}
                                className="text-rose-600 hover:text-rose-800 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {canEdit && (
                <div className="p-3 bg-slate-50 rounded-xl border flex flex-wrap gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Credor (ex: Banco da Amazônia)"
                    value={newPatDebt.credor}
                    onChange={(e) => setNewPatDebt({ ...newPatDebt, credor: e.target.value })}
                    className="px-2 py-1 border rounded bg-white flex-1"
                  />
                  <input
                    type="text"
                    placeholder="Finalidade"
                    value={newPatDebt.finalidade}
                    onChange={(e) => setNewPatDebt({ ...newPatDebt, finalidade: e.target.value })}
                    className="px-2 py-1 border rounded bg-white flex-1"
                  />
                  <input
                    type="text"
                    placeholder="Vencimento (ex: 2028)"
                    value={newPatDebt.vencimento}
                    onChange={(e) => setNewPatDebt({ ...newPatDebt, vencimento: e.target.value })}
                    className="px-2 py-1 border rounded bg-white w-24"
                  />
                  <input
                    type="number"
                    placeholder="Saldo Devedor"
                    value={newPatDebt.saldoDevedor || ""}
                    onChange={(e) =>
                      setNewPatDebt({ ...newPatDebt, saldoDevedor: Number(e.target.value) })
                    }
                    className="px-2 py-1 border rounded bg-white w-32 font-mono"
                  />
                  <button
                    onClick={handleAddPatrimonyDebt}
                    className="bg-slate-700 hover:bg-slate-800 text-white font-bold px-3 py-1 rounded"
                  >
                    + Registrar Dívida
                  </button>
                </div>
              )}
            </div>

            {/* Complete step action */}
            <div className="flex items-center justify-between pt-4 border-t">
              <button
                onClick={() => setActiveStep("propriedade")}
                className="border text-slate-700 text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
              {canEdit && (
                <button
                  onClick={handleCompletePatrimony}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-xs"
                >
                  <CheckCheck className="w-4 h-4" /> Concluir Levantamento Patrimonial
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: Identificação da Proposta & Usos/Fontes */}
        {activeStep === "identificacao" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Etapa 5: Identificação da Proposta, Empregos e Usos/Fontes
                </h3>
                <p className="text-xs text-slate-500">
                  Justificativa técnica, mercado, matriz de empregos e equilíbrio financeiro
                </p>
              </div>
              <StatusBadge status={identificationData?.identification?.status || "PENDENTE"} />
            </div>

            {identificationData && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Finalidade / Justificativa do Financiamento *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Descreva a finalidade da aplicação dos recursos solicitados..."
                    value={identificationData.identification.finalidade || ""}
                    onChange={(e) =>
                      setIdentificationData({
                        ...identificationData,
                        identification: {
                          ...identificationData.identification,
                          finalidade: e.target.value,
                        },
                      })
                    }
                    className="w-full p-2.5 border rounded-lg outline-hidden focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mercado e Comercialização *
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Descreva os canais de escoamento e comercialização da produção..."
                    value={identificationData.identification.mercado || ""}
                    onChange={(e) =>
                      setIdentificationData({
                        ...identificationData,
                        identification: {
                          ...identificationData.identification,
                          mercado: e.target.value,
                        },
                      })
                    }
                    className="w-full p-2.5 border rounded-lg outline-hidden focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Faturamento Bruto do Último Ano (R$)
                    </label>
                    <input
                      type="number"
                      value={identificationData.identification.faturamentoUltimoAno || ""}
                      onChange={(e) =>
                        setIdentificationData({
                          ...identificationData,
                          identification: {
                            ...identificationData.identification,
                            faturamentoUltimoAno: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full p-2 border rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Análise de Localização e Acesso
                    </label>
                    <input
                      type="text"
                      value={identificationData.identification.analiseLocalizacao || ""}
                      onChange={(e) =>
                        setIdentificationData({
                          ...identificationData,
                          identification: {
                            ...identificationData.identification,
                            analiseLocalizacao: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                </div>

                {/* Usos e Fontes balance summary */}
                <div className="p-4 bg-slate-50 rounded-xl border flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-700 block">Equilíbrio Usos e Fontes</span>
                    <span className="text-slate-500">
                      Total Usos: {formatCurrency(identificationData.totalUsos)} | Total Fontes:{" "}
                      {formatCurrency(identificationData.totalFontes)}
                    </span>
                  </div>
                  <span
                    className={`font-bold px-3 py-1 rounded-full text-xs ${
                      identificationData.totalUsos === identificationData.totalFontes &&
                      identificationData.totalUsos > 0
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {identificationData.totalUsos === identificationData.totalFontes &&
                    identificationData.totalUsos > 0
                      ? "Balanceado"
                      : "Em Ajuste"}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              <button
                onClick={() => setActiveStep("patrimonio")}
                className="border text-slate-700 text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
              <div className="flex gap-2">
                {canEdit && (
                  <button
                    onClick={handleSaveIdentification}
                    className="border border-blue-300 text-blue-700 hover:bg-blue-50 text-xs font-bold px-4 py-2 rounded-lg"
                  >
                    Salvar Rascunho
                  </button>
                )}
                {canEdit && (
                  <button
                    onClick={handleCompleteIdentification}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2 rounded-lg flex items-center gap-2"
                  >
                    <CheckCheck className="w-4 h-4" /> Concluir Identificação
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: Fluxo de Caixa */}
        {activeStep === "fluxoCaixa" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Etapa 6: Fluxo de Caixa Projetado (7 Anos)
                </h3>
                <p className="text-xs text-slate-500">
                  Projeção plurianual de receitas operacionais, custos fixos e variáveis
                </p>
              </div>
              <StatusBadge status={cashFlowData?.status || "PENDENTE"} />
            </div>

            {/* Consolidation Matrix */}
            {cashFlowData?.consolidation && (
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-[#071d41] text-white font-semibold">
                    <tr>
                      <th className="px-4 py-2.5">Linha Consolidada</th>
                      <th className="px-3 py-2.5 font-mono text-right">Ano 1</th>
                      <th className="px-3 py-2.5 font-mono text-right">Ano 2</th>
                      <th className="px-3 py-2.5 font-mono text-right">Ano 3</th>
                      <th className="px-3 py-2.5 font-mono text-right">Ano 4</th>
                      <th className="px-3 py-2.5 font-mono text-right">Ano 5</th>
                      <th className="px-3 py-2.5 font-mono text-right">Ano 6</th>
                      <th className="px-3 py-2.5 font-mono text-right">Ano 7</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    <tr className="bg-emerald-50/60 font-bold text-emerald-950">
                      <td className="px-4 py-2">Total de Receitas (+)</td>
                      {cashFlowData.consolidation.receitas.map((v: number, i: number) => (
                        <td key={i} className="px-3 py-2 text-right">
                          {formatCurrency(v)}
                        </td>
                      ))}
                    </tr>
                    <tr className="text-slate-700">
                      <td className="px-4 py-2">Custos Variáveis (-)</td>
                      {cashFlowData.consolidation.custosVariaveis.map((v: number, i: number) => (
                        <td key={i} className="px-3 py-2 text-right">
                          {formatCurrency(v)}
                        </td>
                      ))}
                    </tr>
                    <tr className="text-slate-700">
                      <td className="px-4 py-2">Custos Fixos (-)</td>
                      {cashFlowData.consolidation.custosFixos.map((v: number, i: number) => (
                        <td key={i} className="px-3 py-2 text-right">
                          {formatCurrency(v)}
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-blue-50 font-bold text-blue-950 border-t">
                      <td className="px-4 py-2">Saldo Operacional Anual (=)</td>
                      {cashFlowData.consolidation.saldoOperacional.map((v: number, i: number) => (
                        <td key={i} className="px-3 py-2 text-right">
                          {formatCurrency(v)}
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-slate-100 font-extrabold text-slate-900 border-t">
                      <td className="px-4 py-2">Saldo Acumulado</td>
                      {cashFlowData.consolidation.saldoAcumulado.map((v: number, i: number) => (
                        <td key={i} className="px-3 py-2 text-right">
                          {formatCurrency(v)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Cash Flow Items Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Itens Lançados no Fluxo de Caixa
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-semibold text-slate-600 border-b">
                    <tr>
                      <th className="px-4 py-2.5">Tipo</th>
                      <th className="px-4 py-2.5">Descrição</th>
                      <th className="px-4 py-2.5">Unidade / Qtd</th>
                      <th className="px-4 py-2.5 font-mono text-right">Ano 1 (R$)</th>
                      <th className="px-4 py-2.5 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cashFlowData?.items?.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 text-center text-slate-400">
                          Nenhum item lançado no fluxo de caixa ainda.
                        </td>
                      </tr>
                    ) : (
                      cashFlowData?.items?.map((item: CashFlowItem) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2 font-bold">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] ${
                                item.tipo === "RECEITA"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {item.tipo}
                            </span>
                          </td>
                          <td className="px-4 py-2 font-medium">{item.descricao}</td>
                          <td className="px-4 py-2 text-slate-500">
                            {item.quantidade} {item.unidade}
                          </td>
                          <td className="px-4 py-2 font-mono text-right font-semibold">
                            {formatCurrency(item.ano1)}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {canEdit && (
                              <button
                                onClick={() => handleDeleteCashFlowItem(item.id)}
                                className="text-rose-600 hover:text-rose-800 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {canEdit && (
                <div className="p-4 bg-slate-50 rounded-xl border space-y-2 text-xs">
                  <span className="font-bold text-slate-700 block">Lançar Item no Fluxo</span>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <select
                      value={newCashItem.tipo}
                      onChange={(e) =>
                        setNewCashItem({ ...newCashItem, tipo: e.target.value as any })
                      }
                      className="px-2 py-1.5 border rounded bg-white"
                    >
                      <option value="RECEITA">Receita Operacional</option>
                      <option value="CUSTO_VARIAVEL">Custo Variável</option>
                      <option value="CUSTO_FIXO">Custo Fixo</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Descrição (ex: Venda de Farinha)"
                      value={newCashItem.descricao}
                      onChange={(e) =>
                        setNewCashItem({ ...newCashItem, descricao: e.target.value })
                      }
                      className="px-2 py-1.5 border rounded bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Unidade (ex: Kg, Mês)"
                      value={newCashItem.unidade}
                      onChange={(e) => setNewCashItem({ ...newCashItem, unidade: e.target.value })}
                      className="px-2 py-1.5 border rounded bg-white"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Valor Ano 1"
                        value={newCashItem.ano1}
                        onChange={(e) =>
                          setNewCashItem({
                            ...newCashItem,
                            ano1: Number(e.target.value),
                            ano2: Number(e.target.value),
                            ano3: Number(e.target.value),
                            ano4: Number(e.target.value),
                            ano5: Number(e.target.value),
                            ano6: Number(e.target.value),
                            ano7: Number(e.target.value),
                          })
                        }
                        className="px-2 py-1.5 border rounded bg-white font-mono w-full"
                      />
                      <button
                        onClick={handleAddCashFlowItem}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded text-xs shrink-0"
                      >
                        + Lançar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <button
                onClick={() => setActiveStep("identificacao")}
                className="border text-slate-700 text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
              {canEdit && (
                <button
                  onClick={handleCompleteCashFlow}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-xs"
                >
                  <CheckCheck className="w-4 h-4" /> Concluir Fluxo de Caixa
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: Financiamento & SAC */}
        {activeStep === "financiamento" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Etapa 7: Enquadramento e Cronograma de Amortização SAC
                </h3>
                <p className="text-xs text-slate-500">
                  Cálculo determinístico com carência, taxa de juros e teste de capacidade de pagamento
                </p>
              </div>
              <StatusBadge status={financingData?.financing?.status || "PENDENTE"} />
            </div>

            {/* Capacity Warning Alert Banner (Non-blocking) */}
            {financingData?.calculations?.capacidadeInsuficiente && (
              <div className="p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-900 rounded-r-xl text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>ALERTA DE CAPACIDADE DE PAGAMENTO INSUFICIENTE</span>
                </div>
                <p>
                  A prestação anual projetada excede a margem líquida do fluxo de caixa operacional nos
                  seguintes anos:{" "}
                  {financingData.calculations.alertasCapacidade.map((a: any) => `Ano ${a.ano}`).join(", ")}.
                  (Conforme norma FUNDERR, o processo pode prosseguir com justificativa do comitê).
                </p>
              </div>
            )}

            {/* Financing Form */}
            <div className="p-4 bg-slate-50 rounded-xl border space-y-4 text-xs">
              <h4 className="font-bold text-slate-800 uppercase">Parâmetros do Financiamento</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Linha de Crédito *</label>
                  <select
                    value={financingForm.linhaCreditoId}
                    onChange={(e) => {
                      const line = financingData?.creditLines?.find(
                        (l: CreditLine) => l.id === e.target.value
                      );
                      setFinancingForm({
                        ...financingForm,
                        linhaCreditoId: e.target.value,
                        prazoTotalAnos: line?.prazoMaxAnos || 5,
                        carenciaAnos: line?.carenciaMaxAnos || 1,
                        taxaJurosAnual: line?.taxaJurosAnual || 2.0,
                      });
                    }}
                    className="w-full p-2 border rounded bg-white"
                  >
                    <option value="">Selecione a Linha</option>
                    {financingData?.creditLines?.map((l: CreditLine) => (
                      <option key={l.id} value={l.id}>
                        {l.nome} ({l.taxaJurosAnual}% a.a., até{" "}
                        {formatCurrency(l.tetoFinanciamento)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valor da Proposta (R$) *</label>
                  <input
                    type="number"
                    value={financingForm.valorProposta}
                    onChange={(e) =>
                      setFinancingForm({ ...financingForm, valorProposta: Number(e.target.value) })
                    }
                    className="w-full p-2 border rounded bg-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Juros na Carência</label>
                  <select
                    value={financingForm.jurosCarencia}
                    onChange={(e) =>
                      setFinancingForm({ ...financingForm, jurosCarencia: e.target.value as any })
                    }
                    className="w-full p-2 border rounded bg-white"
                  >
                    <option value="PAGAR">Pagar no ano (PAGAR)</option>
                    <option value="CAPITALIZAR">Capitalizar no saldo (CAPITALIZAR)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prazo Total (Anos)</label>
                  <input
                    type="number"
                    value={financingForm.prazoTotalAnos}
                    onChange={(e) =>
                      setFinancingForm({ ...financingForm, prazoTotalAnos: Number(e.target.value) })
                    }
                    className="w-full p-2 border rounded bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Carência (Anos)</label>
                  <input
                    type="number"
                    value={financingForm.carenciaAnos}
                    onChange={(e) =>
                      setFinancingForm({ ...financingForm, carenciaAnos: Number(e.target.value) })
                    }
                    className="w-full p-2 border rounded bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Taxa de Juros (% a.a.)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={financingForm.taxaJurosAnual}
                    onChange={(e) =>
                      setFinancingForm({ ...financingForm, taxaJurosAnual: Number(e.target.value) })
                    }
                    className="w-full p-2 border rounded bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Taxa ATER (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={financingForm.percentualAter}
                    onChange={(e) =>
                      setFinancingForm({ ...financingForm, percentualAter: Number(e.target.value) })
                    }
                    className="w-full p-2 border rounded bg-white font-mono"
                  />
                </div>
              </div>

              {canEdit && (
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveFinancing}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded text-xs"
                  >
                    Recalcular SAC
                  </button>
                </div>
              )}
            </div>

            {/* SAC Schedule Table */}
            {financingData?.calculations?.cronograma && (
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Quadro de Amortização SAC Rural
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#071d41] text-white font-semibold">
                      <tr>
                        <th className="px-4 py-2.5">Ano</th>
                        <th className="px-4 py-2.5 text-right">Saldo Devedor Inicial</th>
                        <th className="px-4 py-2.5 text-right">Amortização</th>
                        <th className="px-4 py-2.5 text-right">Juros ({financingForm.taxaJurosAnual}%)</th>
                        <th className="px-4 py-2.5 text-right">Prestação Anual</th>
                        <th className="px-4 py-2.5 text-right">Saldo Devedor Final</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {financingData.calculations.cronograma.map((parc: any) => (
                        <tr key={parc.ano} className="hover:bg-slate-50">
                          <td className="px-4 py-2 font-bold font-sans">
                            Ano {parc.ano} {parc.carencia ? "(Carência)" : ""}
                          </td>
                          <td className="px-4 py-2 text-right">{formatCurrency(parc.saldoInicial)}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(parc.amortizacao)}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(parc.juros)}</td>
                          <td className="px-4 py-2 text-right font-extrabold text-blue-900">
                            {formatCurrency(parc.prestacao)}
                          </td>
                          <td className="px-4 py-2 text-right">{formatCurrency(parc.saldoFinal)}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-100 font-extrabold text-slate-900 border-t">
                        <td className="px-4 py-2.5 font-sans">TOTAIS</td>
                        <td className="px-4 py-2.5 text-right">-</td>
                        <td className="px-4 py-2.5 text-right">
                          {formatCurrency(financingData.calculations.totalAmortizacao)}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {formatCurrency(financingData.calculations.totalJuros)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-blue-900">
                          {formatCurrency(financingData.calculations.totalPrestacoes)}
                        </td>
                        <td className="px-4 py-2.5 text-right">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Guarantees */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Garantias Vinculadas
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-3">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-semibold text-slate-600 border-b">
                    <tr>
                      <th className="px-4 py-2.5">Tipo</th>
                      <th className="px-4 py-2.5">Descrição</th>
                      <th className="px-4 py-2.5">Garantidor / CPF</th>
                      <th className="px-4 py-2.5 text-right">Valor Estimado</th>
                      <th className="px-4 py-2.5 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {financingData?.guarantees?.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-3 text-center text-slate-400">
                          Nenhuma garantia complementar registrada.
                        </td>
                      </tr>
                    ) : (
                      financingData?.guarantees?.map((g: any) => (
                        <tr key={g.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2 font-bold text-blue-900">{g.tipo}</td>
                          <td className="px-4 py-2">{g.descricao}</td>
                          <td className="px-4 py-2 text-slate-600">
                            {g.garantidorNome ? `${g.garantidorNome} (${g.garantidorCpf})` : "-"}
                          </td>
                          <td className="px-4 py-2 text-right font-mono font-bold">
                            {g.valorEstimado ? formatCurrency(g.valorEstimado) : "-"}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {canEdit && (
                              <button
                                onClick={() => handleDeleteGuarantee(g.id)}
                                className="text-rose-600 hover:text-rose-800 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {canEdit && (
                <div className="p-3 bg-slate-50 rounded-xl border flex flex-wrap gap-2 text-xs">
                  <select
                    value={newGuarantee.tipo}
                    onChange={(e) =>
                      setNewGuarantee({ ...newGuarantee, tipo: e.target.value as any })
                    }
                    className="px-2 py-1 border rounded bg-white"
                  >
                    <option value="AVAL_PESSOAL">Aval Pessoal / Fiança</option>
                    <option value="BEM">Penhor / Hipoteca de Bem</option>
                    <option value="OUTRA">Outra Garantia</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Descrição da garantia"
                    value={newGuarantee.descricao}
                    onChange={(e) =>
                      setNewGuarantee({ ...newGuarantee, descricao: e.target.value })
                    }
                    className="px-2 py-1 border rounded bg-white flex-1"
                  />
                  <input
                    type="text"
                    placeholder="Nome Avalista"
                    value={newGuarantee.garantidorNome}
                    onChange={(e) =>
                      setNewGuarantee({ ...newGuarantee, garantidorNome: e.target.value })
                    }
                    className="px-2 py-1 border rounded bg-white"
                  />
                  <input
                    type="number"
                    placeholder="Valor Estimado"
                    value={newGuarantee.valorEstimado || ""}
                    onChange={(e) =>
                      setNewGuarantee({ ...newGuarantee, valorEstimado: Number(e.target.value) })
                    }
                    className="px-2 py-1 border rounded bg-white w-28 font-mono"
                  />
                  <button
                    onClick={handleAddGuarantee}
                    className="bg-slate-700 hover:bg-slate-800 text-white font-bold px-3 py-1 rounded"
                  >
                    + Vincular Garantia
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <button
                onClick={() => setActiveStep("fluxoCaixa")}
                className="border text-slate-700 text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
              {canEdit && (
                <button
                  onClick={handleCompleteFinancing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-xs"
                >
                  <CheckCheck className="w-4 h-4" /> Concluir Financiamento SAC
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 8: Documentos & Document AI */}
        {activeStep === "documentos" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  Etapa 8: Repositório de Documentos & Extração Document AI
                  <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> IA Integrada
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Upload de CAF/DAP, CAR, CPF, Orçamentos e confirmação de dados extraídos por IA
                </p>
              </div>
              <StatusBadge status={selectedProposal.etapas.documentos.status} />
            </div>

            {/* Upload Zone */}
            {canEdit && (
              <div className="p-6 border-2 border-dashed border-blue-200 rounded-2xl bg-blue-50/40 text-center space-y-3">
                <Upload className="w-8 h-8 text-[#1351b4] mx-auto" />
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Enviar Documento do Processo</h4>
                  <p className="text-xs text-slate-500">
                    Formatos suportados: PDF, PNG, JPG (Extração automática por Document AI)
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <select
                    value={uploadDocType}
                    onChange={(e) => setUploadDocType(e.target.value as any)}
                    className="px-3 py-2 border rounded-lg text-xs bg-white font-semibold text-slate-700"
                  >
                    <option value="CAF_DAP">CAF / DAP (Pronaf)</option>
                    <option value="CAR_RORAIMA">CAR Roraima (FEMARH)</option>
                    <option value="CPF_RG">Documento de Identidade (RG/CPF)</option>
                    <option value="TITULO_TERRA">Título da Terra / Posse</option>
                    <option value="ORCAMENTO">Orçamento de Máquinas / Insumos</option>
                    <option value="PROJETO_TECNICO">Projeto Técnico ATER</option>
                    <option value="COMPROVANTE_RESIDENCIA">Comprovante de Residência</option>
                    <option value="OUTRO">Outro Anexo</option>
                  </select>

                  <label className="cursor-pointer bg-[#1351b4] hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-xs transition-colors flex items-center gap-2">
                    <span>Selecionar e Digitalizar</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleUploadDocument}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Documents List & AI Cards */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Documentos Anexados ao Processo ({documentsData.length})
              </h4>

              {documentsData.length === 0 ? (
                <div className="p-8 text-center text-slate-400 border rounded-xl bg-slate-50 text-xs">
                  Nenhum documento anexado ao processo. Realize o envio acima para processamento com IA.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documentsData.map((doc) => (
                    <div
                      key={doc.id}
                      className={`p-4 rounded-xl border transition-all ${
                        doc.status === "CONFIRMED"
                          ? "bg-white border-emerald-200 shadow-xs"
                          : "bg-purple-50/50 border-purple-200 shadow-xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900">{doc.nomeArquivo}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-semibold">
                              {doc.tipo}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {(doc.tamanhoBytes / 1024).toFixed(1)} KB • {doc.createdAt.slice(0, 10)}
                          </span>
                        </div>
                        <StatusBadge status={doc.status} size="sm" />
                      </div>

                      {/* Extracted fields */}
                      {doc.extractedData && (
                        <div className="mt-3 p-3 bg-white/90 rounded-lg border border-slate-200/80 text-xs space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-purple-900 border-b pb-1 mb-1">
                            <span className="flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-purple-600" />
                              Campos Estruturados (IA)
                            </span>
                            {doc.aiConfidence && (
                              <span className="text-emerald-700 font-mono">
                                Confiança: {Math.round(doc.aiConfidence * 100)}%
                              </span>
                            )}
                          </div>
                          {Object.entries(doc.extractedData).map(([k, v]) => (
                            <div key={k} className="flex justify-between gap-2 text-[11px]">
                              <span className="text-slate-500 font-medium">{k}:</span>
                              <span className="font-semibold text-slate-800 text-right truncate max-w-[200px]">
                                {typeof v === "object" ? JSON.stringify(v) : String(v)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                        {canEdit && (
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="text-rose-600 hover:text-rose-800 text-xs flex items-center gap-1 font-semibold"
                          >
                            <Trash2 className="w-3 h-3" /> Excluir
                          </button>
                        )}
                        {doc.status !== "CONFIRMED" && canEdit && (
                          <button
                            onClick={() => handleConfirmDocumentAI(doc.id, doc.extractedData)}
                            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Validar & Confirmar Extração
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <button
                onClick={() => setActiveStep("financiamento")}
                className="border text-slate-700 text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
              <button
                onClick={() => onSelectProposal(undefined)}
                className="bg-[#1351b4] text-white text-xs font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-xs"
              >
                Finalizar Análise & Voltar aos Processos
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
