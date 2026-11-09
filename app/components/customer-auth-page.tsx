"use client";

import { useSearchParams } from "next/navigation";
import AuthPage from "./auth-page";
import { safeCustomerReturnPath } from "@/lib/customer-return-path";

type CustomerAuthPageProps = {
  variant: "customer" | "register";
};

export default function CustomerAuthPage({
  variant,
}: CustomerAuthPageProps) {
  const searchParams = useSearchParams();
  const redirectTo = safeCustomerReturnPath(searchParams.get("next"));

  return <AuthPage variant={variant} redirectTo={redirectTo} />;
}
