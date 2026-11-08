import type { ReactNode } from "react";
import { Suspense } from "react";
import RoleAccess from "@/lib/role-access";
import { CashierPrototypeProvider } from "./cashier-context";
import CashierShell from "./components/cashier-shell";

export default function CashierLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <RoleAccess role="kasir">
        <CashierPrototypeProvider>
          <CashierShell>{children}</CashierShell>
        </CashierPrototypeProvider>
      </RoleAccess>
    </Suspense>
  );
}
