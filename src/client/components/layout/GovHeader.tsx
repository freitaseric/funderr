import React from "react";
import { LogOut, Shield } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const GovHeader: React.FC = () => {
  const { user, role, logout } = useAuth();

  return (
    <header className="bg-[#071d41] text-white border-b-4 border-[#1351b4] sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between border-b border-blue-900/60 text-xs">
        <div className="flex items-center space-x-3">
          <span className="font-bold tracking-wider text-amber-300">BRASIL</span>
          <span className="text-blue-200">|</span>
          <span className="text-slate-200 font-medium">Governo do Estado de Roraima</span>
        </div>
        <div className="flex items-center space-x-4 text-blue-200">
          <span className="hidden sm:inline">Portal do Crédito Rural</span>
          <span>Acessibilidade</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center border border-blue-400/30">
            <span className="font-extrabold text-lg">F</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold tracking-tight">FUNDERR</h1>
              <span className="bg-blue-600/60 text-blue-100 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-400/40">
                v0.10.2
              </span>
            </div>
            <p className="text-xs text-blue-200">Fundo de Desenvolvimento Rural do Estado de Roraima</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-blue-900/50 px-3 py-1.5 rounded-lg border border-blue-700/50 text-xs">
            <Shield className="w-3.5 h-3.5 text-blue-300" />
            <span className="font-semibold truncate max-w-[180px]">{user?.name}</span>
            <span className="text-[10px] bg-blue-800/80 text-blue-100 px-1.5 py-0.5 rounded font-mono">
              {role}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="p-2 rounded-lg border border-blue-700 text-blue-100 hover:bg-blue-900"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
