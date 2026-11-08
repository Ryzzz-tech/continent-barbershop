import "server-only";

import type { ReactNode } from "react";
import { requireAccountRole, type AccountRole } from "./auth";

export default async function RoleAccess({
  role,
  children,
}: {
  role: AccountRole;
  children: ReactNode;
}) {
  await requireAccountRole(role);
  return children;
}
