import React from "react";
import { List, ListItemButton, ListItemIcon, ListItemText, Paper } from "@mui/material";
import DashboardRounded from "@mui/icons-material/DashboardRounded";
import DescriptionRounded from "@mui/icons-material/DescriptionRounded";
import GroupsRounded from "@mui/icons-material/GroupsRounded";
import AgricultureRounded from "@mui/icons-material/AgricultureRounded";
import CreditCardRounded from "@mui/icons-material/CreditCardRounded";
import FolderRounded from "@mui/icons-material/FolderRounded";
import HistoryRounded from "@mui/icons-material/HistoryRounded";
import SettingsRounded from "@mui/icons-material/SettingsRounded";

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
  const navItems = [
    { id: "dashboard" as const, label: "Visão geral", icon: DashboardRounded },
    { id: "processos" as const, label: `Processos${proposalCount ? ` · ${proposalCount}` : ""}`, icon: DescriptionRounded },
    { id: "beneficiarios" as const, label: "Beneficiários", icon: GroupsRounded },
    { id: "propriedades" as const, label: "Propriedades", icon: AgricultureRounded },
    { id: "linhas-credito" as const, label: "Linhas de crédito", icon: CreditCardRounded },
    { id: "documentos" as const, label: "Documentos e IA", icon: FolderRounded },
    { id: "auditoria" as const, label: "Auditoria", icon: HistoryRounded },
    { id: "configuracoes" as const, label: "Configurações", icon: SettingsRounded },
  ];

  return (
    <aside id="main-navigation" aria-label="Navegação principal" className="md3-navigation">
      <Paper elevation={0} square className="md3-navigation-surface">
        <List className="md3-navigation-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <ListItemButton
                key={item.id}
                selected={currentTab === item.id}
                onClick={() => onSelectTab(item.id)}
                className="md3-navigation-item"
              >
                <ListItemIcon><Icon /></ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            );
          })}
        </List>
      </Paper>
    </aside>
  );
};
