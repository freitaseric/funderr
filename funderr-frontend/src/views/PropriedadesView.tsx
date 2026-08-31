import React, { useState } from "react";
import { AppTextarea } from "../components/ui/AppTextarea";
import { AppSelect } from "../components/ui/AppSelect";
import { AppTextField } from "../components/ui/AppTextField";
import { AppButton } from "../components/ui/AppButton";
import { AlertCircle, ExternalLink, Home, MapPin, Plus, Search } from "../components/ui/icons";
import { Beneficiary, Property, RoraimaMunicipality } from "../domain/types";
import { RORAIMA_MUNICIPALITIES, validateCoordinates } from "../domain/calculations";
import { Modal } from "../components/ui/Modal";
import { useAuth } from "../context/AuthContext";

interface PropriedadesViewProps {
  properties: (Property & { percentualCompletude?: number; pendencias?: string[] })[];
  beneficiaries: Beneficiary[];
  onSave: (data: Partial<Property>) => Promise<void>;
}

interface PropertyForm {
  beneficiaryId: string;
  denominacao: string;
  endereco: string;
  municipio: RoraimaMunicipality | "";
  areaTotal: number;
  areaDisponivel: number | "";
  areaLegal: number | "";
  formaOcupacao: string;
  tempoExploracao: string;
  modulo: string;
  documentoExistente: string;
  latitude: number | null;
  longitude: number | null;
  confrontacaoNorte: string;
  confrontacaoSul: string;
  confrontacaoLeste: string;
  confrontacaoOeste: string;
  administracao: string;
}

const emptyForm = (beneficiaryId = ""): PropertyForm => ({
  beneficiaryId,
  denominacao: "",
  endereco: "",
  municipio: "",
  areaTotal: 0,
  areaDisponivel: "",
  areaLegal: "",
  formaOcupacao: "",
  tempoExploracao: "",
  modulo: "",
  documentoExistente: "",
  latitude: null,
  longitude: null,
  confrontacaoNorte: "",
  confrontacaoSul: "",
  confrontacaoLeste: "",
  confrontacaoOeste: "",
  administracao: "",
});

