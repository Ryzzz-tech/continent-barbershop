"use client";

import Link from "next/link";
import { customerServices } from "../../../../lib/data/services";
import { formatRupiah, formatTanggal } from "../../../pelanggan/data";
import { useKapsterPrototype } from "../../kapster-context";
import {
  getBookingStatusLabel,
  KapsterPageHeading,
  KapsterPrototypeNote,
} from "../../kapster-ui";

export default function KapsterBookingDetail({
  bookingId,
}: {
  bookingId: string;
}) {
  const { getBooking } = useKapsterPrototype();
  const booking = getBooking(bookingId);

  if (!booking) {
    return (
      <div className="cashier-page kapster-page">
        <KapsterPageHeading title="Detail Booking" />
        <div className="cashier-empty-state kapster-empty-state kapster-empty-state--card">
          <h2>Booking tidak ditemukan</h2>
          <p>
            ID booking tidak valid atau booking ini tidak ditugaskan kepada
            Kapster yang sedang aktif.
          </p>
          <Link className="cashier-button kapster-button kapster-button--primary" href="/kapster/booking">
            Kembali ke Daftar Booking
          </Link>
        </div>
      </div>
    );
  }

  const service = customerServices.find(
    (item) => item.id === booking.serviceId,
  );

  return (
    <div className="cashier-page kapster-page">
      <KapsterPageHeading
        title="Detail Booking"
        description="Informasi booking dan pelanggan yang ditugaskan kepada Anda."
      >
        <Link className="kapster-text-link" href="/kapster/booking">← Kembali</Link>
      </KapsterPageHeading>
      <KapsterPrototypeNote>
        Detail ini merupakan data prototipe. Informasi pelanggan dan rincian
        booking hanya dapat dilihat, bukan diubah.
      </KapsterPrototypeNote>
      <div className="kapster-detail-grid">
        <section className="cashier-panel kapster-panel">
          <div className="kapster-panel-heading">
            <h2>Informasi Booking</h2>
            <span className={`kapster-status kapster-status--${booking.status}`}>
              {getBookingStatusLabel(booking.status)}
            </span>
          </div>
          <dl className="kapster-detail-list">
            <div><dt>ID Booking</dt><dd>{booking.id}</dd></div>
            <div><dt>Tanggal</dt><dd>{formatTanggal(booking.date)}</dd></div>
            <div><dt>Waktu</dt><dd>{booking.time} WIB</dd></div>
            <div><dt>Layanan</dt><dd>{service?.name ?? "Layanan tidak tersedia"}</dd></div>
            <div><dt>Harga</dt><dd>{service ? formatRupiah(service.price) : "—"}</dd></div>
          </dl>
          <Link
            className="cashier-button kapster-button kapster-button--primary kapster-detail-action"
            href={`/kapster/booking/${encodeURIComponent(booking.id)}/status`}
          >
            Ubah Status
          </Link>
        </section>

        <aside className="cashier-panel kapster-panel">
          <h2>Informasi Pelanggan</h2>
          <dl className="kapster-detail-list">
            <div><dt>Nama Pelanggan</dt><dd>{booking.customerName}</dd></div>
            <div><dt>Nomor HP</dt><dd>{booking.customerPhone || "Belum tersedia"}</dd></div>
          </dl>
          <div className="kapster-note-card">
            <strong>Catatan Pelanggan</strong>
            <p>{booking.customerNote.trim() || "Tidak ada catatan tambahan."}</p>
          </div>
          {booking.statusNote && (
            <div className="kapster-note-card kapster-note-card--status">
              <strong>Catatan Kapster</strong>
              <p>{booking.statusNote}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
