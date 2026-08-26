import React, { useState, useEffect } from "react";
import { RemoteConfigFlags, User, UserRole } from "../../domain/types";
import { useAuth } from "../context/AuthContext";
import { fetchApi } from "../api";
import { Settings, Shield, ToggleLeft, ToggleRight, Server, Database, Sparkles, Check, AlertCircle } from "lucide-react";

export const ConfiguracoesView: React.FC = () => {
  const { user, role, isAdmin } = useAuth();
  const [flags, setFlags] = useState<RemoteConfigFlags | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadData = async () => {
    try {
      const configRes = await fetchApi<{ config: RemoteConfigFlags }>("/api/remote-config", {}, role);
      setFlags(configRes.config);

      const usersRes = await fetchApi<{ users: User[] }>("/api/users", {}, role);
      setUsers(usersRes.users);
    } catch (err: any) {
      console.error("Config load error:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, [role]);

  const handleToggleFlag = async (key: keyof RemoteConfigFlags) => {
    if (!flags || !isAdmin) return;
    try {
      setSaving(true);
      const updated = { ...flags, [key]: !flags[key] };
      const res = await fetchApi<{ config: RemoteConfigFlags }>(
        "/api/remote-config",
        {
          method: "POST",
          body: JSON.stringify(updated),
        },
        role
      );
      setFlags(res.config);
      setMessage("Configuração atualizada com sucesso.");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setMessage(`Erro: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUserRole = async (targetUserId: string, newRole: UserRole, status: "ACTIVE" | "PENDING" | "DISABLED") => {
    if (!isAdmin) return;
    try {
      setSaving(true);
      await fetchApi(
        `/api/users/${targetUserId}/role`,
        {
          method: "PATCH",
          body: JSON.stringify({ role: newRole, status }),
        },
        role
      );
      loadData();
      setMessage("Papel do usuário atualizado com sucesso.");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setMessage(`Erro: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Configurações do Sistema & Governança
        </h2>
        <p className="text-xs text-slate-500">
          Gerenciamento de feature flags, controle de acesso RBAC e arquitetura FUNDERR v0.10.2
        </p>
      </div>

      {message && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-blue-600" />
          {message}
        </div>
      )}

      {/* Feature Flags / Remote Config */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#1351b4]" />
            <h3 className="text-base font-bold text-slate-900">
              Firebase Remote Config / Feature Flags
            </h3>
          </div>
          {!isAdmin && (
            <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              Somente Administradores podem alternar flags
            </span>
          )}
        </div>

        {flags && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Extração Document AI & Gemini</h4>
                <p className="text-[11px] text-slate-500">
                  Habilita digitalização inteligente de CAF/DAP, CAR e orçamentos
                </p>
              </div>
              <button
                disabled={!isAdmin || saving}
                onClick={() => handleToggleFlag("enableDocumentAIExtraction")}
                className="text-2xl text-[#1351b4] disabled:opacity-40"
              >
                {flags.enableDocumentAIExtraction ? (
                  <ToggleRight className="w-8 h-8 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-400" />
                )}
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Auditoria Estrita de Cascata</h4>
                <p className="text-[11px] text-slate-500">
                  Transição automática para EM_REVISAO quando há mutações a montante
                </p>
              </div>
              <button
                disabled={!isAdmin || saving}
                onClick={() => handleToggleFlag("enforceStrictValidation")}
                className="text-2xl text-[#1351b4] disabled:opacity-40"
              >
                {flags.enforceStrictValidation ? (
                  <ToggleRight className="w-8 h-8 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-400" />
                )}
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Persistência Relacional SQL</h4>
                <p className="text-[11px] text-slate-500">
                  Sincronização com Cloud SQL PostgreSQL e Firebase SQL Connect
                </p>
              </div>
              <button
                disabled={!isAdmin || saving}
                onClick={() => handleToggleFlag("enableRelationalSync")}
                className="text-2xl text-[#1351b4] disabled:opacity-40"
              >
                {flags.enableRelationalSync ? (
                  <ToggleRight className="w-8 h-8 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-400" />
                )}
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Modo Offline Local</h4>
                <p className="text-[11px] text-slate-500">
                  Permite coleta técnica e cálculo SAC em áreas remotas de Roraima sem sinal
                </p>
              </div>
              <button
                disabled={!isAdmin || saving}
                onClick={() => handleToggleFlag("offlineMode")}
                className="text-2xl text-[#1351b4] disabled:opacity-40"
              >
                {flags.offlineMode ? (
                  <ToggleRight className="w-8 h-8 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-400" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Management & RBAC */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#1351b4]" />
            <h3 className="text-base font-bold text-slate-900">
              Controle de Acesso Baseado em Papéis (RBAC)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {users.length} usuários registrados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 font-semibold text-slate-600 border-b">
              <tr>
                <th className="px-4 py-2.5">Nome / Identificação</th>
                <th className="px-4 py-2.5">E-mail</th>
                <th className="px-4 py-2.5">Papel Atual</th>
                <th className="px-4 py-2.5">Status</th>
                {isAdmin && <th className="px-4 py-2.5 text-right">Alterar Papel</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-bold text-slate-900">{u.name}</td>
                  <td className="px-4 py-2.5 text-slate-600 font-mono">{u.email}</td>
                  <td className="px-4 py-2.5">
                    <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded text-[11px]">
                      {u.role || "Sem Papel"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        u.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-800"
                          : u.status === "PENDING"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-2.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <select
                          value={u.role || ""}
                          onChange={(e) =>
                            handleUpdateUserRole(
                              u.id,
                              e.target.value as UserRole,
                              e.target.value === "PENDING" ? "PENDING" : "ACTIVE"
                            )
                          }
                          className="px-2 py-1 border rounded text-xs bg-white"
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="GESTOR">GESTOR</option>
                          <option value="TECNICO">TECNICO</option>
                          <option value="CONSULTA">CONSULTA</option>
                          <option value="PENDING">PENDING</option>
                        </select>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Target Architecture Specifications */}
      <div className="bg-slate-900 text-slate-200 p-6 rounded-2xl border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-400" />
          Especificações da Arquitetura FUNDERR v0.10.2
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
            <span className="text-slate-400 font-semibold block">Frontend</span>
            <span className="font-bold text-white">React + TypeScript + GovBR-DS</span>
          </div>
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
            <span className="text-slate-400 font-semibold block">Backend</span>
            <span className="font-bold text-white">Node.js + Fastify / Cloud Run</span>
          </div>
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
            <span className="text-slate-400 font-semibold block">Dados & Persistência</span>
            <span className="font-bold text-white">Cloud SQL PostgreSQL + SQL Connect</span>
          </div>
        </div>
      </div>
    </div>
  );
};
