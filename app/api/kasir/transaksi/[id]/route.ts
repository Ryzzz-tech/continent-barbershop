import { getAuthenticatedAccount } from "@/lib/auth";
import {
  assertRole,
  BookingApiError,
  errorResponse,
} from "@/lib/booking-api";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertRole(await getAuthenticatedAccount(), ["kasir"]);

    const { id } = await params;

    const transaction = await prisma.transaksi.findUnique({
      where: { id_transaksi: id },
      include: {
        pelanggan: {
          select: { nama: true },
        },
        kasir: {
          select: { nama: true },
        },
        booking: {
          select: { id_booking: true },
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
    });

    if (!transaction) {
      throw new BookingApiError("Transaksi tidak ditemukan.", 404);
    }

    return Response.json({
      success: true,
      transaction: {
        id: transaction.id_transaksi,
        date: transaction.tanggal_transaksi.toISOString().slice(0, 10),
        total: Number(transaction.total_harga),
        paymentMethod: transaction.metode_pembayaran,
        paymentStatus: transaction.status_pembayaran,
        customerName: transaction.pelanggan.nama,
        cashierName: transaction.kasir?.nama ?? "Tidak tercatat",
        bookingId: transaction.booking?.id_booking ?? null,
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
      },
    });
  } catch (error) {
    return errorResponse(error, "Load cashier transaction detail failed");
  }
}
