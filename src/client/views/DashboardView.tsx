import React from "react";
import { ProposalDetailView } from "../../server/services/proposal.service";
import { Beneficiary, Property, CreditLine } from "../../domain/types";
import { StatusBadge } from "../components/ui/StatusBadge";
import {
  FileSpreadsheet,
  Users,
  Home,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  PlusCircle,
} from "lucide-react";

interface DashboardViewProps {
  proposals: ProposalDetailView[];
  beneficiaries: Beneficiary[];
  properties: Property[];
  creditLines: CreditLine[];
  onNavigate: (tab: any, proposalId?: string) => void;
  onNewProposal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  proposals,
  beneficiaries,
  properties,
  creditLines,
  onNavigate,
  onNewProposal,
}) => {
  const concluidas = proposals.filter((p) => p.proposal.status === "CONCLUÍDO").length;
  const emAnalise = proposals.filter(
    (p) => p.proposal.status === "EM ANÁLISE" || p.proposal.status === "EM ELABORAÇÃO"
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-[#071d41] to-[#1351b4] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/30 text-blue-100 text-xs px-3 py-1 rounded-full mb-2 backdrop-blur-xs">
              <span>🌾 Painel Integrado de Crédito Rural</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              Gestão de Propostas e Assistência Técnica FUNDERR
            </h2>
            <p className="text-sm text-blue-100 mt-1 max-w-2xl">
              Sistema oficial de análise patrimonial, fluxo de caixa e cronogramas financeiros
              SAC para agricultores e pecuaristas do Estado de Roraima.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onNewProposal}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-4 py-2.5 rounded-lg text-sm shadow-md transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Novo Processo de Crédito
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Processos Ativos</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{proposals.length}</h3>
            <p className="text-xs text-blue-600 font-medium mt-1">{emAnalise} em andamento</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Beneficiários</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{beneficiaries.length}</h3>
            <p className="text-xs text-emerald-600 font-medium mt-1">Produtores cadastrados</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Propriedades Rurais</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{properties.length}</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">Nos 15 municípios de RR</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Home className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Linhas de Crédito</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{creditLines.length}</h3>
            <p className="text-xs text-purple-600 font-medium mt-1">PRONAF e FUNDERR</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recent Proposals Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Processos Recentes em Tramitação</h3>
            <p className="text-xs text-slate-500">
              Acompanhamento de completude e status das etapas do crédito rural
            </p>
          </div>
          <button
            onClick={() => onNavigate("processos")}
            className="text-xs font-semibold text-[#1351b4] hover:underline flex items-center gap-1"
          >
            Ver todos ({proposals.length}) <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {proposals.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nenhum processo de crédito cadastrado no sistema.</p>
            <button
              onClick={onNewProposal}
              className="mt-3 text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded-md"
            >
              Criar Primeiro Processo
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-100 font-semibold">
                <tr>
                  <th className="px-6 py-3">Número</th>
                  <th className="px-6 py-3">Beneficiário</th>
                  <th className="px-6 py-3">Propriedade / Município</th>
                  <th className="px-6 py-3">Atividade</th>
                  <th className="px-6 py-3">Progresso</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {proposals.slice(0, 5).map((p) => (
                  <tr key={p.proposal.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-bold font-mono text-blue-700">
                      {p.proposal.numero}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-900">
                      {p.beneficiaryNome}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-600">
                      {p.propertyDenominacao} ({p.propertyMunicipio})
                    </td>
                    <td className="px-6 py-3.5 text-xs">{p.proposal.atividade}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
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
                        onClick={() => onNavigate("processos", p.proposal.id)}
                        className="text-xs font-bold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#1351b4] px-2.5 py-1 rounded-md border border-slate-200"
                      >
                        Abrir Esteira
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
