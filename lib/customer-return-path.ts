const INTERNAL_ORIGIN = "https://continent-barbershop.invalid";

export function safeCustomerReturnPath(value: unknown): string | undefined {
  if (
    typeof value !== "string" ||
    value.length > 2048 ||
    !value.startsWith("/pelanggan/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return undefined;
  }

  try {
    const target = new URL(value, INTERNAL_ORIGIN);

    if (
      target.origin !== INTERNAL_ORIGIN ||
      !target.pathname.startsWith("/pelanggan/")
    ) {
      return undefined;
    }

    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return undefined;
  }
}
