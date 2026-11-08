import { getAuthenticatedAccount } from "@/lib/auth";
import {
  assertRole,
  BookingApiError,
  currentJakartaDate,
  currentJakartaMinutes,
  dateValue,
  errorResponse,
  hasActiveBookingConflict,
  isRecord,
  isValidDate,
  isValidTime,
  lockKapsterDay,
  nextId,
  timeMinutes,
  timeValue,
} from "@/lib/booking-api";
import { prisma } from "@/lib/prisma";

const bookingInclude = {
  pelanggan: { select: { id_pelanggan: true, nama: true, no_hp: true } },
  kapster: { select: { id_kapster: true, nama: true } },
  layanan: { select: { id_layanan: true, nama_layanan: true, harga: true, durasi: true } },
  transaksi: { select: { id_transaksi: true, status_pembayaran: true, metode_pembayaran: true } },
} as const;

function serializeBooking(booking: {
  id_booking: string;
  tanggal_booking: Date;
  jam_booking: Date;
  status: string;
  catatan: string | null;
  catatan_status: string | null;
  nama_layanan_snapshot: string | null;
  harga_snapshot: { toString(): string } | null;
  durasi_snapshot: number | null;
  pelanggan: { id_pelanggan: string; nama: string; no_hp: string };
  kapster: { id_kapster: string; nama: string };
  layanan: { id_layanan: string; nama_layanan: string; harga: { toString(): string }; durasi: number };
  transaksi: { id_transaksi: string; status_pembayaran: string; metode_pembayaran: string } | null;
}) {
  return {
    id: booking.id_booking,
    date: booking.tanggal_booking.toISOString().slice(0, 10),
    time: booking.jam_booking.toISOString().slice(11, 16),
    status: booking.status,
    customerId: booking.pelanggan.id_pelanggan,
    customerName: booking.pelanggan.nama,
    customerPhone: booking.pelanggan.no_hp,
    barberId: booking.kapster.id_kapster,
    barberName: booking.kapster.nama,
    serviceId: booking.layanan.id_layanan,
    serviceName: booking.nama_layanan_snapshot ?? booking.layanan.nama_layanan,
    price: Number(booking.harga_snapshot ?? booking.layanan.harga),
    duration: booking.durasi_snapshot ?? booking.layanan.durasi,
    customerNote: booking.catatan ?? "",
    statusNote: booking.catatan_status ?? "",
    paymentStatus: booking.transaksi?.status_pembayaran ?? "Belum Dibayar",
    paymentMethod: booking.transaksi?.metode_pembayaran ?? null,
    transactionId: booking.transaksi?.id_transaksi ?? null,
  };
}

export async function GET() {
  try {
    const account = assertRole(await getAuthenticatedAccount(), [
      "pelanggan",
      "kapster",
      "kasir",
      "owner",
    ]);
    const where =
      account.role === "pelanggan"
        ? { id_pelanggan: account.profileId }
        : account.role === "kapster"
          ? { id_kapster: account.profileId }
          : {};
    const bookings = await prisma.booking.findMany({
      where,
      include: bookingInclude,
      orderBy: [{ tanggal_booking: "desc" }, { jam_booking: "desc" }],
    });

    return Response.json({
      success: true,
      bookings: bookings.map(serializeBooking),
    });
  } catch (error) {
    return errorResponse(error, "Load bookings failed");
  }
}

export async function POST(request: Request) {
  try {
    const account = assertRole(await getAuthenticatedAccount(), ["pelanggan", "kasir"]);
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new BookingApiError("Format permintaan booking tidak valid.", 400);
    }

    if (
      !isRecord(body) ||
      typeof body.serviceId !== "string" ||
      typeof body.barberId !== "string" ||
      !isValidDate(body.date) ||
      !isValidTime(body.time) ||
      (body.customerId !== undefined && typeof body.customerId !== "string") ||
      (body.note !== undefined && typeof body.note !== "string")
    ) {
      throw new BookingApiError("Layanan, kapster, tanggal, atau waktu booking tidak valid.", 400);
    }
    const note = typeof body.note === "string" ? body.note.trim() : "";
    if (note.length > 100) {
      throw new BookingApiError("Catatan booking maksimal 100 karakter.", 400);
    }
    if (body.date < currentJakartaDate()) {
      throw new BookingApiError("Tanggal booking tidak boleh sudah lewat.", 400);
    }
    if (account.role === "kasir" && typeof body.customerId !== "string") {
      throw new BookingApiError("Pilih pelanggan dari data yang tersedia.", 400);
    }
    if (account.role === "pelanggan" && body.customerId !== undefined) {
      throw new BookingApiError("Identitas pelanggan ditentukan oleh sesi login.", 400);
    }

    const newBooking = await prisma.$transaction(async (tx) => {
      await lockKapsterDay(tx, body.barberId as string, body.date as string);
      const [service, barber, schedules, customer] = await Promise.all([
        tx.layanan.findFirst({
          where: { id_layanan: body.serviceId as string, is_active: true },
        }),
        tx.kapster.findFirst({
          where: { id_kapster: body.barberId as string, status: "Aktif" },
        }),
        tx.jadwal_kapster.findMany({
          where: {
            id_kapster: body.barberId as string,
            tanggal: dateValue(body.date as string),
            status: "Tersedia",
          },
          select: { jam_mulai: true, jam_selesai: true },
        }),
        tx.pelanggan.findUnique({
          where: {
            id_pelanggan:
              account.role === "pelanggan"
                ? account.profileId
                : (body.customerId as string),
          },
        }),
      ]);
      if (!customer) throw new BookingApiError("Profil pelanggan tidak ditemukan.", 404);
      if (!service) throw new BookingApiError("Layanan tidak tersedia lagi.", 404);
      if (!barber) throw new BookingApiError("Kapster tidak tersedia.", 404);

      const start = timeMinutes(timeValue(body.time as string));
      const end = start + service.durasi;
      const withinSchedule = schedules.some(
        (schedule) =>
          start >= timeMinutes(schedule.jam_mulai) &&
          end <= timeMinutes(schedule.jam_selesai),
      );
      if (!withinSchedule) {
        throw new BookingApiError("Jadwal kapster tidak tersedia untuk durasi layanan ini.", 409);
      }

      if (
        body.date === currentJakartaDate() &&
        start <= currentJakartaMinutes()
      ) {
        throw new BookingApiError("Waktu booking sudah lewat.", 400);
      }

      if (
        await hasActiveBookingConflict(tx, {
          barberId: barber.id_kapster,
          date: body.date as string,
          startMinutes: start,
          duration: service.durasi,
        })
      ) {
        throw new BookingApiError("Jadwal baru saja dipesan. Silakan pilih waktu lain.", 409);
      }

      const id = await nextId(tx, "booking");
      return tx.booking.create({
        data: {
          id_booking: id,
          tanggal_booking: dateValue(body.date as string),
          jam_booking: timeValue(body.time as string),
          status: "Menunggu",
          catatan: note || null,
          id_pelanggan: customer.id_pelanggan,
          id_kapster: barber.id_kapster,
          id_layanan: service.id_layanan,
          id_kasir: account.role === "kasir" ? account.profileId : null,
          nama_layanan_snapshot: service.nama_layanan,
          harga_snapshot: service.harga,
          durasi_snapshot: service.durasi,
        },
        include: bookingInclude,
      });
    });

    return Response.json(
      { success: true, booking: serializeBooking(newBooking) },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error, "Create booking failed");
  }
}
