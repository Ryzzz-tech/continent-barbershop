import { getAuthenticatedAccount } from "@/lib/auth";
import {
  assertRole,
  currentJakartaDate,
  dateValue,
  errorResponse,
} from "@/lib/booking-api";
import { prisma } from "@/lib/prisma";

const paidPaymentStatuses = ["Sudah Dibayar", "Lunas"];

export async function GET() {
  try {
    assertRole(await getAuthenticatedAccount(), ["kasir"]);

    const today = currentJakartaDate();
    const todayDate = dateValue(today);

    const [bookingCount, upcomingBookings, transactions] = await Promise.all([
      prisma.booking.count({
        where: { tanggal_booking: todayDate },
      }),

      prisma.booking.findMany({
        where: {
          tanggal_booking: { gte: todayDate },
          status: { not: "Dibatalkan" },
        },
        select: {
          id_booking: true,
          tanggal_booking: true,
          jam_booking: true,
          status: true,
          nama_layanan_snapshot: true,
          pelanggan: {
            select: { nama: true },
          },
          kapster: {
            select: { nama: true },
          },
          layanan: {
            select: { nama_layanan: true },
          },
        },
        orderBy: [
          { tanggal_booking: "asc" },
          { jam_booking: "asc" },
        ],
        take: 5,
      }),

      prisma.transaksi.findMany({
        where: { tanggal_transaksi: todayDate },
        select: {
          id_transaksi: true,
          total_harga: true,
          status_pembayaran: true,
          metode_pembayaran: true,
          pelanggan: {
            select: { nama: true },
          },
        },
        orderBy: { id_transaksi: "desc" },
      }),
    ]);

    const paidTransactions = transactions.filter((transaction) =>
      paidPaymentStatuses.includes(transaction.status_pembayaran),
    );

    const dailyIncome = paidTransactions.reduce(
      (total, transaction) => total + Number(transaction.total_harga),
      0,
    );

    return Response.json({
      success: true,
      date: today,
      bookingCount,
      transactionCount: transactions.length,
      dailyIncome,
      upcomingBookings: upcomingBookings.map((booking) => ({
        id: booking.id_booking,
        date: booking.tanggal_booking.toISOString().slice(0, 10),
        time: booking.jam_booking.toISOString().slice(11, 16),
        status: booking.status,
        customerName: booking.pelanggan.nama,
        serviceName:
          booking.nama_layanan_snapshot ?? booking.layanan.nama_layanan,
        barberName: booking.kapster.nama,
      })),
    });
  } catch (error) {
    return errorResponse(error, "Load cashier dashboard failed");
  }
}
