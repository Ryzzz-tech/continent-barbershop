import { Suspense } from "react";
import OwnerCatalogForm from "../../catalog-form";

async function EditOwnerCatalogItemContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OwnerCatalogForm itemId={decodeURIComponent(id)} />;
}

export default function EditOwnerCatalogItemPage({
  params,
}: PageProps<"/owner/layanan-produk/[id]/ubah">) {
  return (
    <Suspense fallback={<div className="cashier-page owner-page"><h1>Memuat formulir katalog...</h1></div>}>
      <EditOwnerCatalogItemContent params={params} />
    </Suspense>
  );
}
