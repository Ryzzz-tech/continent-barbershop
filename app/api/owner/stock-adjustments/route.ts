import { getAuthenticatedAccount } from "@/lib/auth";
import {
  assertRole,
  BookingApiError,
  currentJakartaDate,
  dateValue,
  errorResponse,
  isRecord,
} from "@/lib/booking-api";
import { prisma } from "@/lib/prisma";

function nextAdjustmentId(ids: string[]) {
  const highest = ids.reduce((max, id) => {
    const match = /^SA(\d{3})$/.exec(id);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  if (highest >= 999) {
    throw new BookingApiError("Kapasitas nomor penyesuaian stok telah tercapai.", 503);
  }

  return `SA${String(highest + 1).padStart(3, "0")}`;
}

export async function GET() {
  try {
    assertRole(await getAuthenticatedAccount(), ["owner"]);

    const products = await prisma.produk.findMany({
      where: { is_active: true },
      orderBy: { id_produk: "asc" },
      select: {
        id_produk: true,
        nama_produk: true,
        stok: true,
        satuan: true,
        is_active: true,
      },
    });

    return Response.json({
      success: true,
      products: products.map((product) => ({
        id: product.id_produk,
        name: product.nama_produk,
        stock: product.stok,
        unit: product.satuan,
        isActive: product.is_active,
      })),
    });
  } catch (error) {
    return errorResponse(error, "Load stock adjustments failed");
  }
}

export async function POST(request: Request) {
  try {
    const account = assertRole(await getAuthenticatedAccount(), ["owner"]);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new BookingApiError("Format data penyesuaian stok tidak valid.", 400);
    }

    if (
      !isRecord(body) ||
      typeof body.productId !== "string" ||
      (body.type !== "Penambahan" && body.type !== "Pengurangan") ||
      typeof body.reason !== "string" ||
      !Number.isSafeInteger(body.quantity) ||
      typeof body.quantity !== "number" ||
      body.quantity <= 0
    ) {
      throw new BookingApiError(
        "Pilih produk, tentukan jenis penyesuaian, masukkan jumlah yang valid, serta alasan yang jelas.",
        400,
      );
    }

    const quantity = body.quantity;
    const reason = body.reason.trim();
    const adjustmentType = body.type as "Penambahan" | "Pengurangan";

    if (!reason || reason.length > 100) {
      throw new BookingApiError("Alasan penyesuaian harus diisi maksimal 100 karakter.", 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${"owner-stock-adjustment:global"}))::text`;

      const product = await tx.produk.findUnique({
        where: { id_produk: body.productId as string },
        select: {
          id_produk: true,
          nama_produk: true,
          stok: true,
          satuan: true,
          is_active: true,
        },
      });

      if (!product) {
        throw new BookingApiError("Produk tidak ditemukan.", 404);
      }

      if (!product.is_active) {
        throw new BookingApiError("Produk yang sudah dinonaktifkan tidak dapat disesuaikan stoknya.", 409);
      }

      const beforeStock = product.stok;
      const nextStock =
        adjustmentType === "Penambahan"
          ? beforeStock + quantity
          : beforeStock - quantity;

      if (nextStock < 0) {
        throw new BookingApiError("Pengurangan stok tidak dapat melebihi stok yang tersedia.", 400);
      }

      if (nextStock > 2_147_483_647) {
        throw new BookingApiError("Jumlah stok akhir melebihi kapasitas penyimpanan.", 400);
      }

      const ids = await tx.penyesuaian_stok.findMany({
        select: { id_penyesuaian_stok: true },
      });

      const adjustmentId = nextAdjustmentId(
        ids.map((item) => item.id_penyesuaian_stok),
      );

      const adjustment = await tx.penyesuaian_stok.create({
        data: {
          id_penyesuaian_stok: adjustmentId,
          tanggal: dateValue(currentJakartaDate()),
          jenis: adjustmentType,
          jumlah: quantity,
          alasan: reason,
          stok_sebelum: beforeStock,
          stok_sesudah: nextStock,
          id_produk: product.id_produk,
          id_owner: account.profileId,
        },
      });

      const updated = await tx.produk.update({
        where: { id_produk: product.id_produk },
        data: { stok: nextStock },
        select: {
          id_produk: true,
          nama_produk: true,
          stok: true,
          satuan: true,
          is_active: true,
        },
      });

      return {
        id: adjustment.id_penyesuaian_stok,
        type: adjustment.jenis,
        quantity: adjustment.jumlah,
        reason: adjustment.alasan,
        beforeStock: adjustment.stok_sebelum,
        afterStock: adjustment.stok_sesudah,
        product: {
          id: updated.id_produk,
          name: updated.nama_produk,
          stock: updated.stok,
          unit: updated.satuan,
          isActive: updated.is_active,
        },
      };
    });

    return Response.json({
      success: true,
      message: `Penyesuaian stok ${result.type.toLowerCase()} berhasil disimpan.`,
      adjustment: result,
    }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Create stock adjustment failed");
  }
}
