import React, { useState } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const AuthView: React.FC = () => {
  const { setupRequired, bootstrapEnabled, firebaseConfigured, loginWithGoogle } = useAuth();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleGoogleLogin = async () => {
    setError("");
    setSaving(true);
    try {
      await loginWithGoogle();
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

        <div className="p-6 space-y-4">
          <div>
            <h2 className="font-bold text-slate-900">
              {setupRequired ? "Configuração inicial" : "Acesso ao sistema"}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {setupRequired
                ? "Entre com a conta Google autorizada para criar o primeiro administrador."
                : "Use sua conta Google para iniciar uma sessão segura."}
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

          <button
            type="button"
            onClick={() => void handleGoogleLogin()}
            disabled={saving || !firebaseConfigured || (setupRequired && !bootstrapEnabled)}
            className="w-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold rounded-lg py-2.5 text-sm disabled:opacity-50 flex items-center justify-center gap-3"
          >
            <span className="text-lg font-black text-[#4285f4]">G</span>
            {saving ? "Conectando..." : setupRequired ? "Configurar com Google" : "Entrar com Google"}
          </button>
          <p className="text-[11px] text-center text-slate-500">
            O FUNDERR não recebe nem armazena sua senha da Conta Google.
          </p>
        </div>
      </section>
    </main>
  );
};
