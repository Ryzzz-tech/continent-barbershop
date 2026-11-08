import type { ReactNode } from "react";
import { Suspense } from "react";
import RoleAccess from "@/lib/role-access";
import OwnerShell from "./components/owner-shell";

export default function OwnerLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <RoleAccess role="owner">
        <OwnerShell>{children}</OwnerShell>
      </RoleAccess>
    </Suspense>
  );
}
