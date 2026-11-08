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

const paymentMethods: Record<string, string> = {
  tunai: "Tunai",
  transfer: "Transfer Bank",
  qris: "QRIS",
};

export async function POST(request: Request) {
  try {
    const account = assertRole(await getAuthenticatedAccount(), ["kasir"]);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new BookingApiError("Format transaksi tidak valid.", 400);
    }

    if (
      !isRecord(body) ||
      typeof body.customerId !== "string" ||
      typeof body.serviceId !== "string" ||
      typeof body.barberId !== "string" ||
      !isValidDate(body.date) ||
      !isValidTime(body.time) ||
      typeof body.paymentMethod !== "string" ||
      !Object.hasOwn(paymentMethods, body.paymentMethod)
    ) {
      throw new BookingApiError(
        "Pelanggan, layanan, kapster, jadwal, dan metode pembayaran wajib dipilih.",
        400,
      );
    }

    const { customerId, serviceId, barberId, date, time, paymentMethod } = body;

    if (date < currentJakartaDate()) {
      throw new BookingApiError("Tanggal pelayanan tidak boleh sudah lewat.", 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      await lockKapsterDay(tx, barberId, date);

      const [customer, service, barber, schedules] = await Promise.all([
        tx.pelanggan.findUnique({
          where: { id_pelanggan: customerId },
        }),
        tx.layanan.findFirst({
          where: { id_layanan: serviceId, is_active: true },
        }),
        tx.kapster.findFirst({
          where: { id_kapster: barberId, status: "Aktif" },
        }),
        tx.jadwal_kapster.findMany({
          where: {
            id_kapster: barberId,
            tanggal: dateValue(date),
            status: "Tersedia",
          },
          select: { jam_mulai: true, jam_selesai: true },
        }),
      ]);

      if (!customer) {
        throw new BookingApiError("Pelanggan tidak ditemukan.", 404);
      }
      if (!service) {
        throw new BookingApiError("Layanan tidak tersedia.", 404);
      }
      if (!barber) {
        throw new BookingApiError("Kapster tidak tersedia.", 404);
      }

      const start = timeMinutes(timeValue(time));
      const end = start + service.durasi;

      const withinSchedule = schedules.some(
        (schedule) =>
          start >= timeMinutes(schedule.jam_mulai) &&
          end <= timeMinutes(schedule.jam_selesai),
      );

      if (!withinSchedule) {
        throw new BookingApiError(
          "Jadwal kapster tidak tersedia untuk durasi layanan ini.",
          409,
        );
      }

      if (date === currentJakartaDate() && start <= currentJakartaMinutes()) {
        throw new BookingApiError("Waktu pelayanan sudah lewat.", 400);
      }

      if (
        await hasActiveBookingConflict(tx, {
          barberId,
          date,
          startMinutes: start,
          duration: service.durasi,
        })
      ) {
        throw new BookingApiError(
          "Jadwal baru saja dipesan. Silakan pilih waktu lain.",
          409,
        );
      }

      const bookingId = await nextId(tx, "booking");
      const transactionId = await nextId(tx, "transaction");
      const detailId = await nextId(tx, "detail");

      const booking = await tx.booking.create({
        data: {
          id_booking: bookingId,
          tanggal_booking: dateValue(date),
          jam_booking: timeValue(time),
          status: "Menunggu",
          id_pelanggan: customer.id_pelanggan,
          id_kapster: barber.id_kapster,
          id_layanan: service.id_layanan,
          id_kasir: account.profileId,
          nama_layanan_snapshot: service.nama_layanan,
          harga_snapshot: service.harga,
          durasi_snapshot: service.durasi,
        },
      });

      const transaction = await tx.transaksi.create({
        data: {
          id_transaksi: transactionId,
          tanggal_transaksi: dateValue(currentJakartaDate()),
          total_harga: service.harga,
          metode_pembayaran: paymentMethods[paymentMethod],
          status_pembayaran: "Sudah Dibayar",
          id_pelanggan: customer.id_pelanggan,
          id_kasir: account.profileId,
          id_booking: booking.id_booking,
          detail_transaksi: {
            create: {
              id_detail: detailId,
              jenis_item: "Jasa",
              jumlah: 1,
              harga_satuan: service.harga,
              total: service.harga,
              id_layanan: service.id_layanan,
              nama_item_snapshot: service.nama_layanan,
            },
          },
        },
      });

      return { booking, transaction, customer, service, barber };
    });

    return Response.json(
      {
        success: true,
        booking: {
          id: result.booking.id_booking,
          status: result.booking.status,
          date: result.booking.tanggal_booking.toISOString().slice(0, 10),
          time: result.booking.jam_booking.toISOString().slice(11, 16),
        },
        transaction: {
          id: result.transaction.id_transaksi,
          date: result.transaction.tanggal_transaksi.toISOString().slice(0, 10),
          total: Number(result.transaction.total_harga),
          paymentMethod: result.transaction.metode_pembayaran,
          paymentStatus: result.transaction.status_pembayaran,
        },
        customer: result.customer.nama,
        service: result.service.nama_layanan,
        barber: result.barber.nama,
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error, "Create cashier transaction failed");
  }
}
