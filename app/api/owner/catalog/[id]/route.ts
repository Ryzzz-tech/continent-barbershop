import { getAuthenticatedAccount } from "@/lib/auth";
import {
  assertRole,
  BookingApiError,
  errorResponse,
  isRecord,
} from "@/lib/booking-api";
import { prisma } from "@/lib/prisma";

type CatalogKind = "Layanan" | "Produk";

function getCatalogKind(id: string): CatalogKind {
  if (/^L\d{4}$/.test(id)) return "Layanan";
  if (/^PR\d{3}$/.test(id)) return "Produk";
  throw new BookingApiError("ID katalog tidak valid.", 400);
}

function validateInput(body: unknown, kind: CatalogKind) {
  if (
    !isRecord(body) ||
    body.kind !== kind ||
    typeof body.name !== "string" ||
    typeof body.price !== "number" ||
    !Number.isSafeInteger(body.price) ||
    body.price <= 0 ||
    body.price > 9_999_999_999
  ) {
    throw new BookingApiError("Data katalog tidak valid.", 400);
  }

  const name = body.name.trim();

  if (!name || name.length > 100) {
    throw new BookingApiError(
      "Nama wajib diisi dan maksimal 100 karakter.",
      400,
    );
  }

  if (kind === "Layanan") {
    if (body.description !== undefined && typeof body.description !== "string") {
      throw new BookingApiError("Deskripsi layanan tidak valid.", 400);
    }
    const description = typeof body.description === "string" ? body.description.trim() : undefined;
    if ((description?.length ?? 0) > 1000) {
      throw new BookingApiError("Deskripsi maksimal 1000 karakter.", 400);
    }
    if (
      typeof body.duration !== "number" ||
      !Number.isSafeInteger(body.duration) ||
      body.duration < 1 ||
      body.duration > 1440
    ) {
      throw new BookingApiError(
        "Durasi layanan harus berupa bilangan bulat 1 sampai 1440 menit.",
        400,
      );
    }

    return {
      name,
      kind,
      price: body.price,
      duration: body.duration,
      description,
    };
  }

  if (
    typeof body.unit !== "string" ||
    !body.unit.trim() ||
    body.unit.trim().length > 20
  ) {
    throw new BookingApiError(
      "Satuan produk wajib diisi dan maksimal 20 karakter.",
      400,
    );
  }

  return {
    name,
    kind,
    price: body.price,
    unit: body.unit.trim(),
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertRole(await getAuthenticatedAccount(), ["owner"]);

    const { id } = await params;
    const kind = getCatalogKind(id);

    if (kind === "Layanan") {
      const item = await prisma.layanan.findUnique({
        where: { id_layanan: id },
      });

      if (!item) {
        throw new BookingApiError("Layanan tidak ditemukan.", 404);
      }

      return Response.json({
        success: true,
        item: {
          id: item.id_layanan,
          name: item.nama_layanan,
          kind,
          price: Number(item.harga),
          duration: item.durasi,
          description: item.deskripsi ?? "",
          isActive: item.is_active,
        },
      });
    }

    const item = await prisma.produk.findUnique({
      where: { id_produk: id },
    });

    if (!item) {
      throw new BookingApiError("Produk tidak ditemukan.", 404);
    }

    return Response.json({
      success: true,
      item: {
        id: item.id_produk,
        name: item.nama_produk,
        kind,
        price: Number(item.harga),
        stock: item.stok,
        unit: item.satuan,
        isActive: item.is_active,
      },
    });
  } catch (error) {
    return errorResponse(error, "Load owner catalog detail failed");
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertRole(await getAuthenticatedAccount(), ["owner"]);

    const { id } = await params;
    const kind = getCatalogKind(id);

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      throw new BookingApiError("Format data katalog tidak valid.", 400);
    }

    const input = validateInput(body, kind);

    const item = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${"owner-catalog:global"}))::text`;

      if (input.kind === "Layanan") {
        const current = await tx.layanan.findUnique({
          where: { id_layanan: id },
        });

        if (!current) {
          throw new BookingApiError("Layanan tidak ditemukan.", 404);
        }

        const existing = await tx.layanan.findMany({
          where: { NOT: { id_layanan: id } },
          select: { nama_layanan: true },
        });

        if (
          existing.some(
            (entry) =>
              entry.nama_layanan.trim().toLocaleLowerCase("id-ID") ===
              input.name.toLocaleLowerCase("id-ID"),
          )
        ) {
          throw new BookingApiError("Nama layanan sudah digunakan.", 409);
        }

        const updated = await tx.layanan.update({
          where: { id_layanan: id },
          data: {
            nama_layanan: input.name,
            harga: input.price,
            durasi: input.duration,
            deskripsi: input.description === undefined ? current.deskripsi : input.description || null,
            is_active: current.is_active,
          },
        });

        return {
          id: updated.id_layanan,
          name: updated.nama_layanan,
          kind: "Layanan" as const,
          price: Number(updated.harga),
          duration: updated.durasi,
          description: updated.deskripsi ?? "",
          isActive: updated.is_active,
        };
      }

      const current = await tx.produk.findUnique({
        where: { id_produk: id },
      });

      if (!current) {
        throw new BookingApiError("Produk tidak ditemukan.", 404);
      }

      const existing = await tx.produk.findMany({
        where: { NOT: { id_produk: id } },
        select: { nama_produk: true },
      });

      if (
        existing.some(
          (entry) =>
            entry.nama_produk.trim().toLocaleLowerCase("id-ID") ===
            input.name.toLocaleLowerCase("id-ID"),
        )
      ) {
        throw new BookingApiError("Nama produk sudah digunakan.", 409);
      }

      const updated = await tx.produk.update({
        where: { id_produk: id },
        data: {
          nama_produk: input.name,
          harga: input.price,
          satuan: input.unit,
          is_active: current.is_active,
        },
      });

      return {
        id: updated.id_produk,
        name: updated.nama_produk,
        kind: "Produk" as const,
        price: Number(updated.harga),
        stock: updated.stok,
        unit: updated.satuan,
        isActive: updated.is_active,
      };
    });

    return Response.json({
      success: true,
      message: `${item.kind} berhasil diperbarui.`,
      item,
    });
  } catch (error) {
    return errorResponse(error, "Update owner catalog item failed");
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertRole(await getAuthenticatedAccount(), ["owner"]);

    const { id } = await params;
    const kind = getCatalogKind(id);

    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${"owner-catalog:global"}))::text`;

      if (kind === "Layanan") {
        const current = await tx.layanan.findUnique({
          where: { id_layanan: id },
        });

        if (!current) {
          throw new BookingApiError("Layanan tidak ditemukan.", 404);
        }

        const updated = await tx.layanan.update({
          where: { id_layanan: id },
          data: { is_active: false },
        });

        return {
          kind,
          id: updated.id_layanan,
          message: "Layanan berhasil dinonaktifkan. Riwayat booking dan transaksi tetap dipertahankan.",
        };
      }

      const current = await tx.produk.findUnique({
        where: { id_produk: id },
        include: {
          _count: {
            select: {
              detail_restok: true,
              detail_transaksi: true,
              penyesuaian_stok: true,
            },
          },
        },
      });

      if (!current) {
        throw new BookingApiError("Produk tidak ditemukan.", 404);
      }

      if (
        current.stok > 0 ||
        current._count.detail_restok > 0 ||
        current._count.detail_transaksi > 0 ||
        current._count.penyesuaian_stok > 0
      ) {
        const archived = await tx.produk.update({
          where: { id_produk: id },
          data: { is_active: false },
        });

        return {
          kind,
          id: archived.id_produk,
          message: "Produk berhasil diarsipkan. Stok dan riwayat historis tetap dipertahankan.",
        };
      }

      await tx.produk.delete({
        where: { id_produk: id },
      });

      return {
        kind,
        id,
        message: "Produk berhasil dihapus.",
      };
    });

    return Response.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return errorResponse(error, "Delete owner catalog item failed");
  }
}
