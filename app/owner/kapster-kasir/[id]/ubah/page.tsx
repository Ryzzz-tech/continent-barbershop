import { Suspense } from "react";
import OwnerEmployeeForm from "../../employee-form";

async function EditOwnerEmployeeContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OwnerEmployeeForm employeeId={decodeURIComponent(id)} />;
}

export default function EditOwnerEmployeePage({
  params,
}: PageProps<"/owner/kapster-kasir/[id]/ubah">) {
  return (
    <Suspense fallback={<div className="cashier-page owner-page"><h1>Memuat formulir karyawan...</h1></div>}>
      <EditOwnerEmployeeContent params={params} />
    </Suspense>
  );
}
