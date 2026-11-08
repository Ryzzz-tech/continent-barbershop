"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import ConfirmDialog from "../../../../components/confirm-dialog";
import { useAppFeedback } from "../../../../components/app-feedback";
import { formatRupiah } from "../../../../pelanggan/data";
import type { BookingStatus, KapsterBooking } from "../../../prototype-types";
import {
  bookingStatuses,
  getBookingStatusClass,
  getBookingStatusLabel,
  KapsterPageHeading,
} from "../../../kapster-ui";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isBooking(value: unknown): value is KapsterBooking {
  return isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.customerName === "string" &&
    typeof value.customerPhone === "string" &&
    typeof value.customerNote === "string" &&
    typeof value.serviceId === "string" &&
    typeof value.serviceName === "string" &&
    typeof value.price === "number" &&
    typeof value.date === "string" &&
    typeof value.time === "string" &&
    typeof value.barberId === "string" &&
    typeof value.status === "string" &&
    typeof value.statusNote === "string";
}

export default function KapsterBookingStatusForm({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const { showToast } = useAppFeedback();
  const [booking, setBooking] = useState<KapsterBooking | null>(null);
  const [status, setStatus] = useState<BookingStatus | "">("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  const loadBooking = useCallback(async () => {
    try {
      const response = await fetch(`/api/booking/${encodeURIComponent(bookingId)}`, { cache: "no-store" });
      const result: unknown = await response.json();
      if (!response.ok || !isRecord(result) || !isBooking(result.booking)) {
        throw new Error(
          isRecord(result) && typeof result.message === "string"
            ? result.message
            : "Booking tidak dapat dimuat.",
        );
      }
      setBooking(result.booking);
      setStatus(result.booking.status);
      setNote(result.booking.statusNote);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Booking tidak dapat dimuat.");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => { void Promise.resolve().then(loadBooking); }, [loadBooking]);

  async function saveStatus() {
    if (!status || !booking || saving) return false;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/booking/${encodeURIComponent(booking.id)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note: note.trim() }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          isRecord(result) && typeof result.message === "string"
            ? result.message
            : "Status booking tidak dapat diperbarui.",
        );
      }
      showToast(
        "Status Booking Diperbarui",
        `Status booking ${booking.id} menjadi ${getBookingStatusLabel(status)}.`,
        "success",
      );
      router.push(`/kapster/booking/${encodeURIComponent(booking.id)}`);
      return true;
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Status booking tidak dapat diperbarui.";
      setError(message);
      showToast("Perubahan Status Gagal", message, "error");
      return false;
    } finally {
      setSaving(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!status || !booking) {
      setError("Pilih status booking sebelum menyimpan.");
      return;
    }
    if (status === "Dibatalkan" && status !== booking.status) {
      setConfirmCancel(true);
      return;
    }
    void saveStatus();
  }

  if (loading) {
    return <div className="cashier-page kapster-page" aria-busy="true"><KapsterPageHeading title="Ubah Status Booking" /><p>Memuat booking...</p></div>;
  }
  if (!booking) {
    return (
      <div className="cashier-page kapster-page">
        <KapsterPageHeading title="Ubah Status Booking" />
        <div className="cashier-empty-state kapster-empty-state kapster-empty-state--card" role="alert">
          <h2>Booking tidak dapat dimuat</h2><p>{error}</p>
          <button className="cashier-button kapster-button kapster-button--secondary" onClick={() => { setLoading(true); setError(""); void loadBooking(); }} type="button">Coba lagi</button>
          <Link className="cashier-button kapster-button kapster-button--primary" href="/kapster/booking">Kembali ke Daftar Booking</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cashier-page kapster-page">
      <KapsterPageHeading title="Ubah Status Booking" description="Pilih status pelayanan untuk booking ini.">
        <Link className="kapster-text-link" href={`/kapster/booking/${encodeURIComponent(booking.id)}`}>← Kembali</Link>
      </KapsterPageHeading>
      <form className="kapster-status-edit-grid" onSubmit={submit} noValidate>
        <section className="cashier-panel kapster-panel">
          <h2>Pilih Status</h2>
          <fieldset className="kapster-status-options">
            <legend className="kapster-visually-hidden">Status pelayanan</legend>
            {bookingStatuses.map((item) => (
              <label className={`kapster-status-option${status === item.id ? " is-selected" : ""}`} key={item.id}>
                <input
                  checked={status === item.id}
                  name="booking-status"
                  onChange={() => { setStatus(item.id); setError(""); }}
                  type="radio"
                  value={item.id}
                />
                <span className={`kapster-status-option-mark kapster-status-option-mark--${getBookingStatusClass(item.id)}`} />
                <span><strong>{item.label}</strong><small>{item.description}</small></span>
              </label>
            ))}
          </fieldset>
          <div className="kapster-field">
            <label htmlFor="booking-status-note">Catatan (opsional)</label>
            <textarea
              className="kapster-textarea"
              id="booking-status-note"
              maxLength={100}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Tambahkan catatan pelayanan..."
              rows={4}
              value={note}
            />
          </div>
          {error && <p className="kapster-error-banner" role="alert">{error}</p>}
          <div className="kapster-form-actions">
            <Link className="cashier-button kapster-button kapster-button--secondary" href={`/kapster/booking/${encodeURIComponent(booking.id)}`}>Batal</Link>
            <button className="cashier-button kapster-button kapster-button--primary" disabled={saving} type="submit">
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </section>
        <aside className="cashier-panel kapster-panel kapster-summary-panel">
          <h2>Ringkasan Booking</h2>
          <dl className="kapster-detail-list">
            <div><dt>ID Booking</dt><dd>{booking.id}</dd></div>
            <div><dt>Nama Pelanggan</dt><dd>{booking.customerName}</dd></div>
            <div><dt>Layanan</dt><dd>{booking.serviceName}</dd></div>
            <div><dt>Waktu</dt><dd>{booking.time} WIB</dd></div>
            <div><dt>Harga</dt><dd>{formatRupiah(booking.price)}</dd></div>
            <div><dt>Status Saat Ini</dt><dd>{getBookingStatusLabel(booking.status)}</dd></div>
          </dl>
        </aside>
      </form>
      {confirmCancel && (
        <ConfirmDialog
          title="Konfirmasi Pembatalan"
          description={`Apakah Anda yakin ingin membatalkan booking ${booking.id}?`}
          detail="Status booking akan diubah menjadi Dibatalkan."
          confirmLabel="Ya, Batalkan"
          onClose={() => setConfirmCancel(false)}
          onConfirm={saveStatus}
        />
      )}
    </div>
  );
}
