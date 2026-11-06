import type { ReactNode } from "react";
import { KapsterPrototypeProvider } from "./kapster-context";
import KapsterShell from "./components/kapster-shell";

export default function KapsterLayout({ children }: { children: ReactNode }) {
  return (
    <KapsterPrototypeProvider>
      <KapsterShell>{children}</KapsterShell>
    </KapsterPrototypeProvider>
  );
}
