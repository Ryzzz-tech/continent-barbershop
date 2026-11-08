import { getAuthenticatedAccount } from "@/lib/auth";
import {
  activeBookingStatuses,
  assertRole,
  BookingApiError,
  currentJakartaDate,
  dateString,
  dateValue,
  errorResponse,
  isRecord,
  isValidDate,
  isValidTime,
  lockKapsterDay,
  timeMinutes,
  timeString,
  timeValue,
} from "@/lib/booking-api";
import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

function serialize(schedule: {
  id_jadwal: string;
  id_kapster: string;
  tanggal: Date;
  jam_mulai: Date;
  jam_selesai: Date;
  status: string;
  catatan: string | null;
}) {
  return {
    id: schedule.id_jadwal,
    barberId: schedule.id_kapster,
    date: dateString(schedule.tanggal),
    startTime: timeString(schedule.jam_mulai),
    endTime: timeString(schedule.jam_selesai),
    status: schedule.status === "Tersedia" ? "available" : "unavailable",
    note: schedule.catatan ?? "",
  };
}

function validateScheduleBody(body: unknown) {
  if (
    !isRecord(body) ||
    !isValidDate(body.date) ||
    !isValidTime(body.startTime) ||
    !isValidTime(body.endTime) ||
    (body.status !== "available" && body.status !== "unavailable") ||
    (body.note !== undefined && typeof body.note !== "string")
  ) {
    throw new BookingApiError("Data jadwal tidak valid.", 400);
  }
  if (
    body.date < currentJakartaDate() ||
    timeMinutes(timeValue(body.endTime)) <= timeMinutes(timeValue(body.startTime))
  ) {
    throw new BookingApiError("Tanggal atau rentang waktu jadwal tidak valid.", 400);
  }
  const note = typeof body.note === "string" ? body.note.trim() : "";
  if (note.length > 100) throw new BookingApiError("Catatan jadwal maksimal 100 karakter.", 400);
  return {
    date: body.date,
    startTime: body.startTime,
    endTime: body.endTime,
    status: body.status === "available" ? "available" : "unavailable",
    note,
  };
}

async function assertNoActiveBookingOverlap(
  tx: Prisma.TransactionClient,
  barberId: string,
  date: string,
  start: number,
  end: number,
) {
  const bookings = await tx.booking.findMany({
    where: {
      id_kapster: barberId,
      tanggal_booking: dateValue(date),
      status: { in: activeBookingStatuses },
    },
    select: {
      jam_booking: true,
      durasi_snapshot: true,
      layanan: { select: { durasi: true } },
    },
  });
  if (
    bookings.some((booking) => {
      const bookingStart = timeMinutes(booking.jam_booking);
      const bookingEnd = bookingStart + (booking.durasi_snapshot ?? booking.layanan.durasi);
      return start < bookingEnd && bookingStart < end;
    })
  ) {
    throw new BookingApiError("Jadwal mencakup booking aktif dan tidak dapat ditutup atau dihapus.", 409);
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const account = assertRole(await getAuthenticatedAccount(), ["kapster"]);
    const { id } = await params;
    const schedule = await prisma.jadwal_kapster.findFirst({
      where: { id_jadwal: id, id_kapster: account.profileId },
    });
    if (!schedule) throw new BookingApiError("Jadwal tidak ditemukan.", 404);
    return Response.json({ success: true, schedule: serialize(schedule) });
  } catch (error) {
    return errorResponse(error, "Load barber schedule detail failed");
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const account = assertRole(await getAuthenticatedAccount(), ["kapster"]);
    const { id } = await params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new BookingApiError("Format jadwal tidak valid.", 400);
    }
    const values = validateScheduleBody(body);
    const schedule = await prisma.$transaction(async (tx) => {
      const current = await tx.jadwal_kapster.findFirst({
        where: { id_jadwal: id, id_kapster: account.profileId },
      });
      if (!current) throw new BookingApiError("Jadwal tidak ditemukan.", 404);
      await lockKapsterDay(tx, account.profileId, values.date);
      const overlap = await tx.jadwal_kapster.findFirst({
        where: {
          id_kapster: account.profileId,
          id_jadwal: { not: id },
          tanggal: dateValue(values.date),
          jam_mulai: { lt: timeValue(values.endTime) },
          jam_selesai: { gt: timeValue(values.startTime) },
        },
      });
      if (overlap) throw new BookingApiError("Jadwal bertumpang tindih dengan jadwal lain.", 409);
      if (values.status === "unavailable") {
        await assertNoActiveBookingOverlap(
          tx,
          account.profileId,
          values.date,
          timeMinutes(timeValue(values.startTime)),
          timeMinutes(timeValue(values.endTime)),
        );
      }
      return tx.jadwal_kapster.update({
        where: { id_jadwal: id },
        data: {
          tanggal: dateValue(values.date),
          jam_mulai: timeValue(values.startTime),
          jam_selesai: timeValue(values.endTime),
          status: values.status === "available" ? "Tersedia" : "Tidak Tersedia",
          catatan: values.note || null,
        },
      });
    });
    return Response.json({ success: true, schedule: serialize(schedule) });
  } catch (error) {
    return errorResponse(error, "Update barber schedule failed");
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const account = assertRole(await getAuthenticatedAccount(), ["kapster"]);
    const { id } = await params;
    await prisma.$transaction(async (tx) => {
      const schedule = await tx.jadwal_kapster.findFirst({
        where: { id_jadwal: id, id_kapster: account.profileId },
      });
      if (!schedule) throw new BookingApiError("Jadwal tidak ditemukan.", 404);
      await lockKapsterDay(tx, account.profileId, dateString(schedule.tanggal));
      await assertNoActiveBookingOverlap(
        tx,
        account.profileId,
        dateString(schedule.tanggal),
        timeMinutes(schedule.jam_mulai),
        timeMinutes(schedule.jam_selesai),
      );
      await tx.jadwal_kapster.delete({ where: { id_jadwal: id } });
    });
    return Response.json({ success: true, message: "Jadwal berhasil dihapus." });
  } catch (error) {
    return errorResponse(error, "Delete barber schedule failed");
  }
}
