import Link from "next/link";
import { Suspense } from "react";

type BookingDetailPageProps = {
  params: Promise<{ id: string }>;
};

async function BookingDetailContent({
  params,
}: BookingDetailPageProps) {
  const { id } = await params;

  return (
    <div className="customer-page">
      <Link className="customer-back-link" href="/pelanggan/booking">
        <span aria-hidden="true">←</span> Kembali ke Booking Saya
      </Link>
      <header className="customer-page-heading">
        <h1>DETAIL BOOKING</h1>
      </header>
      <div className="customer-empty-state">
        <span className="empty-state-icon" aria-hidden="true">▣</span>
        <h2>Detail booking tidak tersedia</h2>
        <p>
          Booking dengan referensi <strong>{id}</strong> tidak ditemukan pada
          data prototipe. Belum ada koneksi ke data booking tersimpan.
        </p>
        <Link className="customer-primary-button" href="/pelanggan/booking">
          Lihat Booking Saya
        </Link>
      </div>
    </div>
  );
}

export default function BookingDetailPage(props: BookingDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="customer-page" aria-busy="true">
          <p>Memuat detail booking...</p>
        </div>
      }
    >
      <BookingDetailContent {...props} />
    </Suspense>
  );
}
