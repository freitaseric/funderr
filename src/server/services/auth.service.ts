import crypto from "crypto";
import { DecodedIdToken } from "firebase-admin/auth";
import { User, UserRole, UserStatus } from "../../domain/types";
import { db } from "../db/database";
import { getFirebaseAdminAuth } from "../lib/firebase-admin";

const VALID_ROLES = new Set<Exclude<UserRole, null>>(["ADMIN", "GESTOR", "TECNICO", "CONSULTA"]);
const VALID_STATUSES = new Set<UserStatus>(["PENDING", "ACTIVE", "DISABLED"]);

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getBearerToken(headers: Record<string, string | string[] | undefined>): string {
  const authorization = headers.authorization;
  if (typeof authorization !== "string" || !authorization.startsWith("Bearer ")) {
    throw new Error("Token de autenticação do Firebase não informado");
  }
  const token = authorization.slice(7).trim();
  if (!token) throw new Error("Token de autenticação do Firebase não informado");
  return token;
}

function nameFromToken(token: DecodedIdToken): string {
  return token.name?.trim() || token.email?.split("@")[0] || "Usuário FUNDERR";
}

async function setAccessClaims(uid: string, role: UserRole, status: UserStatus): Promise<void> {
  const auth = getFirebaseAdminAuth();
  const firebaseUser = await auth.getUser(uid);
  await auth.setCustomUserClaims(uid, {
    ...firebaseUser.customClaims,
    role,
    status,
  });
}

export class AuthService {
  static getSetupStatus(): { setupRequired: boolean; bootstrapEnabled: boolean } {
    return {
      setupRequired: db.getRawData().users.length === 0,
      bootstrapEnabled: Boolean(process.env.FUNDERR_BOOTSTRAP_EMAIL),
    };
  }

