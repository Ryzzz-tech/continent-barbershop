"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatPaymentMethod, formatRupiah, formatTanggal } from "../../data";

type Booking = {
  id: string;
  date: string;
  time: string;
  status: string;
  serviceName: string;
  barberName: string;
  price: number;
  paymentStatus: string;
  paymentMethod: string | null;
  transactionId: string | null;
  customerNote: string;
  statusNote: string;
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
    typeof value.paymentStatus === "string" &&
    (value.paymentMethod === null || typeof value.paymentMethod === "string") &&
    (value.transactionId === null || typeof value.transactionId === "string") &&
    typeof value.customerNote === "string" &&
    typeof value.statusNote === "string";
}

function BookingDetailContent() {
  const params = useParams<{ id: string }>();
  const bookingId = decodeURIComponent(params.id);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBooking = useCallback(async () => {
    try {
      const response = await fetch(`/api/booking/${encodeURIComponent(bookingId)}`, { cache: "no-store" });
      const result: unknown = await response.json();
      if (!response.ok || !isRecord(result) || !isBooking(result.booking)) {
        throw new Error(
          isRecord(result) && typeof result.message === "string"
            ? result.message
            : "Detail booking tidak dapat dimuat.",
        );
      }
      setBooking(result.booking);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Detail booking tidak dapat dimuat.");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => { void Promise.resolve().then(loadBooking); }, [loadBooking]);
  const isPaid = booking?.paymentStatus === "Sudah Dibayar" || booking?.paymentStatus === "Lunas";

  return (
    <div className="customer-page">
      <Link className="customer-back-link" href="/pelanggan/booking">
        <span aria-hidden="true">&#x2190;</span> Kembali ke Booking Saya
      </Link>
      <header className="customer-page-heading"><h1>DETAIL BOOKING</h1></header>
      {loading && <div className="customer-empty-state" aria-busy="true"><p>Memuat detail booking...</p></div>}
      {!loading && error && (
        <div className="customer-empty-state" role="alert">
          <h2>{error.includes("tidak ditemukan") ? "Booking tidak ditemukan" : "Detail booking gagal dimuat"}</h2>
          <p>{error}</p>
          <button className="customer-outline-button" onClick={() => { setLoading(true); setError(""); void loadBooking(); }} type="button">Coba lagi</button>
          <Link className="customer-primary-button" href="/pelanggan/booking">Lihat Booking Saya</Link>
        </div>
      )}
      {!loading && !error && booking && (
        <section className="customer-panel">
          <div className="booking-draft-card__header">
            <div><span className="kapster-booking-id">{booking.id}</span><h2>{booking.serviceName}</h2></div>
            <strong>{formatRupiah(booking.price)}</strong>
          </div>
          <dl className="customer-detail-list">
            <div><dt>Kapster</dt><dd>{booking.barberName}</dd></div>
            <div><dt>Tanggal</dt><dd>{formatTanggal(booking.date)}</dd></div>
            <div><dt>Waktu</dt><dd>{booking.time} WIB</dd></div>
            <div><dt>Status Booking</dt><dd>{booking.status}</dd></div>
            <div><dt>Status Pembayaran</dt><dd>{isPaid ? "Sudah Dibayar" : "Belum Dibayar"}</dd></div>
            {booking.paymentMethod && <div><dt>Metode Pembayaran</dt><dd>{formatPaymentMethod(booking.paymentMethod)}</dd></div>}
            {booking.transactionId && <div><dt>ID Transaksi</dt><dd>{booking.transactionId}</dd></div>}
            <div><dt>Catatan</dt><dd>{booking.customerNote || "Tidak ada catatan tambahan."}</dd></div>
            {booking.statusNote && <div><dt>Catatan Kapster</dt><dd>{booking.statusNote}</dd></div>}
          </dl>
          {!isPaid && booking.status !== "Dibatalkan" && (
            <Link className="customer-primary-button" href={`/pelanggan/pembayaran?booking=${encodeURIComponent(booking.id)}`}>
              Lanjutkan Pembayaran
            </Link>
          )}
        </section>
      )}
    </div>
  );
}

export default function BookingDetailPage() {
  return (
    <Suspense fallback={<div className="customer-page" aria-busy="true"><p>Memuat detail booking...</p></div>}>
      <BookingDetailContent />
    </Suspense>
  );
}
