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
  timeMinutes,
  timeValue,
} from "@/lib/booking-api";
import { prisma } from "@/lib/prisma";

const includeBooking = {
  pelanggan: { select: { id_pelanggan: true, nama: true, no_hp: true } },
  kapster: { select: { id_kapster: true, nama: true } },
  layanan: { select: { id_layanan: true, nama_layanan: true, harga: true, durasi: true } },
  transaksi: { select: { id_transaksi: true, status_pembayaran: true, metode_pembayaran: true } },
} as const;

function serialize(booking: Awaited<ReturnType<typeof findBooking>>) {
  if (!booking) return null;
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

function findBooking(id: string) {
  return prisma.booking.findUnique({
    where: { id_booking: id },
    include: includeBooking,
  });
}

function canReadBooking(
  booking: NonNullable<Awaited<ReturnType<typeof findBooking>>>,
  account: { role: string; profileId: string },
) {
  if (account.role === "pelanggan") return booking.id_pelanggan === account.profileId;
  if (account.role === "kapster") return booking.id_kapster === account.profileId;
  return account.role === "kasir" || account.role === "owner";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const account = assertRole(await getAuthenticatedAccount(), [
      "pelanggan",
      "kapster",
      "kasir",
      "owner",
    ]);
    const { id } = await params;
    const booking = await findBooking(id);
    if (!booking || !canReadBooking(booking, account)) {
      throw new BookingApiError("Booking tidak ditemukan.", 404);
    }
    return Response.json({ success: true, booking: serialize(booking) });
  } catch (error) {
    return errorResponse(error, "Load booking detail failed");
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const account = assertRole(await getAuthenticatedAccount(), ["pelanggan"]);
    const { id } = await params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new BookingApiError("Format perubahan booking tidak valid.", 400);
    }
    if (
      !isRecord(body) ||
      typeof body.serviceId !== "string" ||
      typeof body.barberId !== "string" ||
      !isValidDate(body.date) ||
      !isValidTime(body.time) ||
      (body.note !== undefined && typeof body.note !== "string")
    ) {
      throw new BookingApiError("Data perubahan booking tidak valid.", 400);
    }
    const note = typeof body.note === "string" ? body.note.trim() : "";
    if (note.length > 100 || body.date < currentJakartaDate()) {
      throw new BookingApiError(
        note.length > 100 ? "Catatan booking maksimal 100 karakter." : "Tanggal booking tidak boleh sudah lewat.",
        400,
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`payment:${id}`}))::text`;
      const current = await tx.booking.findFirst({
        where: { id_booking: id, id_pelanggan: account.profileId },
        include: { transaksi: { select: { id_transaksi: true } } },
      });
      if (!current) throw new BookingApiError("Booking tidak ditemukan.", 404);
      if (current.status !== "Menunggu" || current.transaksi) {
        throw new BookingApiError("Booking tidak dapat diubah setelah dikonfirmasi atau dibayar.", 409);
      }

      await lockKapsterDay(tx, body.barberId as string, body.date as string);
      const [service, barber, schedules] = await Promise.all([
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
      ]);
      if (!service || !barber) throw new BookingApiError("Layanan atau kapster tidak tersedia.", 404);

      const start = timeMinutes(timeValue(body.time as string));
      const end = start + service.durasi;
      if (body.date === currentJakartaDate() && start <= currentJakartaMinutes()) {
        throw new BookingApiError("Waktu booking sudah lewat.", 400);
      }
      if (
        !schedules.some(
          (schedule) =>
            start >= timeMinutes(schedule.jam_mulai) &&
            end <= timeMinutes(schedule.jam_selesai),
        )
      ) {
        throw new BookingApiError("Jadwal kapster tidak tersedia untuk durasi layanan ini.", 409);
      }
      if (
        await hasActiveBookingConflict(tx, {
          barberId: barber.id_kapster,
          date: body.date as string,
          startMinutes: start,
          duration: service.durasi,
          excludingBookingId: id,
        })
      ) {
        throw new BookingApiError("Jadwal baru saja dipesan. Silakan pilih waktu lain.", 409);
      }

      return tx.booking.update({
        where: { id_booking: id },
        data: {
          tanggal_booking: dateValue(body.date as string),
          jam_booking: timeValue(body.time as string),
          id_layanan: service.id_layanan,
          id_kapster: barber.id_kapster,
          catatan: note || null,
          nama_layanan_snapshot: service.nama_layanan,
          harga_snapshot: service.harga,
          durasi_snapshot: service.durasi,
        },
        include: includeBooking,
      });
    });

    return Response.json({ success: true, booking: serialize(updated) });
  } catch (error) {
    return errorResponse(error, "Update booking failed");
  }
}
