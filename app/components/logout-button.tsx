"use client";

import { useState, type ReactNode } from "react";

export default function LogoutButton({
  children,
  onError,
  redirectTo = "/login",
}: {
  children: ReactNode;
  onError: (message: string) => void;
  redirectTo?: string;
}) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function logout() {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Sesi belum dapat diakhiri. Silakan coba kembali.");
      }

      window.location.replace(redirectTo);
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : "Sesi belum dapat diakhiri. Silakan coba kembali.",
      );
      setIsLoggingOut(false);
    }
  }

  return (
    <button disabled={isLoggingOut} onClick={logout} type="button">
      {isLoggingOut ? "Keluar..." : children}
    </button>
  );
}
