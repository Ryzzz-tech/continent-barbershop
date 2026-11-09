import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken, type AccountRole } from "@/lib/session-token";

const roleByPrefix: Record<string, AccountRole> = {
  "/owner": "owner",
  "/kasir": "kasir",
  "/kapster": "kapster",
  "/pelanggan": "pelanggan",
};
const dashboardByRole: Record<AccountRole, string> = {
  owner: "/owner",
  kasir: "/kasir",
  kapster: "/kapster",
  pelanggan: "/pelanggan",
};

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  return response;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const protectedPrefix = Object.keys(roleByPrefix).find(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!protectedPrefix) return NextResponse.next();

  const requiredRole = roleByPrefix[protectedPrefix];
  const token = request.cookies.get("continent_session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    const loginPath = requiredRole === "pelanggan" ? "/login" : "/karyawan/login";
    const loginUrl = new URL(loginPath, request.url);
    if (requiredRole === "pelanggan") {
      loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    }
    return noStore(NextResponse.redirect(loginUrl));
  }
  if (session.role !== requiredRole) {
    return noStore(
      NextResponse.redirect(new URL(dashboardByRole[session.role], request.url)),
    );
  }

  return noStore(NextResponse.next());
}

export const config = {
  matcher: ["/owner/:path*", "/kasir/:path*", "/kapster/:path*", "/pelanggan/:path*"],
};
