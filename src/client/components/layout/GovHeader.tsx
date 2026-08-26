import React from "react";
import { useAuth } from "../../context/AuthContext";
import { UserRole } from "../../../domain/types";
import { Shield, UserCheck, Bell, Sparkles } from "lucide-react";

export const GovHeader: React.FC = () => {
  const { user, role, setRole, isPending } = useAuth();

  return (
    <header className="bg-[#071d41] text-white border-b-4 border-[#1351b4] sticky top-0 z-40 shadow-md">
      {/* Official gov.br top bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between border-b border-blue-900/60 text-xs">
        <div className="flex items-center space-x-3">
          <span className="font-bold tracking-wider text-amber-300">BRASIL</span>
          <span className="text-blue-200">|</span>
          <span className="text-slate-200 font-medium">Governo do Estado de Roraima</span>
        </div>
        <div className="flex items-center space-x-4 text-blue-200">
          <span className="hidden sm:inline">Portal do Crédito Rural</span>
          <span>Transparência</span>
          <span>Acessibilidade</span>
        </div>
      </div>

      {/* Main FUNDERR Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-inner border border-blue-400/30">
            <span className="font-extrabold text-white text-lg tracking-tighter">F</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold tracking-tight text-white">FUNDERR</h1>
              <span className="bg-blue-600/60 text-blue-100 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-400/40">
                v0.10.2
              </span>
            </div>
            <p className="text-xs text-blue-200 font-normal">
              Fundo de Desenvolvimento Rural do Estado de Roraima
            </p>
          </div>
        </div>

        {/* User profile & Role switcher */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Quick Role Switcher (Simulação RBAC) */}
          <div className="flex items-center bg-blue-950/80 rounded-lg p-1 border border-blue-800/80 text-xs">
            <span className="text-[11px] text-blue-300 px-2 font-medium flex items-center gap-1">
              <Shield className="w-3 h-3 text-blue-400" /> Perfil:
            </span>
            {(["ADMIN", "GESTOR", "TECNICO", "CONSULTA", "PENDING"] as UserRole[]).map((r) => (
              <button
                key={r || "none"}
                onClick={() => setRole(r)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  role === r
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-blue-200 hover:text-white hover:bg-blue-900/50"
                }`}
              >
                {r || "Sem Papel"}
              </button>
            ))}
          </div>

          {/* User Status pill */}
          <div className="flex items-center gap-2 bg-blue-900/50 px-3 py-1.5 rounded-lg border border-blue-700/50 text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white truncate max-w-[140px]">
              {user?.name || "Operador"}
            </span>
            <span className="text-[10px] bg-blue-800/80 text-blue-200 px-1.5 py-0.5 rounded font-mono">
              {role}
            </span>
          </div>
        </div>
      </div>

      {isPending && (
        <div className="bg-amber-500 text-amber-950 px-4 py-1.5 text-center text-xs font-bold shadow-inner">
          ⚠️ Seu usuário está com status PENDING. Acesso operacional bloqueado até aprovação do Administrador.
        </div>
      )}
    </header>
  );
};
