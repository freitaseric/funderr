import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { User, UserRole } from "../../domain/types";
import { fetchApi } from "../api";
import { firebaseAuth, firebaseConfigReady } from "../lib/firebase";

interface Credentials {
  email: string;
  password: string;
}

interface BootstrapData extends Credentials {
  name: string;
}

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
  login: (credentials: Credentials) => Promise<void>;
  bootstrap: (data: BootstrapData) => Promise<void>;
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
    if (!firebaseAuth.currentUser) {
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

  const login = async (credentials: Credentials) => {
    if (!firebaseConfigReady) throw new Error("A configuração web do Firebase não foi informada");
    await signInWithEmailAndPassword(firebaseAuth, credentials.email, credentials.password);
    await loadApplicationUser();
  };

  const bootstrap = async (data: BootstrapData) => {
    if (!firebaseConfigReady) throw new Error("A configuração web do Firebase não foi informada");
    if (!bootstrapEnabled) {
      throw new Error("Defina FUNDERR_BOOTSTRAP_EMAIL no servidor antes da configuração inicial");
    }

    const credential = await createUserWithEmailAndPassword(firebaseAuth, data.email, data.password);
    try {
      await updateProfile(credential.user, { displayName: data.name });
      await credential.user.getIdToken(true);
      const response = await fetchApi<{ user: User }>("/api/auth/bootstrap", {
        method: "POST",
        body: JSON.stringify({ name: data.name }),
      });
      await credential.user.getIdToken(true);
      setUser(response.user);
      setSetupRequired(false);
    } catch (error) {
      await credential.user.delete().catch(() => undefined);
      throw error;
    }
  };

  const logout = async () => {
    await fetchApi<null>("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    await signOut(firebaseAuth);
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
        login,
        bootstrap,
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
