import bcrypt from "bcryptjs";
import { getAuthenticatedAccount } from "@/lib/auth";
import {
  assertRole,
  BookingApiError,
  errorResponse,
  isRecord,
} from "@/lib/booking-api";
import { prisma } from "@/lib/prisma";

type EmployeeRole = "Kapster" | "Kasir";

function normalizePhone(value: string) {
  const compact = value.replace(/[\s()-]/g, "");

  if (compact.startsWith("+62")) return compact.slice(1);
  if (compact.startsWith("0")) return `62${compact.slice(1)}`;

  return compact;
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

function validateEmployeeInput(body: unknown) {
  if (
    !isRecord(body) ||
    typeof body.name !== "string" ||
    typeof body.role !== "string" ||
    !["Kapster", "Kasir"].includes(body.role) ||
    typeof body.phone !== "string" ||
    typeof body.username !== "string" ||
    typeof body.password !== "string"
  ) {
    throw new BookingApiError("Data karyawan tidak valid.", 400);
  }

  const name = body.name.trim();
  const phone = normalizePhone(body.phone);
  const email = body.username.trim().toLowerCase();
  const password = body.password;

  if (!name || name.length > 100) {
    throw new BookingApiError(
      "Nama wajib diisi dan maksimal 100 karakter.",
      400,
    );
  }

  if (!/^628\d{8,11}$/.test(phone) || phone.length > 13) {
    throw new BookingApiError(
      "Masukkan nomor HP Indonesia yang valid.",
      400,
    );
  }

  if (
    email.length > 100 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new BookingApiError("Username harus berupa email yang valid.", 400);
  }

  if (
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    throw new BookingApiError(
      "Password minimal 8 karakter dan maksimal 72 byte.",
      400,
    );
  }

  return {
    name,
    phone,
    email,
    password,
    role: body.role as EmployeeRole,
  };
}

export async function GET() {
  try {
    assertRole(await getAuthenticatedAccount(), ["owner"]);

    const [kapsters, cashiers] = await Promise.all([
      prisma.kapster.findMany({
        orderBy: { id_kapster: "asc" },
        include: {
          akun: {
            select: { is_active: true },
          },
        },
      }),
      prisma.kasir.findMany({
        orderBy: { id_kasir: "asc" },
        include: {
          akun: {
            select: { is_active: true },
          },
        },
      }),
    ]);

    const employees = [
      ...kapsters.map((item) => ({
        id: item.id_kapster,
        name: item.nama,
        role: "Kapster" as const,
        phone: item.no_hp,
        username: item.email,
        hasPassword: Boolean(item.akun),
        isActive: item.status === "Aktif" && (item.akun?.is_active ?? true),
        profileStatus: item.status,
      })),
      ...cashiers.map((item) => ({
        id: item.id_kasir,
        name: item.nama,
        role: "Kasir" as const,
        phone: item.no_hp,
        username: item.email,
        hasPassword: Boolean(item.akun),
        isActive: item.akun?.is_active ?? false,
        profileStatus: item.akun
          ? item.akun.is_active
            ? "Aktif"
            : "Nonaktif"
          : "Belum Ada Akun",
      })),
    ].sort((a, b) => a.id.localeCompare(b.id));

    return Response.json({
      success: true,
      employees,
    });
  } catch (error) {
    return errorResponse(error, "Load owner employees failed");
  }
}

export async function POST(request: Request) {
  try {
    assertRole(await getAuthenticatedAccount(), ["owner"]);

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      throw new BookingApiError("Format data karyawan tidak valid.", 400);
    }

    const input = validateEmployeeInput(body);
    const passwordHash = await bcrypt.hash(input.password, 12);

    const employee = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${"owner-employee:create"}))::text`;

      if (input.role === "Kapster") {
        const existing = await tx.kapster.findMany({
          select: { id_kapster: true },
        });

        const highest = existing.reduce((max, item) => {
          const match = /^K(\d{4})$/.exec(item.id_kapster);
          return match ? Math.max(max, Number(match[1])) : max;
        }, 0);

        if (highest >= 9999) {
          throw new BookingApiError("Kapasitas ID Kapster tercapai.", 503);
        }

        const id = `K${String(highest + 1).padStart(4, "0")}`;

        const profile = await tx.kapster.create({
          data: {
            id_kapster: id,
            nama: input.name,
            no_hp: input.phone,
            email: input.email,
            status: "Aktif",
          },
        });

        await tx.akun.create({
          data: {
            email: input.email,
            password_hash: passwordHash,
            role: "kapster",
            is_active: true,
            id_kapster: profile.id_kapster,
          },
        });

        return {
          id,
          name: profile.nama,
          role: input.role,
          phone: profile.no_hp,
          username: profile.email,
          hasPassword: true,
          isActive: true,
          profileStatus: profile.status,
        };
      }

      const existing = await tx.kasir.findMany({
        select: { id_kasir: true },
      });

      const highest = existing.reduce((max, item) => {
        const match = /^KS(\d{3})$/.exec(item.id_kasir);
        return match ? Math.max(max, Number(match[1])) : max;
      }, 0);

      if (highest >= 999) {
        throw new BookingApiError("Kapasitas ID Kasir tercapai.", 503);
      }

      const id = `KS${String(highest + 1).padStart(3, "0")}`;

      const profile = await tx.kasir.create({
        data: {
          id_kasir: id,
          nama: input.name,
          no_hp: input.phone,
          email: input.email,
        },
      });

      await tx.akun.create({
        data: {
          email: input.email,
          password_hash: passwordHash,
          role: "kasir",
          is_active: true,
          id_kasir: profile.id_kasir,
        },
      });

      return {
        id,
        name: profile.nama,
        role: input.role,
        phone: profile.no_hp,
        username: profile.email,
        hasPassword: true,
        isActive: true,
        profileStatus: "Aktif",
      };
    });

    return Response.json(
      {
        success: true,
        employee,
      },
      { status: 201 },
    );
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return Response.json(
        {
          success: false,
          message: "Email atau nomor HP sudah digunakan oleh karyawan lain.",
        },
        { status: 409 },
      );
    }

    return errorResponse(error, "Create owner employee failed");
  }
}
