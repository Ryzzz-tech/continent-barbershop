import { getAuthenticatedAccount } from "@/lib/auth";
import {
  assertRole,
  BookingApiError,
  dateValue,
  errorResponse,
  isValidDate,
} from "@/lib/booking-api";
import { prisma } from "@/lib/prisma";

const paidPaymentStatuses: string[] = ["Sudah Dibayar", "Lunas"];

export async function GET(request: Request) {
  try {
    assertRole(await getAuthenticatedAccount(), ["owner"]);

    const url = new URL(request.url);
    const from = url.searchParams.get("from") ?? "";
    const to = url.searchParams.get("to") ?? "";

    if ((from && !isValidDate(from)) || (to && !isValidDate(to))) {
      throw new BookingApiError("Filter tanggal tidak valid.", 400);
    }

    if (from && to && from > to) {
      throw new BookingApiError(
        "Tanggal awal tidak boleh lebih besar dari tanggal akhir.",
        400,
      );
    }

    const where = from || to
      ? {
          tanggal_transaksi: {
            ...(from ? { gte: dateValue(from) } : {}),
            ...(to ? { lte: dateValue(to) } : {}),
          },
        }
      : {};

    const records = await prisma.transaksi.findMany({
      where,
      include: {
        pelanggan: {
          select: { nama: true },
        },
        booking: {
          select: {
            id_booking: true,
            kapster: {
              select: { nama: true },
            },
          },
        },
        detail_transaksi: {
          select: {
            id_detail: true,
            jenis_item: true,
            jumlah: true,
            harga_satuan: true,
            total: true,
            nama_item_snapshot: true,
            layanan: {
              select: { nama_layanan: true },
            },
            produk: {
              select: { nama_produk: true },
            },
          },
        },
      },
      orderBy: [
        { tanggal_transaksi: "desc" },
        { id_transaksi: "desc" },
      ],
    });

    const transactions = records.map((transaction) => ({
      id: transaction.id_transaksi,
      date: transaction.tanggal_transaksi.toISOString().slice(0, 10),
      customerName: transaction.pelanggan.nama,
      barberName: transaction.booking?.kapster.nama ?? "—",
      bookingId: transaction.booking?.id_booking ?? null,
      paymentMethod: transaction.metode_pembayaran,
      paymentStatus: transaction.status_pembayaran,
      total: Number(transaction.total_harga),
      items: transaction.detail_transaksi.map((item) => ({
        id: item.id_detail,
        type: item.jenis_item,
        name:
          item.nama_item_snapshot ??
          item.layanan?.nama_layanan ??
          item.produk?.nama_produk ??
          item.jenis_item,
        quantity: item.jumlah,
        unitPrice: Number(item.harga_satuan),
        total: Number(item.total),
      })),
    }));

    const paidTransactions = transactions.filter((transaction) =>
      paidPaymentStatuses.includes(transaction.paymentStatus),
    );

    const revenue = paidTransactions.reduce(
      (total, transaction) => total + transaction.total,
      0,
    );

    return Response.json({
      success: true,
      range: { from, to },
      summary: {
        transactionCount: transactions.length,
        paidTransactionCount: paidTransactions.length,
        revenue,
      },
      transactions,
    });
  } catch (error) {
    return errorResponse(error, "Load owner transaction report failed");
  }
}
