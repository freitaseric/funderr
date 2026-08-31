import React, { useState } from "react";
import { AppButton } from "../components/ui/AppButton";
import { LockKeyhole, ShieldCheck } from "../components/ui/icons";
import { useAuth } from "../context/AuthContext";
import { Alert, Box, Card, CardContent, Typography } from "@mui/material";

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
    <Box component="main" className="md3-auth-page">
      <Card className="md3-auth-card">
        <Box className="md3-auth-hero">
          <Box className="md3-auth-icon">
            {setupRequired ? <ShieldCheck /> : <LockKeyhole />}
          </Box>
          <Box>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>FUNDERR</Typography>
            <Typography variant="body2">Crédito rural do Estado de Roraima</Typography>
          </Box>
        </Box>

        <CardContent className="md3-auth-content">
          <Box>
            <Typography variant="h6" component="h2">
              {setupRequired ? "Configuração inicial" : "Acesso ao sistema"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {setupRequired
                ? "Entre com a conta Google autorizada para criar o primeiro administrador."
                : "Use sua conta Google para iniciar uma sessão segura."}
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}
          {!firebaseConfigured && <Alert severity="warning">Configure as variáveis VITE_FIREBASE_* para conectar este frontend ao projeto Firebase.</Alert>}
          {setupRequired && !bootstrapEnabled && <Alert severity="warning">Configure FUNDERR_BOOTSTRAP_EMAIL no servidor para autorizar o primeiro administrador.</Alert>}

          <AppButton
            type="button"
            onClick={() => void handleGoogleLogin()}
            disabled={saving || !firebaseConfigured || (setupRequired && !bootstrapEnabled)}
            variant="contained"
            className="w-full"
          >
            {saving ? "Conectando..." : setupRequired ? "Configurar com Google" : "Entrar com Google"}
          </AppButton>
          <Typography variant="caption" color="text.secondary" align="center">
            O FUNDERR não recebe nem armazena sua senha da Conta Google.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};
