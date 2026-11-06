import { Suspense } from "react";
import CashierCustomerForm from "../customer-form";

async function EditCashierCustomerContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CashierCustomerForm customerId={decodeURIComponent(id)} />;
}

export default function EditCashierCustomerPage({
  params,
}: PageProps<"/kasir/pelanggan/[id]">) {
  return (
    <Suspense
      fallback={
        <div className="cashier-page">
          <h1>Memuat data pelanggan...</h1>
        </div>
      }
    >
      <EditCashierCustomerContent params={params} />
    </Suspense>
  );
}
