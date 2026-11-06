"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { customerServices } from "../../../../../lib/data/services";
import { formatRupiah } from "../../../../pelanggan/data";
import { useKapsterPrototype } from "../../../kapster-context";
import {
  bookingStatuses,
  getBookingStatusLabel,
  KapsterPageHeading,
} from "../../../kapster-ui";
import type { BookingStatus } from "../../../prototype-types";

export default function KapsterBookingStatusForm({
  bookingId,
}: {
  bookingId: string;
}) {
  const router = useRouter();
  const {
    getBooking,
    updateBookingStatus,
    announce,
  } = useKapsterPrototype();
  const booking = getBooking(bookingId);
  const [status, setStatus] = useState<BookingStatus | "">(
    booking?.status ?? "",
  );
  const [note, setNote] = useState(booking?.statusNote ?? "");
  const [error, setError] = useState("");

  if (!booking) {
    return (
      <div className="cashier-page kapster-page">
        <KapsterPageHeading title="Ubah Status Booking" />
        <div className="cashier-empty-state kapster-empty-state kapster-empty-state--card">
          <h2>Booking tidak ditemukan</h2>
          <p>Perubahan status memerlukan booking yang ditugaskan kepada Anda.</p>
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

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!status || !booking) {
      setError("Pilih status booking sebelum menyimpan.");
      return;
    }

    if (
      status === "cancelled" &&
      status !== booking.status &&
      !window.confirm(`Batalkan booking ${booking.id}?`)
    ) {
      return;
    }

    if (!updateBookingStatus(booking.id, status, note.trim())) {
      setError("Booking tidak ditemukan atau tidak ditugaskan kepada Anda.");
      return;
    }

    announce(`Status booking ${booking.id} diperbarui menjadi ${getBookingStatusLabel(status)} pada prototipe.`);
    router.push(`/kapster/booking/${encodeURIComponent(booking.id)}`);
  }

  return (
    <div className="cashier-page kapster-page">
      <KapsterPageHeading
        title="Ubah Status Booking"
        description="Pilih status pelayanan untuk booking ini."
      >
        <Link
          className="kapster-text-link"
          href={`/kapster/booking/${encodeURIComponent(booking.id)}`}
        >
          ← Kembali
        </Link>
      </KapsterPageHeading>
      <form className="kapster-status-edit-grid" onSubmit={submit} noValidate>
        <section className="cashier-panel kapster-panel">
          <h2>Pilih Status</h2>
          <fieldset className="kapster-status-options">
            <legend className="kapster-visually-hidden">Status pelayanan</legend>
            {bookingStatuses.map((item) => (
              <label
                className={`kapster-status-option${status === item.id ? " is-selected" : ""}`}
                key={item.id}
              >
                <input
                  checked={status === item.id}
                  name="booking-status"
                  onChange={() => {
                    setStatus(item.id);
                    setError("");
                  }}
                  type="radio"
                  value={item.id}
                />
                <span className={`kapster-status-option-mark kapster-status-option-mark--${item.id}`} />
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
              </label>
            ))}
          </fieldset>
          <div className="kapster-field">
            <label htmlFor="booking-status-note">Catatan (opsional)</label>
            <textarea
              className="kapster-textarea"
              id="booking-status-note"
              onChange={(event) => setNote(event.target.value)}
              placeholder="Tambahkan catatan pelayanan..."
              rows={4}
              value={note}
            />
          </div>
          {error && <p className="kapster-error-banner" role="alert">{error}</p>}
          <div className="kapster-form-actions">
            <Link
              className="cashier-button kapster-button kapster-button--secondary"
              href={`/kapster/booking/${encodeURIComponent(booking.id)}`}
            >
              Batal
            </Link>
            <button className="cashier-button kapster-button kapster-button--primary" type="submit">
              Simpan
            </button>
          </div>
        </section>

        <aside className="cashier-panel kapster-panel kapster-summary-panel">
          <h2>Ringkasan Booking</h2>
          <dl className="kapster-detail-list">
            <div><dt>ID Booking</dt><dd>{booking.id}</dd></div>
            <div><dt>Nama Pelanggan</dt><dd>{booking.customerName}</dd></div>
            <div><dt>Layanan</dt><dd>{service?.name ?? "Layanan tidak tersedia"}</dd></div>
            <div><dt>Waktu</dt><dd>{booking.time} WIB</dd></div>
            <div><dt>Harga</dt><dd>{service ? formatRupiah(service.price) : "—"}</dd></div>
            <div><dt>Status Saat Ini</dt><dd>{getBookingStatusLabel(booking.status)}</dd></div>
          </dl>
        </aside>
      </form>
    </div>
  );
}
