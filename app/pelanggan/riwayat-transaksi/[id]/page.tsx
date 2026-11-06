import Link from "next/link";
import { Suspense } from "react";

type TransactionDetailPageProps = {
  params: Promise<{ id: string }>;
};

async function TransactionDetailContent({
  params,
}: TransactionDetailPageProps) {
  const { id } = await params;

  return (
    <div className="customer-page">
      <Link className="customer-back-link" href="/pelanggan/riwayat-transaksi">
        <span aria-hidden="true">←</span> Kembali ke Riwayat Transaksi
      </Link>
      <header className="customer-page-heading">
        <h1>DETAIL TRANSAKSI</h1>
      </header>
      <div className="customer-empty-state">
        <span className="empty-state-icon" aria-hidden="true">▤</span>
        <h2>Detail transaksi tidak tersedia</h2>
        <p>
          Transaksi dengan referensi <strong>{id}</strong> tidak ditemukan.
          Prototipe belum memiliki transaksi tersimpan.
        </p>
        <Link
          className="customer-primary-button"
          href="/pelanggan/riwayat-transaksi"
        >
          Lihat Riwayat Transaksi
        </Link>
      </div>
    </div>
  );
}

export default function TransactionDetailPage(
  props: TransactionDetailPageProps,
) {
  return (
    <Suspense
      fallback={
        <div className="customer-page" aria-busy="true">
          <p>Memuat detail transaksi...</p>
        </div>
      }
    >
      <TransactionDetailContent {...props} />
    </Suspense>
  );
}
