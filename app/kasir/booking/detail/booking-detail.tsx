"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatRupiah, formatTanggal } from "../../../pelanggan/data";
import { CashierPageHeading } from "../../cashier-ui";

type Booking = {
  id: string;
  customerName: string;
  serviceName: string;
  date: string;
  time: string;
  barberName: string;
  price: number;
  status: string;
  paymentStatus: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isBooking(value: unknown): value is Booking {
  return isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.customerName === "string" &&
    typeof value.serviceName === "string" &&
    typeof value.date === "string" &&
    typeof value.time === "string" &&
    typeof value.barberName === "string" &&
    typeof value.price === "number" &&
    typeof value.status === "string" &&
    typeof value.paymentStatus === "string";
}

export default function CashierBookingDetail({ bookingId }: { bookingId: string }) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBooking = useCallback(async () => {
    if (!bookingId) {
      await Promise.resolve();
      setError("ID booking tidak ditemukan.");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`/api/booking/${encodeURIComponent(bookingId)}`, { cache: "no-store" });
      const result: unknown = await response.json();
      if (!response.ok || !isRecord(result) || !isBooking(result.booking)) {
        throw new Error(isRecord(result) && typeof result.message === "string" ? result.message : "Detail booking tidak dapat dimuat.");
      }
      setBooking(result.booking);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Detail booking tidak dapat dimuat.");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => { void Promise.resolve().then(loadBooking); }, [loadBooking]);

  return (
    <div className="cashier-page">
      <CashierPageHeading title="Detail Booking" description="Booking telah tercatat di database." />
      {loading && <div className="cashier-empty-state" aria-busy="true"><p>Memuat detail booking...</p></div>}
      {!loading && error && (
        <div className="cashier-empty-state" role="alert">
          <h2>Data booking tidak dapat dimuat</h2><p>{error}</p>
          <button className="cashier-button cashier-button--secondary" onClick={() => { setLoading(true); setError(""); void loadBooking(); }} type="button">Coba lagi</button>
          <Link className="cashier-button cashier-button--primary" href="/kasir/booking">Kembali ke Catat Booking</Link>
        </div>
      )}
      {!loading && !error && booking && (
        <section className="cashier-panel cashier-detail-panel">
          <dl className="cashier-detail-list">
            <div><dt>ID Booking</dt><dd>{booking.id}</dd></div>
            <div><dt>Nama Pelanggan</dt><dd>{booking.customerName}</dd></div>
            <div><dt>Layanan</dt><dd>{booking.serviceName}</dd></div>
            <div><dt>Harga</dt><dd>{formatRupiah(booking.price)}</dd></div>
            <div><dt>Jadwal</dt><dd>{formatTanggal(booking.date)}, {booking.time} WIB</dd></div>
            <div><dt>Kapster</dt><dd>{booking.barberName}</dd></div>
            <div><dt>Status Booking</dt><dd>{booking.status}</dd></div>
            <div><dt>Status Pembayaran</dt><dd>{booking.paymentStatus}</dd></div>
          </dl>
          <div className="cashier-form-actions">
            <Link className="cashier-button cashier-button--secondary" href="/kasir">Kembali ke Beranda</Link>
            <Link className="cashier-button cashier-button--primary" href="/kasir/booking">Catat Booking Lain</Link>
          </div>
        </section>
      )}
    </div>
  );
}
