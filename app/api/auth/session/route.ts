import {
  clearSession,
  getAuthenticatedAccount,
  readSessionToken,
} from "@/lib/auth";

export async function GET() {
  const token = await readSessionToken();
  try {
    const account = await getAuthenticatedAccount(token);
    if (!account) {
      await clearSession();
      return Response.json(
        { success: false, message: "Sesi tidak valid atau telah berakhir." },
        { status: 401 },
      );
    }

    return Response.json({ success: true, account });
  } catch (error) {
    console.error("Session verification failed:", error);
    return Response.json(
      { success: false, message: "Sesi tidak dapat diperiksa saat ini." },
      { status: 500 },
    );
  }
}
