import React, { useState } from "react";
import { AppSelect } from "../components/ui/AppSelect";
import { AppTextField } from "../components/ui/AppTextField";
import { AppButton } from "../components/ui/AppButton";
import { ProposalDocument } from "../domain/types";
import { StatusBadge } from "../components/ui/StatusBadge";
import { FolderOpen, Search, Sparkles, FileText, CheckCircle2 } from "../components/ui/icons";

interface DocumentosGeraisViewProps {
  documents: ProposalDocument[];
  onOpenProposal: (proposalId: string) => void;
}

export const DocumentosGeraisView: React.FC<DocumentosGeraisViewProps> = ({
  documents,
  onOpenProposal,
}) => {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");

  const filtered = documents.filter((d) => {
    const matchesSearch =
      d.nomeArquivo.toLowerCase().includes(search.toLowerCase()) ||
      d.tipo.toLowerCase().includes(search.toLowerCase());
    const matchesType = !filterType || d.tipo === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Repositório Digital de Documentos</h2>
        <p className="text-xs text-slate-500">
          Catalogação e inteligência documental com Document AI e Gemini para o crédito rural
        </p>
      </div>

      {/* Filters */}
      <div className="bg-surface p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="flex items-center gap-2 flex-1 w-full">
          <Search className="w-5 h-5 text-slate-400" />
          <AppTextField
            type="text"
            placeholder="Buscar por nome do arquivo ou tipo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm outline-hidden text-slate-800 placeholder-slate-400"
          />
        </div>
        <div className="w-full md:w-64">
          <AppSelect
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs bg-slate-50"
          >
            <option value="">Todos os Tipos Documentais</option>
            <option value="CAF_DAP">CAF / DAP</option>
            <option value="CAR_RORAIMA">CAR Roraima</option>
            <option value="CPF_RG">RG / CPF</option>
            <option value="TITULO_TERRA">Título da Terra</option>
            <option value="ORCAMENTO">Orçamento de Máquinas</option>
            <option value="PROJETO_TECNICO">Projeto Técnico ATER</option>
          </AppSelect>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-400 border rounded-2xl bg-surface">
            <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nenhum documento encontrado.</p>
          </div>
        ) : (
          filtered.map((doc) => (
            <div
              key={doc.id}
              className="bg-surface p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 truncate max-w-[160px]">
                        {doc.nomeArquivo}
                      </h4>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {doc.tipo}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={doc.status} size="sm" />
                </div>

                {doc.extractedData && (
                  <div className="mt-3 p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-purple-900 mb-1">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                        Campos Reconhecidos
                      </span>
                      {doc.aiConfidence && (
                        <span className="text-emerald-700 font-mono">
                          {Math.round(doc.aiConfidence * 100)}%
                        </span>
                      )}
                    </div>
                    {Object.entries(doc.extractedData).slice(0, 3).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-[11px]">
                        <span className="text-slate-500">{k}:</span>
                        <span className="font-semibold text-slate-800 truncate max-w-[140px]">
                          {typeof v === "object" ? JSON.stringify(v) : String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  {doc.createdAt.slice(0, 10)} • {(doc.tamanhoBytes / 1024).toFixed(1)} KB
                </span>
                <AppButton
                  onClick={() => onOpenProposal(doc.proposalId)}
                  className="text-xs font-bold text-[#386a20] hover:underline"
                >
                  Abrir no Processo →
                </AppButton>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
