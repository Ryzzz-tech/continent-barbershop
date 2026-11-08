import "server-only";

import { jwtVerify, SignJWT, type JWTPayload } from "jose";

export const accountRoles = ["owner", "kasir", "kapster", "pelanggan"] as const;
export type AccountRole = (typeof accountRoles)[number];

export type AuthenticatedAccount = {
  accountId: string;
  email: string;
  role: AccountRole;
  profileId: string;
};

const sessionIssuer = "continent-barbershop";
const sessionAudience = "continent-barbershop-web";

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("SESSION_SECRET harus dikonfigurasi dengan minimal 32 byte.");
  }

  return new TextEncoder().encode(secret);
}

function isAccountRole(value: unknown): value is AccountRole {
  return accountRoles.some((role) => role === value);
}

export async function signSessionToken(account: AuthenticatedAccount, sessionVersion: number) {
  return new SignJWT({
    email: account.email,
    role: account.role,
    profileId: account.profileId,
    sessionVersion,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(account.accountId)
    .setIssuer(sessionIssuer)
    .setAudience(sessionAudience)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSessionSecret());
}

export async function verifySessionToken(token: string): Promise<(AuthenticatedAccount & { sessionVersion: number }) | null> {
  const secret = getSessionSecret();
  let payload: JWTPayload;

  try {
    ({ payload } = await jwtVerify(token, secret, {
      issuer: sessionIssuer,
      audience: sessionAudience,
    }));
  } catch {
    return null;
  }

  if (
    typeof payload.sub !== "string" ||
    typeof payload.email !== "string" ||
    !isAccountRole(payload.role) ||
    typeof payload.profileId !== "string" ||
    typeof payload.sessionVersion !== "number" ||
    !Number.isSafeInteger(payload.sessionVersion) ||
    payload.sessionVersion < 0
  ) {
    return null;
  }

  return {
    accountId: payload.sub,
    email: payload.email,
    role: payload.role,
    profileId: payload.profileId,
    sessionVersion: payload.sessionVersion,
  };
}
