import { getAuthenticatedAccount } from "@/lib/auth";
import { assertRole, BookingApiError, errorResponse, isRecord } from "@/lib/booking-api";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const account = assertRole(await getAuthenticatedAccount(), ["pelanggan"]);
    const { id } = await params;
    let body: unknown = {};
    try {
      body = await request.json();
    } catch (error) {
      if (!(error instanceof SyntaxError)) {
        throw new BookingApiError("Permintaan pembatalan tidak valid.", 400);
      }
    }
    if (!isRecord(body)) throw new BookingApiError("Permintaan pembatalan tidak valid.", 400);

    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`payment:${id}`}))::text`;
      return tx.booking.updateMany({
        where: {
          id_booking: id,
          id_pelanggan: account.profileId,
          status: { in: ["Menunggu", "Dikonfirmasi"] },
          transaksi: { is: null },
        },
        data: { status: "Dibatalkan" },
      });
    });
    if (result.count !== 1) {
      throw new BookingApiError("Booking tidak ditemukan atau tidak dapat dibatalkan.", 409);
    }
    return Response.json({ success: true, message: "Booking berhasil dibatalkan." });
  } catch (error) {
    return errorResponse(error, "Cancel booking failed");
  }
}
