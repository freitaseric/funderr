import React, { FormEvent, useState } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const AuthView: React.FC = () => {
  const { setupRequired, bootstrapEnabled, firebaseConfigured, login, bootstrap } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (setupRequired) await bootstrap({ name, email, password });
      else await login({ email, password });
    } catch (err: any) {
      setError(err.message || "Não foi possível acessar o sistema");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <section className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-[#071d41] text-white p-6 border-b-4 border-[#1351b4]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center">
              {setupRequired ? <ShieldCheck className="w-6 h-6" /> : <LockKeyhole className="w-6 h-6" />}
            </div>
            <div>
              <h1 className="text-xl font-extrabold">FUNDERR</h1>
              <p className="text-xs text-blue-200">Crédito rural do Estado de Roraima</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <h2 className="font-bold text-slate-900">
              {setupRequired ? "Configuração inicial" : "Acesso ao sistema"}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {setupRequired
                ? "Cadastre o primeiro administrador. Nenhum dado demonstrativo será criado."
                : "Informe suas credenciais para iniciar uma sessão segura."}
            </p>
          </div>

          {error && <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">{error}</div>}

          {!firebaseConfigured && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
              Configure as variáveis VITE_FIREBASE_* para conectar este frontend ao projeto Firebase.
            </div>
          )}

          {setupRequired && !bootstrapEnabled && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
              Configure FUNDERR_BOOTSTRAP_EMAIL no servidor para autorizar o primeiro administrador.
            </div>
          )}

          {setupRequired && (
            <label className="block text-xs font-bold text-slate-700">
              Nome completo
              <input
                required
                minLength={2}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 w-full px-3 py-2.5 border border-slate-300 rounded-lg font-normal"
              />
            </label>
          )}

          <label className="block text-xs font-bold text-slate-700">
            E-mail
            <input
              required
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full px-3 py-2.5 border border-slate-300 rounded-lg font-normal"
            />
          </label>

          <label className="block text-xs font-bold text-slate-700">
            Senha
            <input
              required
              minLength={10}
              type="password"
              autoComplete={setupRequired ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full px-3 py-2.5 border border-slate-300 rounded-lg font-normal"
            />
          </label>

          <button
            type="submit"
            disabled={saving || !firebaseConfigured || (setupRequired && !bootstrapEnabled)}
            className="w-full bg-[#1351b4] hover:bg-blue-700 text-white font-bold rounded-lg py-2.5 text-sm disabled:opacity-50"
          >
            {saving ? "Processando..." : setupRequired ? "Criar administrador no Firebase" : "Entrar com Firebase"}
          </button>
        </form>
      </section>
    </main>
  );
};
