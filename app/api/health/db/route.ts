import { getAuthenticatedAccount } from "@/lib/auth";
import { assertRole, errorResponse } from "@/lib/booking-api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    assertRole(await getAuthenticatedAccount(), ["owner"]);

    await prisma.$queryRaw`SELECT 1`;

    return Response.json(
      {
        success: true,
        message: "Koneksi PostgreSQL berhasil.",
        database: "connected",
      },
      {
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  } catch (error) {
    return errorResponse(error, "Database health check failed");
  }
}
