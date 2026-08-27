import React, { createContext, useContext, useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { User, UserRole } from "../../domain/types";
import { fetchApi } from "../api";
import { firebaseAuth, firebaseConfigReady } from "../lib/firebase";

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
  setupRequired: boolean;
  bootstrapEnabled: boolean;
  firebaseConfigured: boolean;
  isAdmin: boolean;
  isGestor: boolean;
  isTecnico: boolean;
  isConsulta: boolean;
  isPending: boolean;
  canEdit: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [bootstrapEnabled, setBootstrapEnabled] = useState(false);

  const loadApplicationUser = async (): Promise<User> => {
    const data = await fetchApi<{ user: User }>("/api/auth/me");
    setUser(data.user);
    return data.user;
  };

  const refreshUser = async () => {
    if (!firebaseAuth?.currentUser) {
      setUser(null);
      return;
    }
    await firebaseAuth.currentUser.getIdToken(true);
    await loadApplicationUser();
  };

  useEffect(() => {
    let unsubscribe = () => {};
    let cancelled = false;

    const initialize = async () => {
      try {
        const status = await fetchApi<{ setupRequired: boolean; bootstrapEnabled: boolean }>(
          "/api/auth/status"
        );
        if (cancelled) return;
        setSetupRequired(status.setupRequired);
        setBootstrapEnabled(status.bootstrapEnabled);

        if (!firebaseAuth) {
          setUser(null);
          setLoading(false);
          return;
        }

        unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
          if (cancelled) return;
          try {
            if (!firebaseUser || status.setupRequired) setUser(null);
            else await loadApplicationUser();
          } catch {
            setUser(null);
          } finally {
            setLoading(false);
          }
        });
      } catch {
        if (!cancelled) setLoading(false);
      }
    };

    void initialize();
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    if (!firebaseConfigReady || !firebaseAuth) {
      throw new Error("A configuração web do Firebase não foi informada");
    }
    if (setupRequired && !bootstrapEnabled) {
      throw new Error("Defina FUNDERR_BOOTSTRAP_EMAIL no servidor antes da configuração inicial");
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await signInWithPopup(firebaseAuth, provider);

    if (setupRequired) {
      await firebaseAuth.currentUser?.getIdToken(true);
      const response = await fetchApi<{ user: User }>("/api/auth/bootstrap", {
        method: "POST",
      });
      await firebaseAuth.currentUser?.getIdToken(true);
      setUser(response.user);
      setSetupRequired(false);
      return;
    }

    await loadApplicationUser();
  };

  const logout = async () => {
    await fetchApi<null>("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    if (firebaseAuth) await signOut(firebaseAuth);
    setUser(null);
  };

  const role = user?.role ?? null;
  const isAdmin = role === "ADMIN";
  const isGestor = role === "GESTOR" || isAdmin;
  const isTecnico = role === "TECNICO" || isGestor;
  const isConsulta = role === "CONSULTA";
  const isPending = user?.status === "PENDING" || role === null;
  const canEdit = Boolean(user && user.status === "ACTIVE" && !isConsulta);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        setupRequired,
        bootstrapEnabled,
        firebaseConfigured: firebaseConfigReady,
        isAdmin,
        isGestor,
        isTecnico,
        isConsulta,
        isPending,
        canEdit,
        loginWithGoogle,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
