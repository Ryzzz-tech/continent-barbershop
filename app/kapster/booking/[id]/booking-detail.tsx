"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatRupiah, formatTanggal } from "../../../pelanggan/data";
import type { KapsterBooking } from "../../prototype-types";
import {
  getBookingStatusClass,
  getBookingStatusLabel,
  KapsterPageHeading,
} from "../../kapster-ui";

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

export default function KapsterBookingDetail({ bookingId }: { bookingId: string }) {
  const [booking, setBooking] = useState<KapsterBooking | null>(null);
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

  if (loading) {
    return <div className="cashier-page kapster-page" aria-busy="true"><KapsterPageHeading title="Detail Booking" /><p>Memuat detail booking...</p></div>;
  }
  if (error || !booking) {
    return (
      <div className="cashier-page kapster-page">
        <KapsterPageHeading title="Detail Booking" />
        <div className="cashier-empty-state kapster-empty-state kapster-empty-state--card" role={error ? "alert" : undefined}>
          <h2>{error.includes("tidak ditemukan") ? "Booking tidak ditemukan" : "Detail booking tidak dapat dimuat"}</h2>
          <p>{error || "Booking tidak ditugaskan kepada akun Kapster ini."}</p>
          {error && <button className="cashier-button kapster-button kapster-button--secondary" onClick={() => { setLoading(true); setError(""); void loadBooking(); }} type="button">Coba lagi</button>}
          <Link className="cashier-button kapster-button kapster-button--primary" href="/kapster/booking">Kembali ke Daftar Booking</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cashier-page kapster-page">
      <KapsterPageHeading title="Detail Booking" description="Informasi booking dan pelanggan yang ditugaskan kepada Anda.">
        <Link className="kapster-text-link" href="/kapster/booking">← Kembali</Link>
      </KapsterPageHeading>
      <div className="kapster-detail-grid">
        <section className="cashier-panel kapster-panel">
          <div className="kapster-panel-heading">
            <h2>Informasi Booking</h2>
            <span className={`kapster-status kapster-status--${getBookingStatusClass(booking.status)}`}>
              {getBookingStatusLabel(booking.status)}
            </span>
          </div>
          <dl className="kapster-detail-list">
            <div><dt>ID Booking</dt><dd>{booking.id}</dd></div>
            <div><dt>Tanggal</dt><dd>{formatTanggal(booking.date)}</dd></div>
            <div><dt>Waktu</dt><dd>{booking.time} WIB</dd></div>
            <div><dt>Layanan</dt><dd>{booking.serviceName}</dd></div>
            <div><dt>Harga</dt><dd>{formatRupiah(booking.price)}</dd></div>
          </dl>
          {booking.status !== "Selesai" && booking.status !== "Dibatalkan" && (
            <Link
              className="cashier-button kapster-button kapster-button--primary kapster-detail-action"
              href={`/kapster/booking/${encodeURIComponent(booking.id)}/status`}
            >
              Ubah Status
            </Link>
          )}
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
              <strong>Catatan Kapster</strong><p>{booking.statusNote}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
