import React, { createContext, useContext, useEffect, useState } from "react";
import { User, UserRole } from "../../domain/types";
import { fetchApi } from "../api";

interface AuthContextType {
  user: User | null;
  role: UserRole;
  setRole: (r: UserRole) => void;
  isAdmin: boolean;
  isGestor: boolean;
  isTecnico: boolean;
  isConsulta: boolean;
  isPending: boolean;
  canEdit: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRoleState] = useState<UserRole>("ADMIN");

  const loadUser = async () => {
    try {
      const data = await fetchApi<{ user: User }>("/api/auth/me", {}, role || undefined);
      setUser(data.user);
    } catch (err) {
      console.error("Error loading user:", err);
    }
  };

  useEffect(() => {
    loadUser();
  }, [role]);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
  };

  const isAdmin = role === "ADMIN";
  const isGestor = role === "GESTOR" || isAdmin;
  const isTecnico = role === "TECNICO" || isGestor;
  const isConsulta = role === "CONSULTA";
  const isPending = role === "PENDING" || role === null;
  const canEdit = !isPending && !isConsulta;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        setRole,
        isAdmin,
        isGestor,
        isTecnico,
        isConsulta,
        isPending,
        canEdit,
        refreshUser: loadUser,
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
