import React, { useState } from "react";
import { AppSelect } from "../components/ui/AppSelect";
import { AppTextField } from "../components/ui/AppTextField";
import { AppButton } from "../components/ui/AppButton";
import { Beneficiary, MaritalStatus } from "../domain/types";
import { formatCPF, formatPhone, validateCPF } from "../domain/calculations";
import { Modal } from "../components/ui/Modal";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { Plus, Search, User, Phone, MapPin, CheckCircle2, AlertCircle, Trash2, Edit } from "../components/ui/icons";

interface BeneficiariosViewProps {
  beneficiaries: (Beneficiary & { percentualCompletude?: number; totalPropriedades?: number; pendencias?: string[] })[];
  onSave: (data: any) => Promise<void>;
}

export const BeneficiariosView: React.FC<BeneficiariosViewProps> = ({
  beneficiaries,
  onSave,
}) => {
  const { canEdit } = useAuth();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBen, setSelectedBen] = useState<Beneficiary | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    telefone: "",
    apelido: "",
    nacionalidade: "Brasileira",
    naturalidade: "",
    estadoCivil: "" as MaritalStatus | "",
    dataNascimento: "",
    profissao: "",
    rg: "",
    escolaridade: "",
    endereco: "",
    dependentes: 0,
    conjugeNome: "",
    conjugeRg: "",
    conjugeCpf: "",
    references: [
      { ordem: 1, nome: "", telefone: "" },
      { ordem: 2, nome: "", telefone: "" },
    ],
  });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const openNewModal = () => {
    setSelectedBen(null);
    setFormData({
      nome: "",
      cpf: "",
      telefone: "",
      apelido: "",
      nacionalidade: "",
      naturalidade: "",
      estadoCivil: "",
      dataNascimento: "",
      profissao: "",
      rg: "",
      escolaridade: "",
      endereco: "",
      dependentes: 0,
      conjugeNome: "",
      conjugeRg: "",
      conjugeCpf: "",
      references: [
        { ordem: 1, nome: "", telefone: "" },
        { ordem: 2, nome: "", telefone: "" },
      ],
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (b: Beneficiary) => {
    setSelectedBen(b);
    setFormData({
      nome: b.nome || "",
      cpf: formatCPF(b.cpf),
      telefone: formatPhone(b.telefone),
      apelido: b.apelido || "",
      nacionalidade: b.nacionalidade || "",
      naturalidade: b.naturalidade || "",
      estadoCivil: (b.estadoCivil as MaritalStatus) || "",
      dataNascimento: b.dataNascimento || "",
      profissao: b.profissao || "",
      rg: b.rg || "",
      escolaridade: b.escolaridade || "",
      endereco: b.endereco || "",
      dependentes: b.dependentes || 0,
      conjugeNome: b.conjugeNome || "",
      conjugeRg: b.conjugeRg || "",
      conjugeCpf: b.conjugeCpf ? formatCPF(b.conjugeCpf) : "",
      references: b.references && b.references.length > 0
        ? b.references.map((r, i) => ({ ordem: i + 1, nome: r.nome, telefone: formatPhone(r.telefone) }))
        : [
            { ordem: 1, nome: "", telefone: "" },
            { ordem: 2, nome: "", telefone: "" },
          ],
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const cleanCpf = formData.cpf.replace(/\D/g, "");
    if (cleanCpf && !validateCPF(cleanCpf)) {
      setFormError("CPF do beneficiário inválido pelo algoritmo oficial.");
      return;
    }

    if (formData.estadoCivil === "CASADO" || formData.estadoCivil === "UNIAO_ESTAVEL") {
      if (formData.conjugeCpf) {
        const cleanConjCpf = formData.conjugeCpf.replace(/\D/g, "");
        if (!validateCPF(cleanConjCpf)) {
          setFormError("CPF do cônjuge inválido.");
          return;
        }
        if (cleanConjCpf === cleanCpf) {
          setFormError("O CPF do cônjuge não pode ser igual ao do beneficiário titular.");
          return;
        }
      }
    }

    try {
      setSaving(true);
      await onSave({
        id: selectedBen?.id,
        ...formData,
        cpf: cleanCpf,
        telefone: formData.telefone.replace(/\D/g, ""),
        conjugeCpf: formData.conjugeCpf ? formData.conjugeCpf.replace(/\D/g, "") : undefined,
        references: formData.references.filter((r) => r.nome.trim().length > 0),
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Erro ao salvar beneficiário");
    } finally {
      setSaving(false);
    }
  };

  const filtered = beneficiaries.filter(
    (b) =>
      b.nome.toLowerCase().includes(search.toLowerCase()) ||
      b.cpf.includes(search) ||
      (b.apelido && b.apelido.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Beneficiários Rurais (PF)</h2>
          <p className="text-xs text-slate-500">
            Cadastro de produtores, agricultura familiar e pecuaristas em Roraima
          </p>
        </div>
        {canEdit && (
          <AppButton
            onClick={openNewModal}
            className="bg-[#386a20] hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-lg text-sm shadow-xs transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Beneficiário
          </AppButton>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-surface p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />
        <AppTextField
          type="text"
          placeholder="Buscar por nome, CPF ou apelido..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm outline-hidden text-slate-800 placeholder-slate-400"
        />
      </div>

      {/* Table */}
      <div className="bg-surface rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-100 font-semibold">
              <tr>
                <th className="px-6 py-3">Produtor / Nome</th>
                <th className="px-6 py-3">CPF</th>
                <th className="px-6 py-3">Telefone</th>
                <th className="px-6 py-3">Estado Civil</th>
                <th className="px-6 py-3">Propriedades</th>
                <th className="px-6 py-3">Completude</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400 text-sm">
                    Nenhum beneficiário encontrado com os filtros informados.
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-slate-900">{b.nome}</div>
                      {b.apelido && <div className="text-xs text-slate-400">"{b.apelido}"</div>}
                    </td>
                  <td className="px-6 py-3.5 font-mono text-xs font-medium text-slate-800">
                      {b.cpf ? formatCPF(b.cpf) : "Não informado"}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-600">
                      {b.telefone ? formatPhone(b.telefone) : "Não informado"}
                    </td>
                    <td className="px-6 py-3.5 text-xs">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[11px]">
                        {b.estadoCivil || "SOLTEIRO"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs font-semibold">
                      {b.totalPropriedades || 0} vinculada(s)
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              (b.percentualCompletude || 0) === 100
                                ? "bg-emerald-500"
                                : "bg-amber-500"
                            }`}
                            style={{ width: `${b.percentualCompletude || 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold" title={b.pendencias?.join("\n")}>{b.percentualCompletude || 0}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <AppButton
                        onClick={() => openEditModal(b)}
                        className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-2.5 py-1 rounded border border-blue-200"
                      >
                        Editar
                      </AppButton>
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
        title={selectedBen ? "Editar Beneficiário" : "Novo Beneficiário"}
        subtitle="Salve o rascunho agora e acompanhe as pendências até a habilitação final"
        maxWidth="4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {formError}
            </div>
          )}

          {/* Section 1: Dados Pessoais */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              1. Identificação do Titular
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Nome Completo *</label>
                <AppTextField
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md outline-hidden focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Apelido</label>
                <AppTextField
                  type="text"
                  value={formData.apelido}
                  onChange={(e) => setFormData({ ...formData, apelido: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md outline-hidden focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">CPF (11 dígitos) *</label>
                <AppTextField
                  type="text"
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md outline-hidden focus:border-blue-600 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Telefone / WhatsApp *</label>
                <AppTextField
                  type="text"
                  placeholder="(95) 99999-9999"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md outline-hidden focus:border-blue-600 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Estado Civil *</label>
                <AppSelect
                  value={formData.estadoCivil}
                  onChange={(e) => setFormData({ ...formData, estadoCivil: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md outline-hidden focus:border-blue-600 bg-surface"
                >
                  <option value="">Selecione</option>
                  <option value="SOLTEIRO">Solteiro(a)</option>
                  <option value="CASADO">Casado(a)</option>
                  <option value="UNIAO_ESTAVEL">União Estável</option>
                  <option value="DIVORCIADO">Divorciado(a)</option>
                  <option value="SEPARADO">Separado(a)</option>
                  <option value="VIUVO">Viúvo(a)</option>
                </AppSelect>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Data de Nascimento</label>
                <AppTextField
                  type="date"
                  value={formData.dataNascimento}
                  onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md outline-hidden focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nacionalidade</label>
                <AppTextField
                  type="text"
                  value={formData.nacionalidade}
                  onChange={(e) => setFormData({ ...formData, nacionalidade: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md outline-hidden focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Naturalidade</label>
                <AppTextField
                  type="text"
                  value={formData.naturalidade}
                  onChange={(e) => setFormData({ ...formData, naturalidade: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md outline-hidden focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">RG / Órgão Emissor</label>
                <AppTextField
                  type="text"
                  value={formData.rg}
                  onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md outline-hidden focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Profissão / Ocupação</label>
                <AppTextField
                  type="text"
                  value={formData.profissao}
                  onChange={(e) => setFormData({ ...formData, profissao: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md outline-hidden focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Escolaridade</label>
                <AppSelect
                  value={formData.escolaridade}
                  onChange={(e) => setFormData({ ...formData, escolaridade: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-surface"
                >
                  <option value="">Selecione</option>
                  <option value="NAO_ALFABETIZADO">Não alfabetizado</option>
                  <option value="ALFABETIZADO">Alfabetizado</option>
                  <option value="FUNDAMENTAL_INCOMPLETO">Fundamental incompleto</option>
                  <option value="FUNDAMENTAL_COMPLETO">Fundamental completo</option>
                  <option value="MEDIO_INCOMPLETO">Médio incompleto</option>
                  <option value="MEDIO_COMPLETO">Médio completo</option>
                  <option value="TECNICO">Técnico</option>
                  <option value="SUPERIOR_INCOMPLETO">Superior incompleto</option>
                  <option value="SUPERIOR_COMPLETO">Superior completo</option>
                  <option value="POS_GRADUACAO">Pós-graduação</option>
                </AppSelect>
              </div>
              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Endereço Residencial</label>
                <AppTextField
                  type="text"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md outline-hidden focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Dependentes</label>
                <AppTextField
                  type="number"
                  min="0"
                  value={formData.dependentes}
                  onChange={(e) => setFormData({ ...formData, dependentes: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md outline-hidden focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Cônjuge (Condicional) */}
          {(formData.estadoCivil === "CASADO" || formData.estadoCivil === "UNIAO_ESTAVEL") && (
            <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200">
              <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-3">
                2. Dados do Cônjuge / Companheiro(a) (Obrigatório)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nome do Cônjuge</label>
                  <AppTextField
                    type="text"
                    value={formData.conjugeNome}
                    onChange={(e) => setFormData({ ...formData, conjugeNome: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md outline-hidden focus:border-blue-600 bg-surface"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">CPF do Cônjuge</label>
                  <AppTextField
                    type="text"
                    placeholder="000.000.000-00"
                    value={formData.conjugeCpf}
                    onChange={(e) => setFormData({ ...formData, conjugeCpf: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md outline-hidden focus:border-blue-600 bg-surface font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">RG do Cônjuge</label>
                  <AppTextField
                    type="text"
                    value={formData.conjugeRg}
                    onChange={(e) => setFormData({ ...formData, conjugeRg: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-surface"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Referências */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              3. Referências Pessoais / Comerciais
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {formData.references.map((ref, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-600">Referência {idx + 1}</span>
                  <AppTextField
                    type="text"
                    placeholder="Nome da referência"
                    value={ref.nome}
                    onChange={(e) => {
                      const copy = [...formData.references];
                      copy[idx].nome = e.target.value;
                      setFormData({ ...formData, references: copy });
                    }}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-surface"
                  />
                  <AppTextField
                    type="text"
                    placeholder="Telefone / Contato"
                    value={ref.telefone}
                    onChange={(e) => {
                      const copy = [...formData.references];
                      copy[idx].telefone = e.target.value;
                      setFormData({ ...formData, references: copy });
                    }}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-surface font-mono"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <AppButton
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs hover:bg-slate-50"
            >
              Cancelar
            </AppButton>
            <AppButton
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-[#386a20] hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar rascunho"}
            </AppButton>
          </div>
        </form>
      </Modal>
    </div>
  );
};
