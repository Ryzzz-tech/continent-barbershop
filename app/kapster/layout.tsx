import type { ReactNode } from "react";
import { Suspense } from "react";
import RoleAccess from "@/lib/role-access";
import KapsterShell from "./components/kapster-shell";

export default function KapsterLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <RoleAccess role="kapster">
        <KapsterShell>{children}</KapsterShell>
      </RoleAccess>
    </Suspense>
  );
}
