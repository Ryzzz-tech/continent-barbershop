"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useAppFeedback } from "../../components/app-feedback";
import { formatRupiah, formatTanggal } from "../data";

const paymentMethods = [
  { id: "bank-transfer", label: "Transfer Bank", detail: "Virtual Account (simulasi)" },
  { id: "qris", label: "QRIS", detail: "Pembayaran QR (simulasi)" },
  { id: "e-wallet", label: "E-Wallet", detail: "Dompet digital (simulasi)" },
];

type Booking = {
  id: string;
  date: string;
  time: string;
  status: string;
  barberName: string;
  serviceName: string;
  price: number;
  paymentStatus: string;
  transactionId: string | null;
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
    typeof value.barberName === "string" &&
    typeof value.serviceName === "string" &&
    typeof value.price === "number" &&
    typeof value.paymentStatus === "string" &&
    (value.transactionId === null || typeof value.transactionId === "string");
}

function PaymentPageContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("booking") ?? "";
  const { showToast } = useAppFeedback();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [method, setMethod] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadBooking = useCallback(async () => {
    if (!bookingId) {
      await Promise.resolve();
      setBooking(null);
      setError("ID booking tidak ditemukan. Buka pembayaran dari booking yang sudah tersimpan.");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`/api/booking/${encodeURIComponent(bookingId)}`, {
        cache: "no-store",
      });
      const result: unknown = await response.json();
      if (!response.ok || !isRecord(result) || !isBooking(result.booking)) {
        throw new Error(
          isRecord(result) && typeof result.message === "string"
            ? result.message
            : "Ringkasan booking tidak dapat dimuat.",
        );
      }
      setBooking(result.booking);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Ringkasan booking tidak dapat dimuat.");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => { void Promise.resolve().then(loadBooking); }, [loadBooking]);

  async function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!booking) return;
    if (!paymentMethods.some((item) => item.id === method)) {
      showToast("Metode Pembayaran Belum Dipilih", "Pilih salah satu metode sebelum melanjutkan.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`/api/booking/${encodeURIComponent(booking.id)}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method }),
      });
      const result: unknown = await response.json();
      if (!response.ok || !isRecord(result) || !isRecord(result.transaction)) {
        throw new Error(
          isRecord(result) && typeof result.message === "string"
            ? result.message
            : "Pembayaran simulasi tidak dapat diproses.",
        );
      }
      const transactionId =
        typeof result.transaction.id === "string" ? result.transaction.id : null;
      const paymentStatus =
        typeof result.transaction.status === "string"
          ? result.transaction.status
          : "Sudah Dibayar";
      setBooking((current) =>
        current ? { ...current, paymentStatus, transactionId } : current,
      );
      showToast(
        result.alreadyPaid === true ? "Pembayaran Sudah Tersimpan" : "Pembayaran Berhasil!",
        result.alreadyPaid === true
          ? "Transaksi simulasi untuk booking ini sudah tersimpan sebelumnya."
          : "Pembayaran berhasil disimulasikan dan transaksinya tersimpan. Tidak ada pembayaran sungguhan yang diproses.",
        result.alreadyPaid === true ? "info" : "success",
      );
    } catch (paymentError) {
      showToast(
        "Pembayaran Gagal",
        paymentError instanceof Error ? paymentError.message : "Pembayaran simulasi tidak dapat diproses.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const isPaid = booking?.paymentStatus === "Sudah Dibayar" || booking?.paymentStatus === "Lunas";

  return (
    <div className="customer-page">
      <Link className="customer-back-link" href={bookingId ? `/pelanggan/booking/${encodeURIComponent(bookingId)}` : "/pelanggan/booking"}>
        <span aria-hidden="true">←</span> Kembali ke Booking
      </Link>
      <header className="customer-page-heading">
        <h1>PEMBAYARAN ONLINE</h1>
        <p>Ringkasan booking dan simulasi pembayaran.</p>
      </header>

      {loading && <div className="customer-empty-state" aria-busy="true"><p>Memuat booking...</p></div>}
      {!loading && error && (
        <div className="customer-empty-state" role="alert">
          <h2>Booking tidak dapat dimuat</h2>
          <p>{error}</p>
          <button className="customer-outline-button" onClick={() => { setLoading(true); setError(""); void loadBooking(); }} type="button">Coba lagi</button>
          <Link className="customer-primary-button" href="/pelanggan/booking">Lihat Booking Saya</Link>
        </div>
      )}
      {!loading && !error && booking && (
        <div className="payment-layout">
          <section className="customer-panel">
            <h2>Pilih Metode Pembayaran</h2>
            <form onSubmit={submitPayment}>
              <div className="payment-method-list">
                {paymentMethods.map((item) => (
                  <label
                    className={`payment-method${method === item.id ? " is-selected" : ""}`}
                    key={item.id}
                  >
                    <input
                      checked={method === item.id}
                      disabled={isPaid || submitting}
                      name="payment-method"
                      onChange={() => setMethod(item.id)}
                      type="radio"
                      value={item.id}
                    />
                    <span className="payment-method__mark" aria-hidden="true">
                      {item.id === "qris" ? "▦" : item.id === "e-wallet" ? "▣" : "▤"}
                    </span>
                    <span><strong>{item.label}</strong><small>{item.detail}</small></span>
                  </label>
                ))}
              </div>
              <p className="customer-field-hint">
                Pembayaran ini hanya simulasi prototipe. Tidak ada uang, verifikasi bank, kode QR, atau bukti transaksi sungguhan.
              </p>
              <button className="customer-primary-button" disabled={isPaid || submitting} type="submit">
                {isPaid
                  ? "Pembayaran Berhasil Disimulasikan"
                  : submitting
                    ? "Memproses Simulasi..."
                    : "Lanjutkan Pembayaran"}
              </button>
            </form>
          </section>
          <aside className="booking-summary-panel">
            <h2>Ringkasan Booking</h2>
            <dl className="customer-detail-list">
              <div><dt>ID Booking</dt><dd>{booking.id}</dd></div>
              <div><dt>Layanan</dt><dd>{booking.serviceName}</dd></div>
              <div><dt>Kapster</dt><dd>{booking.barberName}</dd></div>
              <div><dt>Tanggal</dt><dd>{formatTanggal(booking.date)}</dd></div>
              <div><dt>Waktu</dt><dd>{booking.time} WIB</dd></div>
              <div className="booking-summary-total"><dt>Total</dt><dd>{formatRupiah(booking.price)}</dd></div>
            </dl>
            <span className={`status-pill ${isPaid ? "status-pill--active" : "status-pill--draft"}`}>
              {isPaid ? "Sudah Dibayar" : "Belum Dibayar"}
            </span>
            {booking.transactionId && (
              <p className="customer-field-hint">Transaksi simulasi: {booking.transactionId}</p>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

export default function OnlinePaymentPage() {
  return (
    <Suspense fallback={<div className="customer-page" aria-busy="true"><p>Memuat pembayaran...</p></div>}>
      <PaymentPageContent />
    </Suspense>
  );
}
