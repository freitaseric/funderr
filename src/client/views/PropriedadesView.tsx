import React, { useState } from "react";
import { Beneficiary, LandCondition, LandDocumentType, Property } from "../../domain/types";
import { RORAIMA_MUNICIPALITIES, validateCoordinates } from "../../domain/calculations";
import { Modal } from "../components/ui/Modal";
import { useAuth } from "../context/AuthContext";
import { Plus, Search, MapPin, ExternalLink, AlertCircle, Home, Compass } from "lucide-react";

interface PropriedadesViewProps {
  properties: Property[];
  beneficiaries: Beneficiary[];
  onSave: (data: any) => Promise<void>;
}

export const PropriedadesView: React.FC<PropriedadesViewProps> = ({
  properties,
  beneficiaries,
  onSave,
}) => {
  const { canEdit } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedMunicipio, setSelectedMunicipio] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProp, setSelectedProp] = useState<Property | null>(null);

  const [formData, setFormData] = useState({
    beneficiaryId: "",
    denominacao: "",
    municipio: "Cantá",
    localizacaoAcesso: "",
    areaTotalHa: 50,
    areaExploradaHa: 20,
    condicaoPosse: "PROPRIETARIO" as LandCondition,
    documentacaoTerra: "TITULO_DEFINITIVO" as LandDocumentType,
    numeroDocumentoTerra: "",
    latitude: 2.6111 as number | null,
    longitude: -60.6019 as number | null,
  });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const openNewModal = () => {
    setSelectedProp(null);
    setFormData({
      beneficiaryId: beneficiaries[0]?.id || "",
      denominacao: "",
      municipio: "Cantá",
      localizacaoAcesso: "",
      areaTotalHa: 50,
      areaExploradaHa: 20,
      condicaoPosse: "PROPRIETARIO",
      documentacaoTerra: "TITULO_DEFINITIVO",
      numeroDocumentoTerra: "",
      latitude: 2.6111,
      longitude: -60.6019,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (p: Property) => {
    setSelectedProp(p);
    setFormData({
      beneficiaryId: p.beneficiaryId,
      denominacao: p.denominacao,
      municipio: p.municipio,
      localizacaoAcesso: p.localizacaoAcesso || "",
      areaTotalHa: p.areaTotalHa,
      areaExploradaHa: p.areaExploradaHa,
      condicaoPosse: p.condicaoPosse,
      documentacaoTerra: p.documentacaoTerra,
      numeroDocumentoTerra: p.numeroDocumentoTerra || "",
      latitude: p.latitude || null,
      longitude: p.longitude || null,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleMunicipioChange = (m: string) => {
    setFormData((prev) => ({
      ...prev,
      municipio: m,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.beneficiaryId) {
      setFormError("Selecione o beneficiário proprietário");
      return;
    }

    const coordCheck = validateCoordinates(formData.latitude, formData.longitude);
    if (!coordCheck.valid) {
      setFormError(coordCheck.error || "Coordenadas geográficas inválidas");
      return;
    }

    try {
      setSaving(true);
      await onSave({
        id: selectedProp?.id,
        ...formData,
        areaTotalHa: Number(formData.areaTotalHa),
        areaExploradaHa: Number(formData.areaExploradaHa),
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Erro ao salvar propriedade");
    } finally {
      setSaving(false);
    }
  };

  const filtered = properties.filter((p) => {
    const matchesSearch =
      p.denominacao.toLowerCase().includes(search.toLowerCase()) ||
      p.municipio.toLowerCase().includes(search.toLowerCase()) ||
      (p.beneficiaryNome && p.beneficiaryNome.toLowerCase().includes(search.toLowerCase()));
    const matchesMun = !selectedMunicipio || p.municipio === selectedMunicipio;
    return matchesSearch && matchesMun;
  });

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Propriedades Rurais</h2>
          <p className="text-xs text-slate-500">
            Mapeamento fundiário, geolocalização e posse nos 15 municípios do Estado de Roraima
          </p>
        </div>
        {canEdit && (
          <button
            onClick={openNewModal}
            className="bg-[#1351b4] hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-lg text-sm shadow-xs transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Propriedade Rural
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="flex items-center gap-2 flex-1 w-full">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por denominação da gleba, município ou beneficiário..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm outline-hidden text-slate-800 placeholder-slate-400"
          />
        </div>
        <div className="w-full md:w-64">
          <select
            value={selectedMunicipio}
            onChange={(e) => setSelectedMunicipio(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs bg-slate-50"
          >
            <option value="">Todos os 15 Municípios de RR</option>
            {RORAIMA_MUNICIPALITIES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-100 font-semibold">
              <tr>
                <th className="px-6 py-3">Denominação / Imóvel</th>
                <th className="px-6 py-3">Município</th>
                <th className="px-6 py-3">Beneficiário Titular</th>
                <th className="px-6 py-3">Área Total</th>
                <th className="px-6 py-3">Condição de Posse</th>
                <th className="px-6 py-3">Geolocalização</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400 text-sm">
                    Nenhuma propriedade encontrada com os filtros informados.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        {p.denominacao}
                      </div>
                      {p.localizacaoAcesso && (
                        <div className="text-xs text-slate-500 truncate max-w-xs">
                          {p.localizacaoAcesso}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-xs text-slate-800">
                      <span className="bg-blue-50 text-[#1351b4] px-2 py-0.5 rounded-full font-semibold">
                        {p.municipio}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-700 font-medium">
                      {p.beneficiaryNome || "Não informado"}
                    </td>
                    <td className="px-6 py-3.5 text-xs font-mono">
                      <span className="font-bold">{p.areaTotalHa} ha</span>
                      <span className="text-slate-400 text-[10px] block">
                        ({p.areaExploradaHa} ha expl.)
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[11px]">
                        {p.condicaoPosse}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs">
                      {p.latitude && p.longitude ? (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-mono text-[11px] underline"
                        >
                          <MapPin className="w-3 h-3 text-red-500" />
                          {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Sem coordenadas</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => openEditModal(p)}
                        className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-2.5 py-1 rounded border border-blue-200"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedProp ? "Editar Propriedade Rural" : "Nova Propriedade Rural"}
        subtitle="Cadastro da unidade produtiva e coordenadas geográficas em Roraima"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Beneficiário Proprietário *</label>
              <select
                required
                value={formData.beneficiaryId}
                onChange={(e) => setFormData({ ...formData, beneficiaryId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md outline-hidden focus:border-blue-600 bg-white"
              >
                <option value="">Selecione o Produtor</option>
                {beneficiaries.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nome} ({b.cpf})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Denominação do Imóvel / Gleba *</label>
              <input
                type="text"
                required
                placeholder="Ex: Sítio Boa Esperança - Gleba Cauamé"
                value={formData.denominacao}
                onChange={(e) => setFormData({ ...formData, denominacao: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md outline-hidden focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Município (RR) *</label>
              <select
                value={formData.municipio}
                onChange={(e) => handleMunicipioChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md outline-hidden focus:border-blue-600 bg-white"
              >
                {RORAIMA_MUNICIPALITIES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Condição de Posse *</label>
              <select
                value={formData.condicaoPosse}
                onChange={(e) => setFormData({ ...formData, condicaoPosse: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md outline-hidden focus:border-blue-600 bg-white"
              >
                <option value="PROPRIETARIO">Proprietário(a)</option>
                <option value="POSSEIRO">Posseiro(a)</option>
                <option value="ARRENDATARIO">Arrendatário(a)</option>
                <option value="MEEIRO">Meeiro(a)</option>
                <option value="CONCESSIONARIO">Concessionário de Uso</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Área Total (Hectares) *</label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                required
                value={formData.areaTotalHa}
                onChange={(e) => setFormData({ ...formData, areaTotalHa: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md outline-hidden focus:border-blue-600 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Área Explorada (Hectares) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.areaExploradaHa}
                onChange={(e) => setFormData({ ...formData, areaExploradaHa: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md outline-hidden focus:border-blue-600 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Documentação da Terra *</label>
              <select
                value={formData.documentacaoTerra}
                onChange={(e) => setFormData({ ...formData, documentacaoTerra: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md outline-hidden focus:border-blue-600 bg-white"
              >
                <option value="TITULO_DEFINITIVO">Título Definitivo (ITERP / INCRA)</option>
                <option value="CONTRATO_CONCESSAO_DIREITO_REAL_USO">CCDRU / Concessão de Uso</option>
                <option value="RECIBO_COMPRA_VENDA">Recibo de Compra e Venda</option>
                <option value="DECLARACAO_POSSE_ITERP">Declaração de Posse ITERP</option>
                <option value="CAR">Cadastro Ambiental Rural (CAR)</option>
                <option value="OUTRO">Outro Documento</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nº do Título / Matrícula / CAR</label>
              <input
                type="text"
                value={formData.numeroDocumentoTerra}
                onChange={(e) => setFormData({ ...formData, numeroDocumentoTerra: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md outline-hidden focus:border-blue-600"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Roteiro de Acesso / Vicinal</label>
              <input
                type="text"
                placeholder="Ex: Vicinal 04, Km 12, margem direita, após a ponte do igarapé"
                value={formData.localizacaoAcesso}
                onChange={(e) => setFormData({ ...formData, localizacaoAcesso: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md outline-hidden focus:border-blue-600"
              />
            </div>

            {/* Coordinates */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Latitude (Graus Decimais)</label>
              <input
                type="number"
                step="any"
                placeholder="Ex: 2.6111"
                value={formData.latitude ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, latitude: e.target.value ? Number(e.target.value) : null })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-md outline-hidden focus:border-blue-600 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Longitude (Graus Decimais)</label>
              <input
                type="number"
                step="any"
                placeholder="Ex: -60.6019"
                value={formData.longitude ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, longitude: e.target.value ? Number(e.target.value) : null })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-md outline-hidden focus:border-blue-600 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-[#1351b4] hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs disabled:opacity-50"
            >
              {saving ? "Salvando..." : selectedProp ? "Atualizar Propriedade" : "Cadastrar Propriedade"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
