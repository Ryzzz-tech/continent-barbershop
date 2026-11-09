import { Suspense } from "react";
import CustomerAuthPage from "../components/customer-auth-page";

export default function CustomerRegistrationPage() {
  return (
    <Suspense
      fallback={
        <main className="auth-main auth-main--register" aria-busy="true">
          <div className="auth-form-shell auth-form-shell--register">
            <p>Menyiapkan halaman registrasi...</p>
          </div>
        </main>
      }
    >
      <CustomerAuthPage variant="register" />
    </Suspense>
  );
}
