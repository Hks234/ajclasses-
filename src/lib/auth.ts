import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { all, insert, one, run } from "./db";
import { authSecret } from "./secrets";
import { id, now, randomToken, sha256 } from "./utils";

const COOKIE = "aj_session";
const DAY = 60 * 60 * 24;

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  role: "student" | "admin";
  status: string;
  emailVerified: boolean;
  mustChangePassword: boolean;
  avatarUrl: string;
  mobile: string;
  adminRole: string;
  permissions: string[];
  csrf: string;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function checkPassword(password: string, hash: string) {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string, meta: { ip?: string; userAgent?: string }) {
  const token = randomToken(32);
  const csrf = randomToken(24);
  const expires = new Date(Date.now() + 14 * DAY * 1000).toISOString();
  await insert("sessions", {
    id: id(),
    user_id: userId,
    token_hash: sha256(token),
    csrf_token: csrf,
    expires_at: expires,
    ip: meta.ip || "",
    user_agent: (meta.userAgent || "").slice(0, 300),
    created_at: now(),
  });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 14 * DAY,
  });
  return { token, csrf };
}

export async function clearSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await run("DELETE FROM sessions WHERE token_hash = ?", [sha256(token)]);
  jar.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const row = await one<any>(
    `SELECT s.csrf_token, s.expires_at, u.id, u.email, u.full_name, u.role, u.status, u.email_verified, u.must_change_password, u.avatar_url, u.mobile, u.deleted_at
     FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?`,
    [sha256(token)],
  );
  if (!row || row.deleted_at) return null;
  if (row.expires_at < now()) {
    await run("DELETE FROM sessions WHERE token_hash = ?", [sha256(token)]);
    return null;
  }
  if (row.status === "suspended") return null;
  let adminRole = "";
  let permissions: string[] = [];
  if (row.role === "admin") {
    const admin = await one<any>("SELECT role_id FROM admin_users WHERE user_id = ?", [row.id]);
    adminRole = admin?.role_id || "";
    if (adminRole) {
      const rows = await all<any>("SELECT permission_id FROM role_permissions WHERE role_id = ?", [adminRole]);
      permissions = rows.map((item) => item.permission_id);
    }
  }
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    status: row.status,
    emailVerified: Boolean(row.email_verified),
    mustChangePassword: Boolean(row.must_change_password),
    avatarUrl: row.avatar_url || "",
    mobile: row.mobile || "",
    adminRole,
    permissions,
    csrf: row.csrf_token,
  };
}

export function can(session: SessionUser | null, permission: string) {
  if (!session || session.role !== "admin") return false;
  if (session.adminRole === "super_admin") return true;
  return session.permissions.includes(permission);
}

export async function requireAdmin(permission?: string) {
  const session = await getSession();
  if (!session || session.role !== "admin") return { session: null, status: 401 as const };
  if (permission && !can(session, permission)) return { session, status: 403 as const };
  return { session, status: 200 as const };
}

export function signValue(value: string) {
  return sha256(`${value}.${authSecret()}`);
}

export async function recordLogin(email: string, ip: string, success: boolean) {
  await insert("login_attempts", { id: id(), email: email.toLowerCase(), ip, success: success ? 1 : 0, created_at: now() });
}

export async function loginBlocked(email: string) {
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const row = await one<any>("SELECT COUNT(*) AS c FROM login_attempts WHERE email = ? AND success = 0 AND created_at > ?", [email.toLowerCase(), since]);
  return Number(row?.c || 0) >= 8;
}
