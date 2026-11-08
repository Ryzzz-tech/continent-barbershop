import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  accountRoles,
  createSession,
  type AccountRole,
  type AuthenticatedAccount,
} from "@/lib/auth";

const authAccountSelect = {
  id_akun: true,
  email: true,
  password_hash: true,
  role: true,
  is_active: true,
  session_version: true,
  id_owner: true,
  id_kasir: true,
  id_kapster: true,
  id_pelanggan: true,
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAccountRole(value: unknown): value is AccountRole {
  return accountRoles.some((role) => role === value);
}

function phoneCandidates(value: string) {
  const compact = value.replace(/[\s()-]/g, "");
  if (compact.startsWith("+62")) {
    return [compact, `0${compact.slice(3)}`];
  }
  if (compact.startsWith("0")) {
    return [compact, `+62${compact.slice(1)}`];
  }
  return [compact];
}

async function findByPhone(phones: string[], role: AccountRole) {
  switch (role) {
    case "owner":
      return (await prisma.owner.findFirst({
        where: { no_hp: { in: phones } },
        select: { akun: { select: authAccountSelect } },
      }))?.akun ?? null;
    case "kasir":
      return (await prisma.kasir.findFirst({
        where: { no_hp: { in: phones } },
        select: { akun: { select: authAccountSelect } },
      }))?.akun ?? null;
    case "kapster":
      return (await prisma.kapster.findFirst({
        where: { no_hp: { in: phones } },
        select: { akun: { select: authAccountSelect } },
      }))?.akun ?? null;
    case "pelanggan":
      return (await prisma.pelanggan.findFirst({
        where: { no_hp: { in: phones } },
        select: { akun: { select: authAccountSelect } },
      }))?.akun ?? null;
  }
}

function getProfileId(account: {
  id_owner: string | null;
  id_kasir: string | null;
  id_kapster: string | null;
  id_pelanggan: string | null;
}) {
  return account.id_owner ?? account.id_kasir ?? account.id_kapster ?? account.id_pelanggan;
}

function unauthorized() {
  return Response.json(
    { success: false, message: "Email/nomor HP atau password salah." },
    { status: 401 },
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, message: "Format permintaan login tidak valid." },
      { status: 400 },
    );
  }

  if (
    !isObject(body) ||
    typeof body.identifier !== "string" ||
    typeof body.password !== "string" ||
    !isAccountRole(body.expectedRole)
  ) {
    return Response.json(
      { success: false, message: "Data login tidak valid." },
      { status: 400 },
    );
  }

  const identifier = body.identifier.trim();
  const password = body.password;
  const expectedRole = body.expectedRole;
  if (
    !identifier ||
    identifier.length > 100 ||
    !password ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return Response.json(
      { success: false, message: "Data login tidak valid." },
      { status: 400 },
    );
  }

  try {
    const account = identifier.includes("@")
      ? await prisma.akun.findUnique({
          where: { email: identifier.toLowerCase() },
          select: authAccountSelect,
        })
      : await findByPhone(phoneCandidates(identifier), expectedRole);

    if (
      !account ||
      !account.is_active ||
      account.role !== expectedRole ||
      !(await bcrypt.compare(password, account.password_hash))
    ) {
      return unauthorized();
    }

    const profileId = getProfileId(account);
    if (!profileId) {
      console.error("Authenticated account has no linked profile:", account.id_akun);
      return Response.json(
        { success: false, message: "Akun belum terhubung dengan profil." },
        { status: 500 },
      );
    }

    const authenticatedAccount: AuthenticatedAccount = {
      accountId: account.id_akun,
      email: account.email,
      role: expectedRole,
      profileId,
    };
    await createSession(authenticatedAccount, account.session_version);

    return Response.json({
      success: true,
      account: authenticatedAccount,
    });
  } catch (error) {
    console.error("Authentication request failed:", error);
    return Response.json(
      { success: false, message: "Login tidak dapat diproses saat ini." },
      { status: 500 },
    );
  }
}
