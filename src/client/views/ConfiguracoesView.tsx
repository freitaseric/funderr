import React, { useEffect, useState } from "react";
import { Check, Shield, Sparkles, ToggleLeft, ToggleRight } from "lucide-react";
import { RemoteConfigFlags, User, UserRole, UserStatus } from "../../domain/types";
import { fetchApi } from "../api";
import { useAuth } from "../context/AuthContext";

const flagDescriptions: Record<keyof RemoteConfigFlags, { title: string; description: string }> = {
  documents_ai: {
    title: "Extração assistida de documentos",
    description: "Controla a futura integração de processamento documental.",
  },
  realtime_presence: {
    title: "Presença em tempo real",
    description: "Controla os recursos colaborativos baseados no Firebase.",
  },
  assistant: {
    title: "Assistente técnico",
    description: "Controla a disponibilidade do assistente de elaboração.",
  },
  advanced_maps: {
    title: "Google Maps avançado",
    description: "Controla mapas, busca de lugares e geocodificação.",
  },
  new_financing_ui: {
    title: "Nova interface de financiamento",
    description: "Controla a experiência revisada do módulo financeiro.",
  },
};

const assignableRoles: Exclude<UserRole, null>[] = ["ADMIN", "GESTOR", "TECNICO", "CONSULTA"];

export const ConfiguracoesView: React.FC = () => {
  const { isAdmin } = useAuth();
  const [flags, setFlags] = useState<RemoteConfigFlags | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadData = async () => {
    try {
      const configResponse = await fetchApi<{ config: RemoteConfigFlags }>("/api/remote-config");
      setFlags(configResponse.config);
      if (isAdmin) {
        const usersResponse = await fetchApi<{ users: User[] }>("/api/users");
        setUsers(usersResponse.users);
      }
    } catch (err: any) {
      setMessage(`Erro: ${err.message}`);
    }
  };

  useEffect(() => {
    void loadData();
  }, [isAdmin]);

  const handleToggleFlag = async (key: keyof RemoteConfigFlags) => {
    if (!flags || !isAdmin) return;
    try {
      setSaving(true);
      const response = await fetchApi<{ config: RemoteConfigFlags }>("/api/remote-config", {
        method: "POST",
        body: JSON.stringify({ [key]: !flags[key] }),
      });
      setFlags(response.config);
      setMessage("Configuração atualizada.");
    } catch (err: any) {
      setMessage(`Erro: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUser = async (target: User, changes: { role?: UserRole; status?: UserStatus }) => {
    if (!isAdmin) return;
    try {
      setSaving(true);
      await fetchApi(`/api/users/${target.id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: changes.role ?? target.role, status: changes.status ?? target.status }),
      });
      await loadData();
      setMessage("Acesso atualizado no FUNDERR e nas custom claims do Firebase.");
    } catch (err: any) {
      setMessage(`Erro: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Configurações e governança</h2>
        <p className="text-xs text-slate-500">Perfis do Firebase Authentication e sinalizadores funcionais</p>
      </div>

      {message && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4" /> {message}
        </div>
      )}

      <section className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <Sparkles className="w-5 h-5 text-[#1351b4]" />
          <h3 className="text-base font-bold">Sinalizadores funcionais</h3>
        </div>
        {flags && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.keys(flagDescriptions) as (keyof RemoteConfigFlags)[]).map((key) => (
              <div key={key} className="p-4 rounded-xl border flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{flagDescriptions[key].title}</h4>
                  <p className="text-[11px] text-slate-500">{flagDescriptions[key].description}</p>
                </div>
                <button disabled={!isAdmin || saving} onClick={() => void handleToggleFlag(key)} className="disabled:opacity-40" aria-label={`Alternar ${flagDescriptions[key].title}`}>
                  {flags[key] ? <ToggleRight className="w-8 h-8 text-emerald-600" /> : <ToggleLeft className="w-8 h-8 text-slate-400" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {isAdmin && (
        <section className="bg-white p-6 rounded-2xl border border-slate-200 space-y-5">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2"><Shield className="w-5 h-5 text-[#1351b4]" /><h3 className="text-base font-bold">Usuários e perfis</h3></div>
            <span className="text-xs text-slate-500 font-mono">{users.length} usuários</span>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
            Novos usuários entram primeiro com uma Conta Google e ficam pendentes. Um administrador atribui o papel e ativa o acesso nesta tabela.
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b"><tr><th className="px-4 py-2.5">Nome</th><th className="px-4 py-2.5">E-mail</th><th className="px-4 py-2.5">Papel</th><th className="px-4 py-2.5">Status</th></tr></thead>
              <tbody className="divide-y">
                {users.map((account) => (
                  <tr key={account.id}>
                    <td className="px-4 py-2.5 font-bold">{account.name}</td>
                    <td className="px-4 py-2.5 font-mono">{account.email}</td>
                    <td className="px-4 py-2.5"><select disabled={saving} value={account.role || ""} onChange={(event) => void handleUpdateUser(account, { role: event.target.value as UserRole })} className="px-2 py-1 border rounded">{account.role === null && <option value="">Sem papel</option>}{assignableRoles.map((role) => <option key={role}>{role}</option>)}</select></td>
                    <td className="px-4 py-2.5"><select disabled={saving} value={account.status} onChange={(event) => void handleUpdateUser(account, { status: event.target.value as UserStatus })} className="px-2 py-1 border rounded"><option value="ACTIVE">ACTIVE</option><option value="PENDING">PENDING</option><option value="DISABLED">DISABLED</option></select></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
