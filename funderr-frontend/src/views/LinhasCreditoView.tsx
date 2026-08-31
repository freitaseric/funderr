import React, { useState } from "react";
import { AppTextarea } from "../components/ui/AppTextarea";
import { AppTextField } from "../components/ui/AppTextField";
import { AppButton } from "../components/ui/AppButton";
import { CreditLine } from "../domain/types";
import { formatCurrency } from "../domain/calculations";
import { useAuth } from "../context/AuthContext";
import { Modal } from "../components/ui/Modal";
import { Plus, CreditCard, Check, AlertCircle, Edit } from "../components/ui/icons";

interface LinhasCreditoViewProps {
  creditLines: CreditLine[];
  onSave: (data: any) => Promise<void>;
}

export const LinhasCreditoView: React.FC<LinhasCreditoViewProps> = ({
  creditLines,
  onSave,
}) => {
  const { isGestor, isAdmin } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLine, setSelectedLine] = useState<CreditLine | null>(null);

  const [formData, setFormData] = useState({
    codigo: "",
    nome: "",
    tetoFinanciamento: 50000,
    taxaJurosAnual: 2.0,
    prazoMaxAnos: 5,
    carenciaMaxAnos: 1,
    percentualFinanciavelMax: 100,
    percentualAterPadrao: 2.5,
    observacoes: "",
    ativo: true,
  });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const openNewModal = () => {
    setSelectedLine(null);
    setFormData({
      codigo: `FUNDERR_${Date.now().toString().slice(-4)}`,
      nome: "",
      tetoFinanciamento: 50000,
      taxaJurosAnual: 2.0,
      prazoMaxAnos: 5,
      carenciaMaxAnos: 1,
      percentualFinanciavelMax: 100,
      percentualAterPadrao: 2.5,
      observacoes: "",
      ativo: true,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (line: CreditLine) => {
    setSelectedLine(line);
    setFormData({
      codigo: line.codigo,
      nome: line.nome,
      tetoFinanciamento: line.tetoFinanciamento,
      taxaJurosAnual: line.taxaJurosAnual,
      prazoMaxAnos: line.prazoMaxAnos,
      carenciaMaxAnos: line.carenciaMaxAnos,
      percentualFinanciavelMax: line.percentualFinanciavelMax,
      percentualAterPadrao: line.percentualAterPadrao,
      observacoes: line.observacoes || "",
      ativo: line.ativo,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    try {
      setSaving(true);
      await onSave({
        id: selectedLine?.id,
        ...formData,
        tetoFinanciamento: Number(formData.tetoFinanciamento),
        taxaJurosAnual: Number(formData.taxaJurosAnual),
        prazoMaxAnos: Number(formData.prazoMaxAnos),
        carenciaMaxAnos: Number(formData.carenciaMaxAnos),
        percentualFinanciavelMax: Number(formData.percentualFinanciavelMax),
        percentualAterPadrao: Number(formData.percentualAterPadrao),
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Erro ao salvar linha de crédito");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Linhas de Crédito Rural</h2>
          <p className="text-xs text-slate-500">
            Regras de enquadramento, tetos de financiamento, carência e juros para Roraima
          </p>
        </div>
        {(isGestor || isAdmin) && (
          <AppButton
            onClick={openNewModal}
            className="bg-[#386a20] hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-lg text-sm shadow-xs transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Linha de Crédito
          </AppButton>
        )}
      </div>

      {/* Grid of Credit Lines */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {creditLines.map((line) => (
          <div
            key={line.id}
            className={`p-5 rounded-2xl border transition-all ${
              line.ativo
                ? "bg-surface border-slate-200 shadow-xs hover:border-blue-300"
                : "bg-slate-50 border-slate-200 opacity-60"
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <span className="text-[10px] font-bold font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                  {line.codigo}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1.5">{line.nome}</h3>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  line.ativo ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"
                }`}
              >
                {line.ativo ? "Ativa" : "Inativa"}
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Teto Máximo:</span>
                <span className="font-extrabold text-slate-900 font-mono">
                  {formatCurrency(line.tetoFinanciamento)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Taxa de Juros:</span>
                <span className="font-bold text-blue-700 font-mono">
                  {line.taxaJurosAnual}% a.a.
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Prazo / Carência:</span>
                <span className="font-semibold text-slate-800">
                  Até {line.prazoMaxAnos} anos ({line.carenciaMaxAnos} ano carência)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Financiável / ATER:</span>
                <span className="font-semibold text-slate-800">
                  {line.percentualFinanciavelMax}% / {line.percentualAterPadrao}% ATER
                </span>
              </div>
              {line.observacoes && (
                <p className="text-[11px] text-slate-500 mt-2 bg-slate-50 p-2 rounded">
                  {line.observacoes}
                </p>
              )}
            </div>

            {(isGestor || isAdmin) && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                <AppButton
                  onClick={() => openEditModal(line)}
                  className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
                >
                  <Edit className="w-3.5 h-3.5" /> Editar Parâmetros
                </AppButton>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedLine ? "Editar Linha de Crédito" : "Nova Linha de Crédito"}
        subtitle="Configuração de taxas, carência e tetos regulamentares"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {formError}
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Código da Linha *</label>
            <AppTextField
              type="text"
              required
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              className="w-full p-2 border rounded font-mono uppercase"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nome da Linha *</label>
            <AppTextField
              type="text"
              required
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Teto Máximo (R$) *</label>
              <AppTextField
                type="number"
                required
                value={formData.tetoFinanciamento}
                onChange={(e) =>
                  setFormData({ ...formData, tetoFinanciamento: Number(e.target.value) })
                }
                className="w-full p-2 border rounded font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Taxa de Juros (% a.a.) *</label>
              <AppTextField
                type="number"
                step="0.1"
                required
                value={formData.taxaJurosAnual}
                onChange={(e) =>
                  setFormData({ ...formData, taxaJurosAnual: Number(e.target.value) })
                }
                className="w-full p-2 border rounded font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Prazo Máximo (Anos)</label>
              <AppTextField
                type="number"
                required
                value={formData.prazoMaxAnos}
                onChange={(e) =>
                  setFormData({ ...formData, prazoMaxAnos: Number(e.target.value) })
                }
                className="w-full p-2 border rounded font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Carência Máxima (Anos)</label>
              <AppTextField
                type="number"
                required
                value={formData.carenciaMaxAnos}
                onChange={(e) =>
                  setFormData({ ...formData, carenciaMaxAnos: Number(e.target.value) })
                }
                className="w-full p-2 border rounded font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Observações / Normas</label>
            <AppTextarea
              rows={2}
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <AppTextField
              type="checkbox"
              id="ativo"
              checked={formData.ativo}
              onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="ativo" className="font-semibold text-slate-700">
              Linha ativa para novos enquadramentos
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <AppButton
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
            >
              Cancelar
            </AppButton>
            <AppButton
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-[#386a20] text-white font-bold rounded-lg disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar Linha"}
            </AppButton>
          </div>
        </form>
      </Modal>
    </div>
  );
};
