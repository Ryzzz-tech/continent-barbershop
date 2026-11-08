import { getAuthenticatedAccount } from "@/lib/auth";
import {
  assertRole,
  BookingApiError,
  errorResponse,
  isRecord,
} from "@/lib/booking-api";
import { prisma } from "@/lib/prisma";

function normalizePhone(value: string) {
  const compact = value.replace(/[\s()-]/g, "");

  if (compact.startsWith("+62")) return `0${compact.slice(3)}`;
  if (compact.startsWith("62")) return `0${compact.slice(2)}`;

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

function isForeignKeyError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2003"
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertRole(await getAuthenticatedAccount(), ["kasir"]);

    const { id } = await params;
    const customer = await prisma.pelanggan.findUnique({
      where: { id_pelanggan: id },
      select: {
        id_pelanggan: true,
        nama: true,
        no_hp: true,
        email: true,
        alamat: true,
        tanggal_daftar: true,
      },
    });

    if (!customer) {
      throw new BookingApiError("Data pelanggan tidak ditemukan.", 404);
    }

    return Response.json({
      success: true,
      customer: {
        id: customer.id_pelanggan,
        name: customer.nama,
        phone: customer.no_hp,
        email: customer.email,
        address: customer.alamat,
        registeredAt: customer.tanggal_daftar.toISOString().slice(0, 10),
      },
    });
  } catch (error) {
    return errorResponse(error, "Load cashier customer failed");
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertRole(await getAuthenticatedAccount(), ["kasir"]);

    const { id } = await params;
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      throw new BookingApiError("Format data pelanggan tidak valid.", 400);
    }

    if (
      !isRecord(body) ||
      typeof body.name !== "string" ||
      typeof body.phone !== "string" ||
      typeof body.email !== "string" ||
      typeof body.address !== "string"
    ) {
      throw new BookingApiError(
        "Nama, nomor HP, email, dan alamat wajib diisi.",
        400,
      );
    }

    const name = body.name.trim();
    const phone = normalizePhone(body.phone);
    const email = body.email.trim().toLowerCase();
    const address = body.address.trim();

    if (!name || name.length > 100) {
      throw new BookingApiError(
        "Nama pelanggan wajib diisi dan maksimal 100 karakter.",
        400,
      );
    }

    if (!/^08\d{8,11}$/.test(phone)) {
      throw new BookingApiError("Nomor HP Indonesia tidak valid.", 400);
    }

    if (
      email.length > 100 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      throw new BookingApiError("Alamat email tidak valid.", 400);
    }

    if (!address || address.length > 500) {
      throw new BookingApiError(
        "Alamat wajib diisi dan maksimal 500 karakter.",
        400,
      );
    }

    const customer = await prisma.pelanggan.update({
      where: { id_pelanggan: id },
      data: {
        nama: name,
        no_hp: phone,
        email,
        alamat: address,
      },
      select: {
        id_pelanggan: true,
        nama: true,
        no_hp: true,
        email: true,
        alamat: true,
        tanggal_daftar: true,
      },
    });

    return Response.json({
      success: true,
      customer: {
        id: customer.id_pelanggan,
        name: customer.nama,
        phone: customer.no_hp,
        email: customer.email,
        address: customer.alamat,
        registeredAt: customer.tanggal_daftar.toISOString().slice(0, 10),
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return Response.json(
        {
          success: false,
          message: "Nomor HP atau email sudah digunakan pelanggan lain.",
        },
        { status: 409 },
      );
    }

    return errorResponse(error, "Update cashier customer failed");
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertRole(await getAuthenticatedAccount(), ["kasir"]);

    const { id } = await params;

    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`customer:${id}`}))::text`;

      const customer = await tx.pelanggan.findUnique({
        where: { id_pelanggan: id },
        include: {
          akun: { select: { id_akun: true } },
          _count: {
            select: {
              booking: true,
              transaksi: true,
            },
          },
        },
      });

      if (!customer) {
        throw new BookingApiError("Data pelanggan tidak ditemukan.", 404);
      }

      if (
        customer.akun ||
        customer._count.booking > 0 ||
        customer._count.transaksi > 0
      ) {
        throw new BookingApiError(
          "Pelanggan tidak dapat dihapus karena masih memiliki akun, booking, atau riwayat transaksi.",
          409,
        );
      }

      await tx.pelanggan.delete({
        where: { id_pelanggan: id },
      });
    });

    return Response.json({
      success: true,
      message: "Data pelanggan berhasil dihapus.",
    });
  } catch (error) {
    if (isForeignKeyError(error)) {
      return Response.json(
        {
          success: false,
          message: "Pelanggan masih terhubung dengan data lain dan tidak dapat dihapus.",
        },
        { status: 409 },
      );
    }

    return errorResponse(error, "Delete cashier customer failed");
  }
}
