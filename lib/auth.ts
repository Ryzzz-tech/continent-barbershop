import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import {
  accountRoles,
  signSessionToken,
  verifySessionToken,
  type AccountRole,
  type AuthenticatedAccount,
} from "./session-token";

export { accountRoles };
export type { AccountRole, AuthenticatedAccount };

const sessionCookieName = "continent_session";
const sessionMaxAgeSeconds = 8 * 60 * 60;

export async function createSession(account: AuthenticatedAccount, sessionVersion: number) {
  const token = await signSessionToken(account, sessionVersion);
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionMaxAgeSeconds,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function readSessionToken() {
  return (await cookies()).get(sessionCookieName)?.value ?? null;
}

export async function getAuthenticatedAccount(
  token?: string | null,
): Promise<AuthenticatedAccount | null> {
  const sessionToken = token === undefined ? await readSessionToken() : token;
  if (!sessionToken) return null;

  const session = await verifySessionToken(sessionToken);
  if (!session) return null;

  const account = await prisma.akun.findUnique({
    where: { id_akun: session.accountId },
    select: {
      id_akun: true,
      email: true,
      role: true,
      is_active: true,
      session_version: true,
      id_owner: true,
      id_kasir: true,
      id_kapster: true,
      id_pelanggan: true,
    },
  });
  if (!account || !account.is_active || account.role !== session.role || account.email !== session.email || account.session_version !== session.sessionVersion) {
    return null;
  }

  const profileId =
    account.id_owner ??
    account.id_kasir ??
    account.id_kapster ??
    account.id_pelanggan;

  if (!profileId || profileId !== session.profileId) return null;

  return {
    accountId: account.id_akun,
    email: account.email,
    role: session.role,
    profileId,
  };
}

const dashboardByRole: Record<AccountRole, string> = {
  owner: "/owner",
  kasir: "/kasir",
  kapster: "/kapster",
  pelanggan: "/pelanggan",
};

export async function requireAccountRole(role: AccountRole) {
  const account = await getAuthenticatedAccount();
  if (!account) {
    redirect(role === "pelanggan" ? "/login" : "/karyawan/login");
  }
  if (account.role !== role) {
    redirect(dashboardByRole[account.role]);
  }
  return account;
}

export function dashboardForRole(role: AccountRole) {
  return dashboardByRole[role];
}
