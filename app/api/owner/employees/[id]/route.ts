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

function getEmployeeRole(id: string): EmployeeRole {
  if (/^K\d{4}$/.test(id)) return "Kapster";
  if (/^KS\d{3}$/.test(id)) return "Kasir";

  throw new BookingApiError("ID karyawan tidak valid.", 400);
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

function validateInput(body: unknown, role: EmployeeRole) {
  if (
    !isRecord(body) ||
    typeof body.name !== "string" ||
    body.role !== role ||
    typeof body.phone !== "string" ||
    typeof body.username !== "string" ||
    typeof body.password !== "string"
  ) {
    throw new BookingApiError(
      "Data karyawan tidak valid atau peran tidak sesuai profil.",
      400,
    );
  }

  const name = body.name.trim();
  const phone = normalizePhone(body.phone);
  const email = body.username.trim().toLowerCase();

  if (!name || name.length > 100) {
    throw new BookingApiError(
      "Nama wajib diisi dan maksimal 100 karakter.",
      400,
    );
  }

  if (!/^628\d{8,10}$/.test(phone) || phone.length > 13) {
    throw new BookingApiError("Nomor HP Indonesia tidak valid.", 400);
  }

  if (
    email.length > 100 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new BookingApiError("Username harus berupa email yang valid.", 400);
  }

  if (
    body.password &&
    (body.password.length < 8 ||
      Buffer.byteLength(body.password, "utf8") > 72)
  ) {
    throw new BookingApiError(
      "Password baru minimal 8 karakter dan maksimal 72 byte.",
      400,
    );
  }

  return {
    name,
    phone,
    email,
    password: body.password,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertRole(await getAuthenticatedAccount(), ["owner"]);

    const { id } = await params;
    const role = getEmployeeRole(id);

    if (role === "Kapster") {
      const employee = await prisma.kapster.findUnique({
        where: { id_kapster: id },
        include: {
          akun: {
            select: { is_active: true },
          },
        },
      });

      if (!employee) {
        throw new BookingApiError("Data Kapster tidak ditemukan.", 404);
      }

      return Response.json({
        success: true,
        employee: {
          id: employee.id_kapster,
          name: employee.nama,
          role,
          phone: employee.no_hp,
          username: employee.email,
          hasPassword: Boolean(employee.akun),
          isActive:
            employee.status === "Aktif" &&
            (employee.akun?.is_active ?? true),
          profileStatus: employee.status,
        },
      });
    }

    const employee = await prisma.kasir.findUnique({
      where: { id_kasir: id },
      include: {
        akun: {
          select: { is_active: true },
        },
      },
    });

    if (!employee) {
      throw new BookingApiError("Data Kasir tidak ditemukan.", 404);
    }

    return Response.json({
      success: true,
      employee: {
        id: employee.id_kasir,
        name: employee.nama,
        role,
        phone: employee.no_hp,
        username: employee.email,
        hasPassword: Boolean(employee.akun),
        isActive: employee.akun?.is_active ?? true,
        profileStatus: employee.akun
          ? employee.akun.is_active
            ? "Aktif"
            : "Nonaktif"
          : "Belum Ada Akun",
      },
    });
  } catch (error) {
    return errorResponse(error, "Load owner employee detail failed");
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertRole(await getAuthenticatedAccount(), ["owner"]);

    const { id } = await params;
    const role = getEmployeeRole(id);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new BookingApiError("Format data karyawan tidak valid.", 400);
    }

    const input = validateInput(body, role);
    const passwordHash = input.password
      ? await bcrypt.hash(input.password, 12)
      : null;

    const employee = await prisma.$transaction(async (tx) => {
      if (role === "Kapster") {
        const current = await tx.kapster.findUnique({
          where: { id_kapster: id },
          include: {
            akun: { select: { id_akun: true, is_active: true } },
          },
        });

        if (!current) {
          throw new BookingApiError("Data Kapster tidak ditemukan.", 404);
        }

        if (!current.akun && !passwordHash) {
          throw new BookingApiError(
            "Kapster ini belum memiliki akun. Masukkan password untuk membuat akun login.",
            400,
          );
        }

        const updated = await tx.kapster.update({
          where: { id_kapster: id },
          data: {
            nama: input.name,
            no_hp: input.phone,
            email: input.email,
            status: current.akun ? current.status : "Aktif",
          },
        });

        if (current.akun) {
          await tx.akun.update({
            where: { id_akun: current.akun.id_akun },
            data: {
              email: input.email,
              is_active: current.akun.is_active,
              session_version: { increment: 1 },
              ...(passwordHash ? { password_hash: passwordHash } : {}),
            },
          });
        } else {
          await tx.akun.create({
            data: {
              email: input.email,
              password_hash: passwordHash!,
              role: "kapster",
              is_active: true,
              id_kapster: id,
            },
          });
        }

        return {
          id: updated.id_kapster,
          name: updated.nama,
          role,
          phone: updated.no_hp,
          username: updated.email,
          hasPassword: true,
          isActive: true,
          profilestatus: current.akun ? current.status : "Aktif",
        };
      }

      const current = await tx.kasir.findUnique({
        where: { id_kasir: id },
        include: {
          akun: { select: { id_akun: true, is_active: true } },
        },
      });

      if (!current) {
        throw new BookingApiError("Data Kasir tidak ditemukan.", 404);
      }

      if (!current.akun && !passwordHash) {
        throw new BookingApiError(
          "Kasir ini belum memiliki akun. Masukkan password untuk membuat akun login.",
          400,
        );
      }

      const updated = await tx.kasir.update({
        where: { id_kasir: id },
        data: {
          nama: input.name,
          no_hp: input.phone,
          email: input.email,
        },
      });

      if (current.akun) {
        await tx.akun.update({
          where: { id_akun: current.akun.id_akun },
          data: {
            email: input.email,
            is_active: current.akun.is_active,
            session_version: { increment: 1 },
            ...(passwordHash ? { password_hash: passwordHash } : {}),
          },
        });
      } else {
        await tx.akun.create({
          data: {
            email: input.email,
            password_hash: passwordHash!,
            role: "kasir",
            is_active: true,
            id_kasir: id,
          },
        });
      }

      return {
        id: updated.id_kasir,
        name: updated.nama,
        role,
        phone: updated.no_hp,
        username: updated.email,
        hasPassword: true,
        isActive: current.akun ? current.akun.is_active : true,
        profileStatus: current.akun ? (current.akun.is_active ? "Aktif" : "Nonaktif") : "Aktif",
      };
    });

    return Response.json({
      success: true,
      employee,
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return Response.json(
        {
          success: false,
          message: "Email atau nomor HP sudah digunakan karyawan lain.",
        },
        { status: 409 },
      );
    }

    return errorResponse(error, "Update owner employee failed");
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertRole(await getAuthenticatedAccount(), ["owner"]);

    const { id } = await params;
    const role = getEmployeeRole(id);

    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`owner-employee:${id}`}))::text`;

      if (role === "Kapster") {
        const employee = await tx.kapster.findUnique({
          where: { id_kapster: id },
          include: {
            akun: { select: { id_akun: true } },
          },
        });

        if (!employee) {
          throw new BookingApiError("Data Kapster tidak ditemukan.", 404);
        }

        await tx.kapster.update({
          where: { id_kapster: id },
          data: { status: "Nonaktif" },
        });

        if (employee.akun) {
          await tx.akun.update({
            where: { id_akun: employee.akun.id_akun },
            data: { is_active: false, session_version: { increment: 1 } },
          });
        }

        return;
      }

      const employee = await tx.kasir.findUnique({
        where: { id_kasir: id },
        include: {
          akun: { select: { id_akun: true } },
          _count: {
            select: {
              booking: true,
              jadwal_kapster: true,
              transaksi: true,
            },
          },
        },
      });

      if (!employee) {
        throw new BookingApiError("Data Kasir tidak ditemukan.", 404);
      }

      if (!employee.akun) {
        throw new BookingApiError(
          "Kasir belum memiliki akun login. Ubah data karyawan dan buat akun login terlebih dahulu.",
          409,
        );
      }

      await tx.akun.update({
        where: { id_akun: employee.akun.id_akun },
        data: { is_active: false, session_version: { increment: 1 } },
      });
    });

    return Response.json({
      success: true,
      message: "Akses karyawan berhasil dinonaktifkan.",
    });
  } catch (error) {
    return errorResponse(error, "Deactivate owner employee failed");
  }
}
