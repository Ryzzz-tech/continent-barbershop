import { getAuthenticatedAccount } from "@/lib/auth";
import {
  assertRole,
  BookingApiError,
  errorResponse,
  isRecord,
} from "@/lib/booking-api";
import { prisma } from "@/lib/prisma";

type CatalogKind = "Layanan" | "Produk";

function nextServiceId(ids: string[]) {
  const highest = ids.reduce((max, id) => {
    const match = /^L(\d{4})$/.exec(id);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  if (highest >= 9999) {
    throw new BookingApiError("Kapasitas ID layanan telah tercapai.", 503);
  }

  return `L${String(highest + 1).padStart(4, "0")}`;
}

function nextProductId(ids: string[]) {
  const highest = ids.reduce((max, id) => {
    const match = /^PR(\d{3})$/.exec(id);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  if (highest >= 999) {
    throw new BookingApiError("Kapasitas ID produk telah tercapai.", 503);
  }

  return `PR${String(highest + 1).padStart(3, "0")}`;
}

function validateInput(body: unknown) {
  if (
    !isRecord(body) ||
    typeof body.name !== "string" ||
    typeof body.kind !== "string" ||
    !["Layanan", "Produk"].includes(body.kind) ||
    typeof body.price !== "number" ||
    !Number.isSafeInteger(body.price) ||
    body.price <= 0 ||
    body.price > 9_999_999_999
  ) {
    throw new BookingApiError("Data katalog tidak valid.", 400);
  }

  const name = body.name.trim();
  const kind = body.kind as CatalogKind;

  if (!name || name.length > 100) {
    throw new BookingApiError(
      "Nama wajib diisi dan maksimal 100 karakter.",
      400,
    );
  }

  if (kind === "Layanan") {

  if (body.description !== undefined && typeof body.description !== "string") throw new BookingApiError("Deskripsi layanan tidak valid.", 400);
  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (description.length > 1000) throw new BookingApiError("Deskripsi maksimal 1000 karakter.", 400);
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

export async function GET() {
  try {
    assertRole(await getAuthenticatedAccount(), ["owner"]);

    const [services, products] = await Promise.all([
      prisma.layanan.findMany({
        orderBy: { id_layanan: "asc" },
      }),
      prisma.produk.findMany({
        orderBy: { id_produk: "asc" },
      }),
    ]);

    return Response.json({
      success: true,
      catalog: [
        ...services.map((item) => ({
          id: item.id_layanan,
          name: item.nama_layanan,
          kind: "Layanan" as const,
          price: Number(item.harga),
          duration: item.durasi,

          description: item.deskripsi ?? "",
          isActive: item.is_active,
        })),
        ...products.map((item) => ({
          id: item.id_produk,
          name: item.nama_produk,
          kind: "Produk" as const,
          price: Number(item.harga),
          stock: item.stok,
          unit: item.satuan,
          isActive: item.is_active,
        })),
      ].sort((a, b) => a.id.localeCompare(b.id)),
    });
  } catch (error) {
    return errorResponse(error, "Load owner catalog failed");
  }
}

export async function POST(request: Request) {
  try {
    assertRole(await getAuthenticatedAccount(), ["owner"]);

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      throw new BookingApiError("Format data katalog tidak valid.", 400);
    }

    const input = validateInput(body);

    const item = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${"owner-catalog:create"}))::text`;

      if (input.kind === "Layanan") {
        const existing = await tx.layanan.findMany({
          select: { id_layanan: true, nama_layanan: true },
        });

        const duplicate = existing.some(
          (entry) =>
            entry.nama_layanan.trim().toLocaleLowerCase("id-ID") ===
            input.name.toLocaleLowerCase("id-ID"),
        );

        if (duplicate) {
          throw new BookingApiError("Nama layanan sudah digunakan.", 409);
        }

        const id = nextServiceId(
          existing.map((entry) => entry.id_layanan),
        );

        const created = await tx.layanan.create({
          data: {
            id_layanan: id,
            nama_layanan: input.name,
            harga: input.price,
            durasi: input.duration,

            deskripsi: input.description || null,
            is_active: true,
          },
        });

        return {
          id: created.id_layanan,
          name: created.nama_layanan,
          kind: "Layanan" as const,
          price: Number(created.harga),
          duration: created.durasi,

          description: created.deskripsi ?? "",
          isActive: created.is_active,
        };
      }

      const existing = await tx.produk.findMany({
        select: { id_produk: true, nama_produk: true },
      });

      const duplicate = existing.some(
        (entry) =>
          entry.nama_produk.trim().toLocaleLowerCase("id-ID") ===
          input.name.toLocaleLowerCase("id-ID"),
      );

      if (duplicate) {
        throw new BookingApiError("Nama produk sudah digunakan.", 409);
      }

      const id = nextProductId(
        existing.map((entry) => entry.id_produk),
      );

      const created = await tx.produk.create({
        data: {
          id_produk: id,
          nama_produk: input.name,
          harga: input.price,
          stok: 0,
          satuan: input.unit,
          is_active: true,
        },
      });

      return {
        id: created.id_produk,
        name: created.nama_produk,
        kind: "Produk" as const,
        price: Number(created.harga),
        stock: created.stok,
        unit: created.satuan,
        isActive: created.is_active,
      };
    });

    return Response.json(
      {
        success: true,
        message: `${item.kind} berhasil ditambahkan.`,
        item,
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error, "Create owner catalog item failed");
  }
}
