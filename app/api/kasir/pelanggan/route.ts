import { getAuthenticatedAccount } from "@/lib/auth";
import {
  assertRole,
  BookingApiError,
  currentJakartaDate,
  dateValue,
  errorResponse,
  isRecord,
} from "@/lib/booking-api";
import { prisma } from "@/lib/prisma";

function normalizePhone(value: string) {
  const compact = value.replace(/[\s()-]/g, "");

  if (compact.startsWith("+62")) {
    return `0${compact.slice(3)}`;
  }

  if (compact.startsWith("62")) {
    return `0${compact.slice(2)}`;
  }

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

export async function GET() {
  try {
    assertRole(await getAuthenticatedAccount(), ["kasir"]);

    const customers = await prisma.pelanggan.findMany({
      orderBy: { nama: "asc" },
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
      customers: customers.map((customer) => ({
        id: customer.id_pelanggan,
        name: customer.nama,
        phone: customer.no_hp,
        email: customer.email,
        address: customer.alamat,
        registeredAt: customer.tanggal_daftar.toISOString().slice(0, 10),
      })),
    });
  } catch (error) {
    return errorResponse(error, "Load cashier customers failed");
  }
}

export async function POST(request: Request) {
  try {
    assertRole(await getAuthenticatedAccount(), ["kasir"]);

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
      throw new BookingApiError(
        "Nomor HP harus berupa nomor Indonesia yang valid.",
        400,
      );
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

    const customer = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${"customer:id"}))::text`;

      const existing = await tx.pelanggan.findMany({
        select: { id_pelanggan: true },
      });

      const highestNumber = existing.reduce((highest, item) => {
        const match = /^P(\d{4})$/.exec(item.id_pelanggan);
        return match
          ? Math.max(highest, Number(match[1]))
          : highest;
      }, 0);

      if (highestNumber >= 9999) {
        throw new BookingApiError(
          "Kapasitas nomor pelanggan telah tercapai.",
          503,
        );
      }

      const id = `P${String(highestNumber + 1).padStart(4, "0")}`;

      return tx.pelanggan.create({
        data: {
          id_pelanggan: id,
          nama: name,
          no_hp: phone,
          email,
          alamat: address,
          tanggal_daftar: dateValue(currentJakartaDate()),
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
    });

    return Response.json(
      {
        success: true,
        customer: {
          id: customer.id_pelanggan,
          name: customer.nama,
          phone: customer.no_hp,
          email: customer.email,
          address: customer.alamat,
          registeredAt: customer.tanggal_daftar.toISOString().slice(0, 10),
        },
      },
      { status: 201 },
    );
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

    return errorResponse(error, "Create cashier customer failed");
  }
}
