import { Suspense } from "react";
import CustomerAuthPage from "../components/customer-auth-page";

export default function CustomerLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="auth-main auth-main--customer" aria-busy="true">
          <div className="auth-form-shell auth-form-shell--customer">
            <p>Menyiapkan halaman login...</p>
          </div>
        </main>
      }
    >
      <CustomerAuthPage variant="customer" />
    </Suspense>
  );
}
