import type { ReactNode } from "react";
import { Suspense } from "react";
import RoleAccess from "@/lib/role-access";
import CustomerShell from "./components/customer-shell";

export default function PelangganLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <RoleAccess role="pelanggan">
        <CustomerShell>{children}</CustomerShell>
      </RoleAccess>
    </Suspense>
  );
}
