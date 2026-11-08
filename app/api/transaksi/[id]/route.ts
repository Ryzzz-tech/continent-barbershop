import { getAuthenticatedAccount } from "@/lib/auth";
import { assertRole, BookingApiError, errorResponse } from "@/lib/booking-api";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const account = assertRole(await getAuthenticatedAccount(), ["pelanggan"]);
    const { id } = await params;
    const transaction = await prisma.transaksi.findFirst({
      where: { id_transaksi: id, id_pelanggan: account.profileId },
      include: {
        booking: {
          select: {
            id_booking: true,
            nama_layanan_snapshot: true,
            layanan: { select: { nama_layanan: true } },
          },
        },
        detail_transaksi: {
          select: {
            id_detail: true,
            nama_item_snapshot: true,
            jenis_item: true,
            jumlah: true,
            harga_satuan: true,
            total: true,
          },
        },
      },
    });
    if (!transaction) throw new BookingApiError("Transaksi tidak ditemukan.", 404);
    return Response.json({
      success: true,
      transaction: {
        id: transaction.id_transaksi,
        date: transaction.tanggal_transaksi.toISOString().slice(0, 10),
        total: Number(transaction.total_harga),
        paymentMethod: transaction.metode_pembayaran,
        paymentStatus: transaction.status_pembayaran,
        bookingId: transaction.booking?.id_booking ?? null,
        items: transaction.detail_transaksi.map((item) => ({
          id: item.id_detail,
          name:
            item.nama_item_snapshot ??
            (item.jenis_item === "Jasa"
              ? transaction.booking?.nama_layanan_snapshot ??
                transaction.booking?.layanan.nama_layanan ??
                "Layanan"
              : item.jenis_item),
          quantity: item.jumlah,
          price: Number(item.harga_satuan),
          total: Number(item.total),
        })),
      },
    });
  } catch (error) {
    return errorResponse(error, "Load transaction detail failed");
  }
}
