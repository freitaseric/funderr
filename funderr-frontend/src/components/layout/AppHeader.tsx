import React from "react";
import {
  AppBar,
  Avatar,
  Box,
  Chip,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import { useAuth } from "../../context/AuthContext";

export const AppHeader: React.FC = () => {
  const { user, role, logout } = useAuth();
  const displayName = user?.name || "Usuário";

  return (
    <AppBar position="sticky" color="inherit" elevation={0} className="md3-app-bar">
      <Toolbar className="md3-toolbar">
        <Box className="md3-brand-mark" aria-hidden="true">
          <Box component="img" src="/funderr_favicon.png" alt="" className="md3-brand-image" />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="h6" component="h1" noWrap sx={{ fontWeight: 600 }}>
            FUNDERR
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            Fundo de Desenvolvimento Rural de Roraima
          </Typography>
        </Box>

        <Chip label={role} size="small" color="secondary" variant="outlined" className="md3-role-chip" />
        <Tooltip title={`${displayName} · Sair`}>
          <IconButton onClick={() => void logout()} aria-label="Sair do sistema" color="primary">
            <Avatar className="md3-avatar">{displayName.trim().charAt(0).toUpperCase()}</Avatar>
            <LogoutRounded className="md3-logout-icon" />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
};
