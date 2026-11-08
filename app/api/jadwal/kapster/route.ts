import { getAuthenticatedAccount } from "@/lib/auth";
import {
  activeBookingStatuses,
  assertRole,
  BookingApiError,
  currentJakartaDate,
  currentJakartaMinutes,
  dateString,
  dateValue,
  errorResponse,
  isRecord,
  isValidDate,
  isValidTime,
  lockKapsterDay,
  nextId,
  timeMinutes,
  timeString,
  timeValue,
} from "@/lib/booking-api";
import { prisma } from "@/lib/prisma";

type ScheduleForSlots = {
  id_jadwal: string;
  id_kapster: string;
  tanggal: Date;
  jam_mulai: Date;
  jam_selesai: Date;
  status: string;
};

function toSchedule(schedule: ScheduleForSlots & { catatan?: string | null }) {
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

export async function GET(request: Request) {
  try {
    const account = assertRole(await getAuthenticatedAccount(), ["pelanggan", "kapster", "kasir"]);
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const serviceId = searchParams.get("serviceId");
    const barberId = searchParams.get("barberId");
    const mine = searchParams.get("mine") === "true";
    if (dateParam && !isValidDate(dateParam)) {
      throw new BookingApiError("Tanggal jadwal tidak valid.", 400);
    }

    const where = {
      ...(dateParam ? { tanggal: dateValue(dateParam) } : {}),
      ...(account.role === "kapster"
        ? { id_kapster: account.profileId }
        : mine
          ? { id_kapster: account.profileId }
          : barberId
            ? { id_kapster: barberId }
            : {}),
      ...(account.role === "pelanggan" && !mine ? { status: "Tersedia" } : {}),
    };
    const [barbers, schedules, service] = await Promise.all([
      account.role === "kapster"
        ? prisma.kapster.findMany({
            where: { id_kapster: account.profileId },
            select: { id_kapster: true, nama: true },
          })
        : prisma.kapster.findMany({
            where: { status: "Aktif" },
            orderBy: { nama: "asc" },
            select: { id_kapster: true, nama: true },
          }),
      prisma.jadwal_kapster.findMany({
        where,
        orderBy: [{ tanggal: "asc" }, { jam_mulai: "asc" }],
      }),
      serviceId
        ? prisma.layanan.findFirst({
            where: { id_layanan: serviceId, is_active: true },
            select: { durasi: true },
          })
        : Promise.resolve({ durasi: 30 }),
    ]);
    if (!service) throw new BookingApiError("Layanan tidak tersedia.", 404);

    const schedulesForAvailability = schedules.filter(
      (schedule) => schedule.status === "Tersedia",
    );
    const activeBookings = dateParam
      ? await prisma.booking.findMany({
          where: {
            tanggal_booking: dateValue(dateParam),
            status: { in: activeBookingStatuses },
            ...(barberId
              ? { id_kapster: barberId }
              : account.role === "kapster"
                ? { id_kapster: account.profileId }
                : {}),
          },
          select: {
            id_kapster: true,
            jam_booking: true,
            durasi_snapshot: true,
            layanan: { select: { durasi: true } },
          },
        })
      : [];
    const slots = schedulesForAvailability.flatMap((schedule) => {
      const start = timeMinutes(schedule.jam_mulai);
      const end = timeMinutes(schedule.jam_selesai);
      const result: { barberId: string; date: string; time: string }[] = [];
      for (let minute = start; minute + service.durasi <= end; minute += 30) {
        const conflict = activeBookings.some((booking) => {
          if (booking.id_kapster !== schedule.id_kapster) return false;
          const bookedStart = timeMinutes(booking.jam_booking);
          const bookedEnd =
            bookedStart + (booking.durasi_snapshot ?? booking.layanan.durasi);
          return minute < bookedEnd && bookedStart < minute + service.durasi;
        });
        if (
          !conflict &&
          (!dateParam ||
            dateParam > currentJakartaDate() ||
            (dateParam === currentJakartaDate() && minute > currentJakartaMinutes()))
        ) {
          result.push({
            barberId: schedule.id_kapster,
            date: dateString(schedule.tanggal),
            time: timeString(new Date(Date.UTC(1970, 0, 1, Math.floor(minute / 60), minute % 60))),
          });
        }
      }
      return result;
    });

    return Response.json({
      success: true,
      barbers: barbers.map((barber) => ({
        id: barber.id_kapster,
        name: barber.nama,
      })),
      schedules: schedules.map(toSchedule),
      slots,
    });
  } catch (error) {
    return errorResponse(error, "Load barber schedule failed");
  }
}

export async function POST(request: Request) {
  try {
    const account = assertRole(await getAuthenticatedAccount(), ["kapster"]);
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new BookingApiError("Format jadwal tidak valid.", 400);
    }
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

    const schedule = await prisma.$transaction(async (tx) => {
      await lockKapsterDay(tx, account.profileId, body.date as string);
      const overlap = await tx.jadwal_kapster.findFirst({
        where: {
          id_kapster: account.profileId,
          tanggal: dateValue(body.date as string),
          jam_mulai: { lt: timeValue(body.endTime as string) },
          jam_selesai: { gt: timeValue(body.startTime as string) },
        },
      });
      if (overlap) throw new BookingApiError("Jadwal bertumpang tindih dengan jadwal lain.", 409);

      const status = body.status === "available" ? "Tersedia" : "Tidak Tersedia";
      if (status === "Tidak Tersedia") {
        const bookings = await tx.booking.findMany({
          where: {
            id_kapster: account.profileId,
            tanggal_booking: dateValue(body.date as string),
            status: { in: activeBookingStatuses },
          },
          select: {
            jam_booking: true,
            durasi_snapshot: true,
            layanan: { select: { durasi: true } },
          },
        });
        const start = timeMinutes(timeValue(body.startTime as string));
        const end = timeMinutes(timeValue(body.endTime as string));
        if (
          bookings.some((booking) => {
            const bookedStart = timeMinutes(booking.jam_booking);
            const bookedEnd = bookedStart + (booking.durasi_snapshot ?? booking.layanan.durasi);
            return start < bookedEnd && bookedStart < end;
          })
        ) {
          throw new BookingApiError("Jadwal mencakup booking aktif dan tidak dapat ditutup.", 409);
        }
      }
      return tx.jadwal_kapster.create({
        data: {
          id_jadwal: await nextId(tx, "schedule"),
          tanggal: dateValue(body.date as string),
          jam_mulai: timeValue(body.startTime as string),
          jam_selesai: timeValue(body.endTime as string),
          status,
          catatan: note || null,
          id_kapster: account.profileId,
          id_kasir: null,
        },
      });
    });
    return Response.json({ success: true, schedule: toSchedule(schedule) }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Create barber schedule failed");
  }
}
