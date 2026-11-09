"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ConfirmDialog from "../../components/confirm-dialog";
import { useAppFeedback } from "../../components/app-feedback";
import { formatRupiah, formatTanggal } from "../data";

type Booking = {
  id: string;
  date: string;
  time: string;
  status: string;
  serviceName: string;
  barberName: string;
  price: number;
  paymentStatus: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isBooking(value: unknown): value is Booking {
  return isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.date === "string" &&
    typeof value.time === "string" &&
    typeof value.status === "string" &&
    typeof value.serviceName === "string" &&
    typeof value.barberName === "string" &&
    typeof value.price === "number" &&
    typeof value.paymentStatus === "string";
}

function statusClass(status: string) {
  return status === "Selesai" ? "status-pill--active" : "status-pill--draft";
}

export default function CustomerBookingsPage() {
  const { showToast } = useAppFeedback();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);

  const loadBookings = useCallback(async () => {
    try {
      const response = await fetch("/api/booking", { cache: "no-store" });
      const result: unknown = await response.json();
      if (!response.ok || !isRecord(result) || !Array.isArray(result.bookings) || !result.bookings.every(isBooking)) {
        throw new Error(
          isRecord(result) && typeof result.message === "string"
            ? result.message
            : "Daftar booking tidak dapat dimuat.",
        );
      }
      setBookings(result.bookings);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Daftar booking tidak dapat dimuat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void Promise.resolve().then(loadBookings); }, [loadBookings]);

  async function cancelBooking() {
    if (!bookingToCancel) return false;
    try {
      const response = await fetch(`/api/booking/${encodeURIComponent(bookingToCancel.id)}/cancel`, {
        method: "POST",
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          isRecord(result) && typeof result.message === "string"
            ? result.message
            : "Booking tidak dapat dibatalkan.",
        );
      }
      setBookings((current) =>
        current.map((booking) =>
          booking.id === bookingToCancel.id ? { ...booking, status: "Dibatalkan" } : booking,
        ),
      );
      showToast("Booking Dibatalkan", `Booking ${bookingToCancel.id} berhasil dibatalkan.`, "success");
      return true;
    } catch (cancelError) {
      showToast(
        "Pembatalan Gagal",
        cancelError instanceof Error ? cancelError.message : "Booking tidak dapat dibatalkan.",
        "error",
      );
      return false;
    }
  }

  return (
    <div className="customer-page">
      <header className="customer-page-heading">
        <h1>BOOKING SAYA</h1>
        <p>Kelola booking layanan Anda melalui halaman ini.</p>
      </header>

      <section className="customer-booking-callout">
        <div>
          <h2>Butuh potong rambut?</h2>
          <p>Pilih layanan dan jadwal untuk memulai booking.</p>
        </div>
        <Link className="customer-primary-button" href="/pelanggan/booking/buat">Buat Booking</Link>
      </section>

      <section className="customer-section">
        <h2>Booking Tersimpan</h2>
        {loading && <div className="customer-empty-state" aria-busy="true"><p>Memuat booking...</p></div>}
        {!loading && error && (
          <div className="customer-empty-state" role="alert">
            <h3>Booking tidak dapat dimuat</h3>
            <p>{error}</p>
            <button className="customer-outline-button" onClick={() => { setLoading(true); setError(""); void loadBookings(); }} type="button">Coba lagi</button>
          </div>
        )}
        {!loading && !error && bookings.length === 0 && (
          <div className="customer-empty-state">
            <span className="empty-state-icon" aria-hidden="true">&#128197;</span>
            <h3>Belum ada booking tersimpan</h3>
            <p>Booking Anda yang berhasil dikirim akan muncul di sini.</p>
            <Link className="customer-primary-button" href="/pelanggan/booking/buat">Buat Booking</Link>
          </div>
        )}
        {!loading && !error && bookings.length > 0 && (
          <div className="customer-booking-list">
            {bookings.map((booking) => {
              const isPaid = booking.paymentStatus === "Sudah Dibayar" || booking.paymentStatus === "Lunas";
              const canCancel = ["Menunggu", "Dikonfirmasi"].includes(booking.status) && !isPaid;
              return (
                <article className="booking-draft-card" key={booking.id}>
                  <div className="booking-draft-card__header">
                    <div><span className="kapster-booking-id">{booking.id}</span><h3>{booking.serviceName}</h3></div>
                    <strong>{formatRupiah(booking.price)}</strong>
                  </div>
                  <dl className="customer-detail-list">
                    <div><dt>Kapster</dt><dd>{booking.barberName}</dd></div>
                    <div><dt>Tanggal</dt><dd>{formatTanggal(booking.date)}</dd></div>
                    <div><dt>Waktu</dt><dd>{booking.time} WIB</dd></div>
                    <div><dt>Status Booking</dt><dd><span className={`status-pill ${statusClass(booking.status)}`}>{booking.status}</span></dd></div>
                    <div><dt>Status Pembayaran</dt><dd>{isPaid ? "Sudah Dibayar" : "Belum Dibayar"}</dd></div>
                  </dl>
                  <div className="customer-card-actions">
                    <Link className="customer-outline-button" href={`/pelanggan/booking/${encodeURIComponent(booking.id)}`}>Lihat Detail</Link>
                    {!isPaid && booking.status !== "Dibatalkan" && (
                      <Link className="customer-outline-button" href={`/pelanggan/pembayaran?booking=${encodeURIComponent(booking.id)}`}>Bayar</Link>
                    )}
                    {booking.status === "Menunggu" && !isPaid && (
                      <Link className="customer-outline-button" href={`/pelanggan/booking/buat?booking=${encodeURIComponent(booking.id)}`}>Ubah</Link>
                    )}
                    {canCancel && (
                      <button
                        className="customer-danger-button"
                        onClick={() => setBookingToCancel(booking)}
                        type="button"
                      >
                        Batalkan
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {bookingToCancel && (
        <ConfirmDialog
          title="Konfirmasi Pembatalan"
          description={`Apakah Anda yakin ingin membatalkan booking ${bookingToCancel.id}?`}
          detail="Pembatalan hanya dilakukan setelah Anda mengonfirmasi."
          confirmLabel="Ya, Batalkan"
          onClose={() => setBookingToCancel(null)}
          onConfirm={cancelBooking}
        />
      )}
    </div>
  );
}
