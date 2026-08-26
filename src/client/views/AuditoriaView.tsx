import React, { useState } from "react";
import { AuditLog } from "../../domain/types";
import { Search, History, Shield, Filter } from "lucide-react";

interface AuditoriaViewProps {
  logs: AuditLog[];
}

export const AuditoriaView: React.FC<AuditoriaViewProps> = ({ logs }) => {
  const [search, setSearch] = useState("");
  const [filterEntity, setFilterEntity] = useState("");

  const filtered = logs.filter((l) => {
    const matchesSearch =
      l.acao.toLowerCase().includes(search.toLowerCase()) ||
      l.userName.toLowerCase().includes(search.toLowerCase()) ||
      l.entidade.toLowerCase().includes(search.toLowerCase());
    const matchesEntity = !filterEntity || l.entidade === filterEntity;
    return matchesSearch && matchesEntity;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Trilha de Auditoria & Segurança
        </h2>
        <p className="text-xs text-slate-500">
          Registro imutável de todas as mutações, cálculos, aprovações e reversões de status
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="flex items-center gap-2 flex-1 w-full">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por ação, operador ou entidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm outline-hidden text-slate-800 placeholder-slate-400"
          />
        </div>
        <div className="w-full md:w-64">
          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs bg-slate-50"
          >
            <option value="">Todas as Entidades</option>
            <option value="Proposal">Proposal (Processo)</option>
            <option value="Beneficiary">Beneficiary (Produtor)</option>
            <option value="Property">Property (Propriedade)</option>
            <option value="PatrimonyItem">PatrimonyItem (Patrimônio)</option>
            <option value="CashFlowItem">CashFlowItem (Fluxo)</option>
            <option value="FinancingScenario">FinancingScenario (SAC)</option>
            <option value="ProposalDocument">ProposalDocument (Documento)</option>
            <option value="CreditLine">CreditLine (Linha de Crédito)</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#071d41] text-white uppercase text-[11px] font-semibold">
              <tr>
                <th className="px-5 py-3 font-sans">Timestamp / Data</th>
                <th className="px-5 py-3 font-sans">Operador</th>
                <th className="px-5 py-3 font-sans">Perfil</th>
                <th className="px-5 py-3 font-sans">Ação</th>
                <th className="px-5 py-3 font-sans">Entidade</th>
                <th className="px-5 py-3 font-sans">ID Entidade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400 font-sans">
                    Nenhum registro de auditoria encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-5 py-3 font-bold font-sans text-slate-900">
                      {log.userName}
                    </td>
                    <td className="px-5 py-3">
                      <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold">
                        {log.userRole || "SISTEMA"}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-bold text-blue-700">{log.acao}</td>
                    <td className="px-5 py-3 font-sans font-medium text-slate-800">
                      {log.entidade}
                    </td>
                    <td className="px-5 py-3 text-slate-400 truncate max-w-[120px]">
                      {log.entityId}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
