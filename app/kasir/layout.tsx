import type { ReactNode } from "react";
import { CashierPrototypeProvider } from "./cashier-context";
import CashierShell from "./components/cashier-shell";

export default function CashierLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <CashierPrototypeProvider>
      <CashierShell>{children}</CashierShell>
    </CashierPrototypeProvider>
  );
}
