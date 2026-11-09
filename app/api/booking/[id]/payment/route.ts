import { getAuthenticatedAccount } from "@/lib/auth";
import {
  assertRole,
  BookingApiError,
  currentJakartaDate,
  dateValue,
  errorResponse,
  isRecord,
  nextId,
} from "@/lib/booking-api";
import { prisma } from "@/lib/prisma";

const paymentMethods: Record<string, string> = {
  "bank-transfer": "Transfer Bank",
  qris: "QRIS",
  "e-wallet": "E-Wallet",
};

export async function POST(
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
      throw new BookingApiError("Format pembayaran tidak valid.", 400);
    }
    if (!isRecord(body) || typeof body.method !== "string") {
      throw new BookingApiError("Pilih metode pembayaran yang tersedia.", 400);
    }
    const method = body.method;
    if (!paymentMethods[method]) {
      throw new BookingApiError("Pilih metode pembayaran yang tersedia.", 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`payment:${id}`}))::text`;
      const booking = await tx.booking.findFirst({
        where: { id_booking: id, id_pelanggan: account.profileId },
        include: { layanan: { select: { nama_layanan: true, harga: true } } },
      });
      if (!booking) throw new BookingApiError("Booking tidak ditemukan.", 404);
      if (booking.status === "Dibatalkan") {
        throw new BookingApiError("Booking yang dibatalkan tidak dapat dibayar.", 409);
      }

      const existing = await tx.transaksi.findUnique({
        where: { id_booking: id },
        select: {
          id_transaksi: true,
          status_pembayaran: true,
          metode_pembayaran: true,
          total_harga: true,
        },
      });
      const price = booking.harga_snapshot ?? booking.layanan.harga;
      const serviceName = booking.nama_layanan_snapshot ?? booking.layanan.nama_layanan;
      if (existing) {
        if (existing.status_pembayaran === "Sudah Dibayar" || existing.status_pembayaran === "Lunas") {
          return { transaction: existing, alreadyPaid: true };
        }
        if (existing.total_harga.toString() !== price.toString()) {
          throw new BookingApiError(
            "Jumlah transaksi tertaut tidak sesuai dengan booking. Hubungi kasir untuk bantuan.",
            409,
          );
        }
        const updated = await tx.transaksi.update({
          where: { id_transaksi: existing.id_transaksi },
          data: {
            status_pembayaran: "Sudah Dibayar",
            metode_pembayaran: paymentMethods[method],
          },
          select: {
            id_transaksi: true,
            status_pembayaran: true,
            metode_pembayaran: true,
            total_harga: true,
          },
        });
        return { transaction: updated, alreadyPaid: false };
      }

      const transactionId = await nextId(tx, "transaction");
      const detailId = await nextId(tx, "detail");
      const transaction = await tx.transaksi.create({
        data: {
          id_transaksi: transactionId,
          tanggal_transaksi: dateValue(currentJakartaDate()),
          total_harga: price,
          metode_pembayaran: paymentMethods[method],
          status_pembayaran: "Sudah Dibayar",
          id_pelanggan: booking.id_pelanggan,
          id_kasir: null,
          id_booking: booking.id_booking,
          detail_transaksi: {
            create: {
              id_detail: detailId,
              jenis_item: "Jasa",
              jumlah: 1,
              harga_satuan: price,
              total: price,
              id_layanan: booking.id_layanan,
              nama_item_snapshot: serviceName,
            },
          },
        },
        select: {
          id_transaksi: true,
          status_pembayaran: true,
          metode_pembayaran: true,
          total_harga: true,
        },
      });
      return { transaction, alreadyPaid: false };
    });

    return Response.json({
      success: true,
      alreadyPaid: result.alreadyPaid,
      transaction: {
        id: result.transaction.id_transaksi,
        status: result.transaction.status_pembayaran,
        method: result.transaction.metode_pembayaran,
        total: Number(result.transaction.total_harga),
        simulation: true,
      },
    });
  } catch (error) {
    return errorResponse(error, "Simulated booking payment failed");
  }
}
