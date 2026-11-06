import type { ReactNode } from "react";
import OwnerShell from "./components/owner-shell";
import { OwnerPrototypeProvider } from "./owner-context";

export default function OwnerLayout({ children }: { children: ReactNode }) {
  return (
    <OwnerPrototypeProvider>
      <OwnerShell>{children}</OwnerShell>
    </OwnerPrototypeProvider>
  );
}
