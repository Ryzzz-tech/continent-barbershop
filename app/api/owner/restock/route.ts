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

function nextRestockId(ids: string[]) {
  const highest = ids.reduce((max, id) => {
    const match = /^R(\d{4})$/.exec(id);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  if (highest >= 9999) {
    throw new BookingApiError("Kapasitas nomor restock telah tercapai.", 503);
  }

  return `R${String(highest + 1).padStart(4, "0")}`;
}

function nextRestockDetailId(ids: string[]) {
  const highest = ids.reduce((max, id) => {
    const match = /^DR(\d{3})$/.exec(id);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  if (highest >= 999) {
    throw new BookingApiError(
      "Kapasitas nomor detail restock telah tercapai.",
      503,
    );
  }

  return `DR${String(highest + 1).padStart(3, "0")}`;
}

export async function GET() {
  try {
    assertRole(await getAuthenticatedAccount(), ["owner"]);

    const products = await prisma.produk.findMany({
      orderBy: { id_produk: "asc" },
      select: {
        id_produk: true,
        nama_produk: true,
        harga: true,
        stok: true,
        satuan: true,
      },
    });

    return Response.json({
      success: true,
      products: products.map((product) => ({
        id: product.id_produk,
        name: product.nama_produk,
        sellingPrice: Number(product.harga),
        stock: product.stok,
        unit: product.satuan,
      })),
    });
  } catch (error) {
    return errorResponse(error, "Load owner restock products failed");
  }
}

export async function POST(request: Request) {
  try {
    const account = assertRole(await getAuthenticatedAccount(), ["owner"]);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new BookingApiError("Format data restock tidak valid.", 400);
    }

    if (
      !isRecord(body) ||
      typeof body.productId !== "string" ||
      !Number.isSafeInteger(body.quantity) ||
      typeof body.quantity !== "number" ||
      body.quantity <= 0 ||
      !Number.isSafeInteger(body.purchasePrice) ||
      typeof body.purchasePrice !== "number" ||
      body.purchasePrice <= 0
    ) {
      throw new BookingApiError(
        "Pilih produk serta masukkan jumlah dan harga beli satuan yang valid.",
        400,
      );
    }

    const quantity = body.quantity;
    const purchasePrice = body.purchasePrice;
    const subtotal = quantity * purchasePrice;

    if (
      !Number.isSafeInteger(subtotal) ||
      subtotal > 9_999_999_999
    ) {
      throw new BookingApiError(
        "Subtotal restock melebihi batas nominal yang diizinkan.",
        400,
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${"owner-restock:global"}))::text`;

      const product = await tx.produk.findUnique({
        where: { id_produk: body.productId as string },
        select: {
          id_produk: true,
          nama_produk: true,
          stok: true,
          satuan: true,
        },
      });

      if (!product) {
        throw new BookingApiError("Produk tidak ditemukan.", 404);
      }

      if (product.stok + quantity > 2_147_483_647) {
        throw new BookingApiError(
          "Jumlah stok melebihi kapasitas penyimpanan.",
          400,
        );
      }

      const [restockRows, detailRows] = await Promise.all([
        tx.restok.findMany({
          select: { id_restok: true },
        }),
        tx.detail_restok.findMany({
          select: { id_detail_restok: true },
        }),
      ]);

      const restockId = nextRestockId(
        restockRows.map((item) => item.id_restok),
      );
      const detailId = nextRestockDetailId(
        detailRows.map((item) => item.id_detail_restok),
      );

      const restock = await tx.restok.create({
        data: {
          id_restok: restockId,
          tanggal_restok: dateValue(currentJakartaDate()),
          keterangan: "Restock produk melalui aplikasi Owner",
          id_owner: account.profileId,
        },
      });

      await tx.detail_restok.create({
        data: {
          id_detail_restok: detailId,
          jumlah: quantity,
          harga_beli_satuan: purchasePrice,
          subtotal,
          id_produk: product.id_produk,
          id_restok: restock.id_restok,
        },
      });

      const updatedProduct = await tx.produk.update({
        where: { id_produk: product.id_produk },
        data: {
          stok: { increment: quantity },
        },
        select: {
          id_produk: true,
          nama_produk: true,
          stok: true,
          satuan: true,
          harga: true,
        },
      });

      return {
        restockId: restock.id_restok,
        detailId,
        date: restock.tanggal_restok.toISOString().slice(0, 10),
        product: {
          id: updatedProduct.id_produk,
          name: updatedProduct.nama_produk,
          stock: updatedProduct.stok,
          unit: updatedProduct.satuan,
          sellingPrice: Number(updatedProduct.harga),
        },
        quantity,
        purchasePrice,
        subtotal,
      };
    });

    return Response.json(
      {
        success: true,
        message: "Restock berhasil disimpan ke PostgreSQL.",
        restock: result,
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error, "Create owner restock failed");
  }
}