  static async bootstrapAdmin(
    headers: Record<string, string | string[] | undefined>,
    name?: string
  ): Promise<User> {
    const token = await this.verifyToken(headers);
    const allowedEmail = normalizeEmail(process.env.FUNDERR_BOOTSTRAP_EMAIL || "");
    const tokenEmail = normalizeEmail(token.email || "");
    if (!allowedEmail) {
      throw new Error("Bootstrap desabilitado: configure FUNDERR_BOOTSTRAP_EMAIL no servidor");
    }
    if (!tokenEmail || tokenEmail !== allowedEmail) {
      throw new Error("Este e-mail não está autorizado a concluir a configuração inicial");
    }
    if (db.getRawData().users.length > 0) {
      throw new Error("A configuração inicial já foi concluída");
    }

    const now = new Date().toISOString();
    const user: User = {
      id: token.uid,
      email: tokenEmail,
      name: name?.trim() || nameFromToken(token),
      role: "ADMIN",
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    };

    await setAccessClaims(user.id, user.role, user.status);
    if (db.getRawData().users.length > 0) {
      throw new Error("A configuração inicial já foi concluída por outro usuário");
    }
    db.getRawData().users.push(user);
    db.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: "ADMIN",
      acao: "auth.bootstrap_completed",
      entidade: "User",
      entityId: user.id,
      correlationId: crypto.randomUUID(),
    });
    db.save();
    return user;
  }

  static async getCurrentUser(
    headers: Record<string, string | string[] | undefined>,
    provisionPending = true
  ): Promise<User> {
    const token = await this.verifyToken(headers);
    const raw = db.getRawData();
    let user = raw.users.find((item) => item.id === token.uid);

    if (!user && provisionPending) {
      const now = new Date().toISOString();
      user = {
        id: token.uid,
        email: normalizeEmail(token.email || ""),
        name: nameFromToken(token),
        role: null,
        status: "PENDING",
        createdAt: now,
        updatedAt: now,
      };
      raw.users.push(user);
      db.save();
    }
    if (!user) throw new Error("Usuário ainda não cadastrado no FUNDERR");

    const currentEmail = normalizeEmail(token.email || user.email);
    const currentName = nameFromToken(token);
    if (currentEmail !== user.email || (token.name && currentName !== user.name)) {
      user.email = currentEmail;
      user.name = currentName;
      user.updatedAt = new Date().toISOString();
      db.save();
    }
    return user;
  }

  static listUsers(): User[] {
    return db.getRawData().users;
  }

  static async createUser(
    data: { name: string; email: string; password: string; role: UserRole; status?: UserStatus },
    actor: User
  ): Promise<User> {
    if (actor.role !== "ADMIN") throw new Error("Apenas administradores podem criar usuários");
    if (data.name?.trim().length < 2) throw new Error("Nome deve ter pelo menos 2 caracteres");
    if (!/^\S+@\S+\.\S+$/.test(data.email || "")) throw new Error("E-mail inválido");
    if ((data.password || "").length < 10) throw new Error("A senha deve ter pelo menos 10 caracteres");
    if (!data.role || !VALID_ROLES.has(data.role)) throw new Error("Papel de usuário inválido");

    const auth = getFirebaseAdminAuth();
    const firebaseUser = await auth.createUser({
      email: normalizeEmail(data.email),
      password: data.password,
      displayName: data.name.trim(),
      disabled: data.status === "DISABLED",
    });

    const now = new Date().toISOString();
    const user: User = {
      id: firebaseUser.uid,
      email: normalizeEmail(data.email),
      name: data.name.trim(),
      role: data.role,
      status: data.status || "ACTIVE",
      createdAt: now,
      updatedAt: now,
    };

    try {
      await setAccessClaims(user.id, user.role, user.status);
      db.getRawData().users.push(user);
      db.logAudit({
        userId: actor.id,
        userName: actor.name,
        userRole: actor.role || undefined,
        acao: "user.created",
        entidade: "User",
        entityId: user.id,
        correlationId: crypto.randomUUID(),
        after: user,
      });
      db.save();
      return user;
    } catch (error) {
      await auth.deleteUser(firebaseUser.uid);
      throw error;
    }
  }

  static async updateUserRole(
    userId: string,
    role: UserRole,
    status: UserStatus,
    actor: User
  ): Promise<User> {
    if (actor.role !== "ADMIN") {
      throw new Error("Apenas administradores podem alterar papéis de usuários");
    }
    if (role !== null && !VALID_ROLES.has(role)) throw new Error("Papel de usuário inválido");
    if (!VALID_STATUSES.has(status)) throw new Error("Status de usuário inválido");

    const raw = db.getRawData();
    const user = raw.users.find((item) => item.id === userId);
    if (!user) throw new Error("Usuário não encontrado");

    const removingActiveAdmin =
      user.role === "ADMIN" &&
      user.status === "ACTIVE" &&
      (role !== "ADMIN" || status !== "ACTIVE");
    if (
      removingActiveAdmin &&
      !raw.users.some(
        (item) => item.id !== user.id && item.role === "ADMIN" && item.status === "ACTIVE"
      )
    ) {
      throw new Error("O sistema deve manter ao menos um administrador ativo");
    }

    const before = { ...user };
    await getFirebaseAdminAuth().updateUser(userId, { disabled: status === "DISABLED" });
    await setAccessClaims(userId, role, status);
    user.role = role;
    user.status = status;
    user.updatedAt = new Date().toISOString();
    db.logAudit({
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role || undefined,
      acao: "user.role_changed",
      entidade: "User",
      entityId: userId,
      correlationId: crypto.randomUUID(),
      before,
      after: user,
    });
    db.save();
    return user;
  }

  private static async verifyToken(
    headers: Record<string, string | string[] | undefined>
  ): Promise<DecodedIdToken> {
    const token = getBearerToken(headers);
    try {
      return await getFirebaseAdminAuth().verifyIdToken(token, true);
    } catch {
      throw new Error("Token de autenticação do Firebase inválido ou expirado");
    }
  }
}
