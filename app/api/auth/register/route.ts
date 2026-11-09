import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  BookingApiError,
  currentJakartaDate,
  dateValue,
  errorResponse,
  isRecord,
} from "@/lib/booking-api";

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

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, message: "Format data registrasi tidak valid." },
      { status: 400 },
    );
  }

  if (
    !isRecord(body) ||
    typeof body.name !== "string" ||
    typeof body.email !== "string" ||
    typeof body.phone !== "string" ||
    typeof body.address !== "string" ||
    typeof body.password !== "string"
  ) {
    return Response.json(
      {
        success: false,
        message: "Nama, email, nomor HP, alamat, dan password wajib diisi.",
      },
      { status: 400 },
    );
  }

  const name = body.name.trim();
  const email = body.email.trim().toLowerCase();
  const phone = normalizePhone(body.phone);
  const address = body.address.trim();
  const password = body.password;

  if (name.length < 2 || name.length > 100) {
    return Response.json(
      { success: false, message: "Nama lengkap harus terdiri dari 2–100 karakter." },
      { status: 400 },
    );
  }

  if (
    email.length > 100 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return Response.json(
      { success: false, message: "Format email tidak valid." },
      { status: 400 },
    );
  }

  if (!/^08\d{8,11}$/.test(phone)) {
    return Response.json(
      { success: false, message: "Nomor HP harus berupa nomor Indonesia yang valid." },
      { status: 400 },
    );
  }

  if (!address || address.length > 500) {
    return Response.json(
      { success: false, message: "Alamat wajib diisi dan maksimal 500 karakter." },
      { status: 400 },
    );
  }

  if (
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return Response.json(
      {
        success: false,
        message: "Password harus minimal 8 karakter dan maksimal 72 byte.",
      },
      { status: 400 },
    );
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const customer = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${"customer:id"}))::text`;

      const [existingAccount, existingCustomer] = await Promise.all([
        tx.akun.findUnique({
          where: { email },
          select: { id_akun: true },
        }),
        tx.pelanggan.findFirst({
          where: {
            OR: [{ email }, { no_hp: phone }],
          },
          select: { id_pelanggan: true },
        }),
      ]);

      if (existingAccount || existingCustomer) {
        throw new BookingApiError(
          "Email atau nomor HP sudah digunakan. Silakan gunakan data lain.",
          409,
        );
      }

      const existingIds = await tx.pelanggan.findMany({
        select: { id_pelanggan: true },
      });

      const highestNumber = existingIds.reduce((highest, item) => {
        const match = /^P(\d{4})$/.exec(item.id_pelanggan);
        return match ? Math.max(highest, Number(match[1])) : highest;
      }, 0);

      if (highestNumber >= 9999) {
        throw new BookingApiError(
          "Kapasitas nomor pelanggan telah tercapai.",
          503,
        );
      }

      const customerId = `P${String(highestNumber + 1).padStart(4, "0")}`;

      const profile = await tx.pelanggan.create({
        data: {
          id_pelanggan: customerId,
          nama: name,
          no_hp: phone,
          email,
          alamat: address,
          tanggal_daftar: dateValue(currentJakartaDate()),
        },
      });

      await tx.akun.create({
        data: {
          email,
          password_hash: passwordHash,
          role: "pelanggan",
          is_active: true,
          id_pelanggan: profile.id_pelanggan,
        },
      });

      return {
        id: profile.id_pelanggan,
        name: profile.nama,
        email: profile.email,
        phone: profile.no_hp,
      };
    });

    return Response.json(
      {
        success: true,
        message: "Registrasi berhasil. Silakan login menggunakan akun Anda.",
        customer,
      },
      { status: 201 },
    );
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return Response.json(
        {
          success: false,
          message: "Email atau nomor HP sudah digunakan. Silakan gunakan data lain.",
        },
        { status: 409 },
      );
    }

    if (error instanceof BookingApiError) {
      return errorResponse(error, "Customer registration failed");
    }

    return errorResponse(error, "Customer registration failed");
  }
}