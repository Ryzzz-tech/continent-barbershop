import { getAuthenticatedAccount } from "@/lib/auth";
import {
  assertRole,
  BookingApiError,
  errorResponse,
  isRecord,
  isValidStatusTransition,
} from "@/lib/booking-api";
import { prisma } from "@/lib/prisma";

const bookingInclude = {
  pelanggan: { select: { id_pelanggan: true, nama: true, no_hp: true } },
  kapster: { select: { id_kapster: true, nama: true } },
  layanan: { select: { id_layanan: true, nama_layanan: true, harga: true, durasi: true } },
  transaksi: { select: { id_transaksi: true, status_pembayaran: true, metode_pembayaran: true } },
} as const;

const bookingStatuses = ["Menunggu", "Dikonfirmasi", "Diproses", "Selesai", "Dibatalkan"] as const;

function isBookingStatus(value: string): value is (typeof bookingStatuses)[number] {
  return bookingStatuses.some((status) => status === value);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const account = assertRole(await getAuthenticatedAccount(), ["kapster"]);
    const { id } = await params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new BookingApiError("Format perubahan status tidak valid.", 400);
    }
    if (
      !isRecord(body) ||
      typeof body.status !== "string" ||
      (body.note !== undefined && typeof body.note !== "string")
    ) {
      throw new BookingApiError("Status booking tidak valid.", 400);
    }
    const nextStatus = body.status;
    if (!isBookingStatus(nextStatus)) {
      throw new BookingApiError("Status booking tidak valid.", 400);
    }
    const note = typeof body.note === "string" ? body.note.trim() : "";
    if (note.length > 100) {
      throw new BookingApiError("Catatan status maksimal 100 karakter.", 400);
    }

    const booking = await prisma.$transaction(async (tx) => {
      const current = await tx.booking.findFirst({
        where: { id_booking: id, id_kapster: account.profileId },
      });
      if (!current) throw new BookingApiError("Booking tidak ditemukan.", 404);
      if (!isValidStatusTransition(current.status, nextStatus)) {
        throw new BookingApiError(
          `Perubahan status dari ${current.status} ke ${nextStatus} tidak diizinkan.`,
          409,
        );
      }

      return tx.booking.update({
        where: { id_booking: id },
        data: { status: nextStatus, catatan_status: note || null },
        include: bookingInclude,
      });
    });

    return Response.json({
      success: true,
      booking: {
        id: booking.id_booking,
        status: booking.status,
        statusNote: booking.catatan_status ?? "",
        paymentStatus: booking.transaksi?.status_pembayaran ?? "Belum Dibayar",
      },
    });
  } catch (error) {
    return errorResponse(error, "Update booking status failed");
  }
}