export const PropriedadesView: React.FC<PropriedadesViewProps> = ({
  properties,
  beneficiaries,
  onSave,
}) => {
  const { canEdit } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedMunicipio, setSelectedMunicipio] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [formData, setFormData] = useState<PropertyForm>(emptyForm());
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const openNewModal = () => {
    setSelectedProperty(null);
    setFormData(emptyForm(beneficiaries[0]?.id));
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (property: Property) => {
    setSelectedProperty(property);
    setFormData({
      beneficiaryId: property.beneficiaryId,
      denominacao: property.denominacao,
      endereco: property.endereco,
      municipio: property.municipio as RoraimaMunicipality,
      areaTotal: property.areaTotal,
      areaDisponivel: property.areaDisponivel ?? "",
      areaLegal: property.areaLegal ?? "",
      formaOcupacao: property.formaOcupacao,
      tempoExploracao: property.tempoExploracao || "",
      modulo: property.modulo || "",
      documentoExistente: property.documentoExistente,
      latitude: property.latitude ?? null,
      longitude: property.longitude ?? null,
      confrontacaoNorte: property.confrontacaoNorte || "",
      confrontacaoSul: property.confrontacaoSul || "",
      confrontacaoLeste: property.confrontacaoLeste || "",
      confrontacaoOeste: property.confrontacaoOeste || "",
      administracao: property.administracao || "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");
    const coordinates = validateCoordinates(formData.latitude, formData.longitude);
    if (!coordinates.valid) {
      setFormError(coordinates.error || "Coordenadas geográficas inválidas");
      return;
    }

    try {
      setSaving(true);
      await onSave({
        id: selectedProperty?.id,
        ...formData,
        estado: "RR",
        areaTotal: Number(formData.areaTotal),
        areaDisponivel:
          formData.areaDisponivel === "" ? undefined : Number(formData.areaDisponivel),
        areaLegal: formData.areaLegal === "" ? undefined : Number(formData.areaLegal),
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Erro ao salvar propriedade");
    } finally {
      setSaving(false);
    }
  };

  const filtered = properties.filter((property) => {
    const term = search.toLowerCase();
    const matchesSearch =
      property.denominacao.toLowerCase().includes(term) ||
      property.municipio.toLowerCase().includes(term) ||
      property.beneficiaryNome?.toLowerCase().includes(term);
    return matchesSearch && (!selectedMunicipio || property.municipio === selectedMunicipio);
  });

  const setOptionalNumber = (field: "areaDisponivel" | "areaLegal", value: string) => {
    setFormData({ ...formData, [field]: value === "" ? "" : Number(value) });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Propriedades Rurais</h2>
          <p className="text-xs text-slate-500">Cadastro fundiário e produtivo das propriedades vinculadas aos beneficiários</p>
        </div>
        {canEdit && (
          <AppButton onClick={openNewModal} className="bg-[#386a20] hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-lg text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nova propriedade
          </AppButton>
        )}
      </div>

      <div className="bg-surface p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center gap-3">
        <div className="flex items-center gap-2 flex-1 w-full">
          <Search className="w-5 h-5 text-slate-400" />
          <AppTextField value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por propriedade, município ou beneficiário" className="w-full text-sm outline-hidden" />
        </div>
        <AppSelect value={selectedMunicipio} onChange={(event) => setSelectedMunicipio(event.target.value)} className="w-full md:w-64 px-3 py-2 border rounded-md text-xs bg-slate-50">
          <option value="">Todos os municípios</option>
          {RORAIMA_MUNICIPALITIES.map((municipio) => <option key={municipio}>{municipio}</option>)}
        </AppSelect>
      </div>

      <div className="bg-surface rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b">
              <tr>
                <th className="px-6 py-3">Propriedade</th>
                <th className="px-6 py-3">Município</th>
                <th className="px-6 py-3">Beneficiário</th>
                <th className="px-6 py-3">Áreas</th>
                <th className="px-6 py-3">Ocupação</th>
                <th className="px-6 py-3">Coordenadas</th>
                <th className="px-6 py-3">Completude</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-8 text-center text-slate-400">Nenhuma propriedade encontrada.</td></tr>
              ) : filtered.map((property) => (
                <tr key={property.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3.5">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5"><Home className="w-3.5 h-3.5 text-blue-600" />{property.denominacao}</div>
                    <div className="text-xs text-slate-500 max-w-xs truncate">{property.endereco}</div>
                  </td>
                  <td className="px-6 py-3.5 text-xs font-semibold">{property.municipio}/RR</td>
                  <td className="px-6 py-3.5 text-xs">{property.beneficiaryNome || "Não informado"}</td>
                  <td className="px-6 py-3.5 text-xs font-mono">
                    <strong>{property.areaTotal} ha</strong>
                    <span className="block text-[10px] text-slate-500">Disponível: {property.areaDisponivel ?? "—"} ha · Legal: {property.areaLegal ?? "—"} ha</span>
                  </td>
                  <td className="px-6 py-3.5 text-xs">{property.formaOcupacao}</td>
                  <td className="px-6 py-3.5 text-xs">
                    {property.latitude != null && property.longitude != null ? (
                      <a href={`https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-700 underline font-mono text-[11px]">
                        <MapPin className="w-3 h-3" /> {property.latitude.toFixed(4)}, {property.longitude.toFixed(4)} <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : <span className="text-slate-400">Não informadas</span>}
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2" title={property.pendencias?.join("\n")}>
                      <div className="w-14 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className={`h-full ${(property.percentualCompletude || 0) === 100 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${property.percentualCompletude || 0}%` }} />
                      </div>
                      <span className="text-xs font-bold">{property.percentualCompletude || 0}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    {canEdit && <AppButton onClick={() => openEditModal(property)} className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">Editar</AppButton>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedProperty ? "Editar propriedade rural" : "Nova propriedade rural"} subtitle="Identificação fundiária, produtiva e geográfica" maxWidth="4xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          {formError && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-bold flex items-center gap-2"><AlertCircle className="w-4 h-4" />{formError}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <Field label="Beneficiário responsável *" wide>
              <AppSelect required disabled={Boolean(selectedProperty)} value={formData.beneficiaryId} onChange={(event) => setFormData({ ...formData, beneficiaryId: event.target.value })} className="input">
                <option value="">Selecione</option>
                {beneficiaries.map((beneficiary) => <option key={beneficiary.id} value={beneficiary.id}>{beneficiary.nome} ({beneficiary.cpf})</option>)}
              </AppSelect>
            </Field>
            <Field label="Denominação do imóvel *" wide><AppTextField required minLength={2} value={formData.denominacao} onChange={(event) => setFormData({ ...formData, denominacao: event.target.value })} className="input" /></Field>
            <Field label="Localização / roteiro de acesso" wide><AppTextarea rows={2} value={formData.endereco} onChange={(event) => setFormData({ ...formData, endereco: event.target.value })} className="input" /></Field>
            <Field label="Município"><AppSelect value={formData.municipio} onChange={(event) => setFormData({ ...formData, municipio: event.target.value as RoraimaMunicipality | "" })} className="input"><option value="">Selecione</option>{RORAIMA_MUNICIPALITIES.map((municipio) => <option key={municipio}>{municipio}</option>)}</AppSelect></Field>
            <Field label="Forma de ocupação"><AppSelect value={formData.formaOcupacao} onChange={(event) => setFormData({ ...formData, formaOcupacao: event.target.value })} className="input"><option value="">Selecione</option><option>Proprietário</option><option>Posseiro</option><option>Arrendatário</option><option>Meeiro</option><option>Concessionário de uso</option><option>Comodatário</option></AppSelect></Field>
            <Field label="Área total (ha)"><AppTextField type="number" min="0" step="0.01" value={formData.areaTotal || ""} onChange={(event) => setFormData({ ...formData, areaTotal: Number(event.target.value) })} className="input" /></Field>
            <Field label="Área disponível (ha)"><AppTextField type="number" min="0" step="0.01" value={formData.areaDisponivel} onChange={(event) => setOptionalNumber("areaDisponivel", event.target.value)} className="input" /></Field>
            <Field label="Área legal/reserva (ha)"><AppTextField type="number" min="0" step="0.01" value={formData.areaLegal} onChange={(event) => setOptionalNumber("areaLegal", event.target.value)} className="input" /></Field>
            <Field label="Tempo de exploração"><AppTextField value={formData.tempoExploracao} onChange={(event) => setFormData({ ...formData, tempoExploracao: event.target.value })} placeholder="Ex.: 8 anos" className="input" /></Field>
            <Field label="Módulo fiscal / rural"><AppTextField value={formData.modulo} onChange={(event) => setFormData({ ...formData, modulo: event.target.value })} className="input" /></Field>
            <Field label="Documento fundiário existente" wide><AppTextField value={formData.documentoExistente} onChange={(event) => setFormData({ ...formData, documentoExistente: event.target.value })} placeholder="Tipo, número, matrícula ou identificação do documento" className="input" /></Field>
            <Field label="Latitude"><AppTextField type="number" step="any" value={formData.latitude ?? ""} onChange={(event) => setFormData({ ...formData, latitude: event.target.value === "" ? null : Number(event.target.value) })} className="input font-mono" /></Field>
            <Field label="Longitude"><AppTextField type="number" step="any" value={formData.longitude ?? ""} onChange={(event) => setFormData({ ...formData, longitude: event.target.value === "" ? null : Number(event.target.value) })} className="input font-mono" /></Field>
            <Field label="Confrontação norte"><AppTextField value={formData.confrontacaoNorte} onChange={(event) => setFormData({ ...formData, confrontacaoNorte: event.target.value })} className="input" /></Field>
            <Field label="Confrontação sul"><AppTextField value={formData.confrontacaoSul} onChange={(event) => setFormData({ ...formData, confrontacaoSul: event.target.value })} className="input" /></Field>
            <Field label="Confrontação leste"><AppTextField value={formData.confrontacaoLeste} onChange={(event) => setFormData({ ...formData, confrontacaoLeste: event.target.value })} className="input" /></Field>
            <Field label="Confrontação oeste"><AppTextField value={formData.confrontacaoOeste} onChange={(event) => setFormData({ ...formData, confrontacaoOeste: event.target.value })} className="input" /></Field>
            <Field label="Administração / responsável local" wide><AppTextarea rows={2} value={formData.administracao} onChange={(event) => setFormData({ ...formData, administracao: event.target.value })} className="input" /></Field>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <AppButton type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-xs font-semibold">Cancelar</AppButton>
            <AppButton type="submit" disabled={saving} className="px-5 py-2 bg-[#386a20] text-white font-bold rounded-lg text-xs disabled:opacity-50">{saving ? "Salvando..." : "Salvar rascunho"}</AppButton>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const Field: React.FC<{ label: string; wide?: boolean; children: React.ReactNode }> = ({ label, wide, children }) => (
  <label className={wide ? "md:col-span-2 block font-bold text-slate-700" : "block font-bold text-slate-700"}>
    <span className="block mb-1">{label}</span>
    {children}
  </label>
);
