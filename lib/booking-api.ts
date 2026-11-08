import "server-only";

import { unstable_rethrow } from "next/navigation";
import type { Prisma } from "@/app/generated/prisma/client";
import type { AccountRole } from "@/lib/auth";

export const activeBookingStatuses = ["Menunggu", "Dikonfirmasi", "Diproses"];

export class BookingApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "BookingApiError";
  }
}

export function errorResponse(error: unknown, label: string) {
  unstable_rethrow(error);
  if (error instanceof BookingApiError) {
    return Response.json(
      { success: false, message: error.message },
      { status: error.status },
    );
  }

  console.error(`${label}:`, error);
  return Response.json(
    { success: false, message: "Permintaan tidak dapat diproses saat ini." },
    { status: 500 },
  );
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isValidDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function isValidTime(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function dateValue(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export function timeValue(value: string) {
  return new Date(`1970-01-01T${value}:00.000Z`);
}

export function dateString(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function timeString(value: Date) {
  return value.toISOString().slice(11, 16);
}

export function timeMinutes(value: Date) {
  return value.getUTCHours() * 60 + value.getUTCMinutes();
}

export function currentJakartaDate() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Jakarta" }).format(new Date());
}

export function currentJakartaMinutes() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  const minute = Number(parts.find((part) => part.type === "minute")?.value);
  return hour * 60 + minute;
}

export function assertRole(
  account: { role: AccountRole; profileId: string } | null,
  roles: AccountRole[],
) {
  if (!account) throw new BookingApiError("Sesi tidak valid. Silakan login kembali.", 401);
  if (!roles.includes(account.role)) {
    throw new BookingApiError("Anda tidak memiliki akses untuk tindakan ini.", 403);
  }
  return account;
}

export async function lockKapsterDay(
  tx: Prisma.TransactionClient,
  barberId: string,
  date: string,
) {
  const lockKey = `booking:${barberId}:${date}`;
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))::text`;
}

export async function nextId(
  tx: Prisma.TransactionClient,
  kind: "booking" | "transaction" | "detail" | "schedule",
) {
  let sequenceQuery: Promise<{ value: bigint }[]>;
  switch (kind) {
    case "booking":
      sequenceQuery = tx.$queryRaw<{ value: bigint }[]>`SELECT nextval('booking_id_seq') AS value`;
      break;
    case "transaction":
      sequenceQuery = tx.$queryRaw<{ value: bigint }[]>`SELECT nextval('transaksi_id_seq') AS value`;
      break;
    case "detail":
      sequenceQuery = tx.$queryRaw<{ value: bigint }[]>`SELECT nextval('detail_transaksi_id_seq') AS value`;
      break;
    case "schedule":
      sequenceQuery = tx.$queryRaw<{ value: bigint }[]>`SELECT nextval('jadwal_kapster_id_seq') AS value`;
      break;
  }
  const [{ value }] = await sequenceQuery;
  const prefix = { booking: "B", transaction: "T", detail: "D", schedule: "J" }[kind];
  const width = kind === "detail" ? 4 : 4;
  if (Number(value) > 10 ** width - 1) {
    throw new BookingApiError("Batas kapasitas nomor data telah tercapai.", 503);
  }
  return `${prefix}${String(value).padStart(width, "0")}`;
}

export async function hasActiveBookingConflict(
  tx: Prisma.TransactionClient,
  {
    barberId,
    date,
    startMinutes,
    duration,
    excludingBookingId,
  }: {
    barberId: string;
    date: string;
    startMinutes: number;
    duration: number;
    excludingBookingId?: string;
  },
) {
  const bookings = await tx.booking.findMany({
    where: {
      id_kapster: barberId,
      tanggal_booking: dateValue(date),
      status: { in: activeBookingStatuses },
      ...(excludingBookingId ? { id_booking: { not: excludingBookingId } } : {}),
    },
    select: {
      jam_booking: true,
      durasi_snapshot: true,
      layanan: { select: { durasi: true } },
    },
  });
  const endMinutes = startMinutes + duration;
  return bookings.some((booking) => {
    const bookedStart = timeMinutes(booking.jam_booking);
    const bookedEnd = bookedStart + (booking.durasi_snapshot ?? booking.layanan.durasi);
    return startMinutes < bookedEnd && bookedStart < endMinutes;
  });
}

export function isValidStatusTransition(current: string, next: string) {
  const allowed: Record<string, string[]> = {
    Menunggu: ["Dikonfirmasi", "Diproses", "Dibatalkan"],
    Dikonfirmasi: ["Diproses", "Dibatalkan"],
    Diproses: ["Selesai", "Dibatalkan"],
    Selesai: [],
    Dibatalkan: [],
  };
  return current === next || allowed[current]?.includes(next) === true;
}
