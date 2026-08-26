import crypto from "crypto";
import { db } from "../db/database";
import { User, UserRole, UserStatus } from "../../domain/types";

export class AuthService {
  static getCurrentUser(reqHeaders: Record<string, string | string[] | undefined>): User {
    // In preview/dev mode, read user header or default to active admin
    const emailHeader = reqHeaders["x-user-email"];
    const roleHeader = reqHeaders["x-user-role"] as UserRole | undefined;

    const email = typeof emailHeader === "string" ? emailHeader : "admin@funderr.rr.gov.br";
    let user = db.getRawData().users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      user = {
        id: `usr-${crypto.randomUUID()}`,
        email,
        name: email.split("@")[0].toUpperCase(),
        role: roleHeader || "ADMIN",
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.getRawData().users.push(user);
      db.save();
    }

    if (roleHeader && user.role !== roleHeader) {
      user.role = roleHeader;
      user.updatedAt = new Date().toISOString();
      db.save();
    }

    return user;
  }

  static listUsers(): User[] {
    return db.getRawData().users;
  }

  static updateUserRole(
    userId: string,
    role: UserRole,
    status: UserStatus,
    actor: User
  ): User {
    if (actor.role !== "ADMIN") {
      throw new Error("Apenas administradores podem alterar papéis de usuários");
    }

    const user = db.getRawData().users.find((u) => u.id === userId);
    if (!user) throw new Error("Usuário não encontrado");

    const before = { ...user };
    user.role = role;
    user.status = status;
    user.updatedAt = new Date().toISOString();
    db.save();

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

    return user;
  }
}
