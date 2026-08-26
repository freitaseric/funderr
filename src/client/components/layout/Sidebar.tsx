import React from "react";
import {
  LayoutDashboard,
  Users,
  Home,
  FileSpreadsheet,
  CreditCard,
  FolderOpen,
  History,
  Settings,
  Sparkles,
} from "lucide-react";

export type NavTab =
  | "dashboard"
  | "beneficiarios"
  | "propriedades"
  | "processos"
  | "linhas-credito"
  | "documentos"
  | "auditoria"
  | "configuracoes";

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  proposalCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  proposalCount = 0,
}) => {
  const navItems: { id: NavTab; label: string; icon: any; count?: number; badge?: string }[] = [
    { id: "dashboard", label: "Painel Geral", icon: LayoutDashboard },
    { id: "processos", label: "Processos de Crédito", icon: FileSpreadsheet, count: proposalCount },
    { id: "beneficiarios", label: "Beneficiários (PF)", icon: Users },
    { id: "propriedades", label: "Propriedades Rurais", icon: Home },
    { id: "linhas-credito", label: "Linhas de Crédito", icon: CreditCard },
    { id: "documentos", label: "Documentos & IA", icon: FolderOpen, badge: "OCR" },
    { id: "auditoria", label: "Auditoria & Logs", icon: History },
    { id: "configuracoes", label: "Configurações", icon: Settings },
  ];

  return (
    <aside className="w-full lg:w-64 shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 p-4 lg:min-h-[calc(100vh-100px)]">
      <div className="mb-4 hidden lg:block">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3">
          Navegação Principal
        </h2>
      </div>
      <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-blue-50 text-[#1351b4] shadow-xs border border-blue-200/80 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-[#1351b4]" : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5 ml-2">
                {item.badge && (
                  <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" />
                    {item.badge}
                  </span>
                )}
                {item.count !== undefined && item.count > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                    {item.count}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
