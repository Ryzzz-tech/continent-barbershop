import { getAuthenticatedAccount } from "@/lib/auth";
import { assertRole, errorResponse } from "@/lib/booking-api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const account = assertRole(await getAuthenticatedAccount(), ["pelanggan", "kasir"]);

    const [services, barbers, customers] = await Promise.all([
      prisma.layanan.findMany({
        where: { is_active: true },
        orderBy: { id_layanan: "asc" },
        select: {
          id_layanan: true,
          nama_layanan: true,
          harga: true,
          durasi: true,
        },
      }),
      prisma.kapster.findMany({
        where: { status: "Aktif" },
        orderBy: { nama: "asc" },
        select: { id_kapster: true, nama: true },
      }),
      account.role === "kasir"
        ? prisma.pelanggan.findMany({
            orderBy: { nama: "asc" },
            select: { id_pelanggan: true, nama: true },
          })
        : Promise.resolve([]),
    ]);

    return Response.json({
      success: true,
      services: services.map((service) => ({
        id: service.id_layanan,
        name: service.nama_layanan,
        price: Number(service.harga),
        duration: service.durasi,
      })),
      barbers: barbers.map((barber) => ({
        id: barber.id_kapster,
        name: barber.nama,
      })),
      customers: customers.map((customer) => ({
        id: customer.id_pelanggan,
        name: customer.nama,
      })),
    });
  } catch (error) {
    return errorResponse(error, "Load booking options failed");
  }
}
