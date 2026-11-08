"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatRupiah, formatTanggal } from "./data";

type Service = { id: string; name: string; price: number };
type Booking = { id: string; date: string; time: string; status: string };
type Transaction = { id: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function listOf<T>(
  value: unknown,
  isItem: (item: unknown) => item is T,
): value is T[] {
  return Array.isArray(value) && value.every(isItem);
}

function isService(value: unknown): value is Service {
  return isRecord(value) && typeof value.id === "string" && typeof value.name === "string" && typeof value.price === "number";
}

function isBooking(value: unknown): value is Booking {
  return isRecord(value) && typeof value.id === "string" && typeof value.date === "string" && typeof value.time === "string" && typeof value.status === "string";
}

function isTransaction(value: unknown): value is Transaction {
  return isRecord(value) && typeof value.id === "string";
}

export default function CustomerHomePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    try {
      const responses = await Promise.all([
        fetch("/api/booking/options", { cache: "no-store" }),
        fetch("/api/booking", { cache: "no-store" }),
        fetch("/api/transaksi", { cache: "no-store" }),
      ]);
      const [options, bookingData, transactionData] = await Promise.all(
        responses.map((response) => response.json() as Promise<unknown>),
      );
      if (
        responses.some((response) => !response.ok) ||
        !isRecord(options) ||
        !listOf(options.services, isService) ||
        !isRecord(bookingData) ||
        !listOf(bookingData.bookings, isBooking) ||
        !isRecord(transactionData) ||
        !listOf(transactionData.transactions, isTransaction)
      ) {
        const message = [options, bookingData, transactionData].find(
          (item) => isRecord(item) && typeof item.message === "string",
        );
        throw new Error(isRecord(message) ? String(message.message) : "Ringkasan aktivitas tidak dapat dimuat.");
      }
      setServices(options.services);
      setBookings(bookingData.bookings);
      setTransactions(transactionData.transactions);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Ringkasan aktivitas tidak dapat dimuat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void Promise.resolve().then(loadSummary); }, [loadSummary]);

  const activeBookings = bookings.filter((booking) =>
    ["Menunggu", "Dikonfirmasi", "Diproses"].includes(booking.status),
  );
  const nextBooking = useMemo(
    () => activeBookings.slice().sort((left, right) => `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`))[0],
    [activeBookings],
  );
  const featuredServices = services.slice(0, 6);

  return (
    <div className="customer-page customer-home">
      <header className="customer-page-heading">
        <h1>SELAMAT DATANG DI CONTINENT BARBERSHOP</h1>
        <p>Kelola booking, lihat jadwal kapster, dan periksa transaksi Anda melalui halaman ini.</p>
      </header>
      <section className="customer-promo">
        <h2>Tampil Rapi, Tampil Percaya Diri</h2>
        <p>Temukan layanan perawatan rambut yang sesuai dengan gaya Anda.</p>
        <Link className="customer-primary-button" href="/pelanggan/booking/buat">Buat Booking <span aria-hidden="true">+</span></Link>
      </section>
      {error && (
        <div className="customer-form-error" role="alert">
          <p>{error}</p><button className="customer-outline-button" onClick={() => { setLoading(true); setError(""); void loadSummary(); }} type="button">Coba lagi</button>
        </div>
      )}
      <section className="customer-section">
        <h2>Ringkasan Aktivitas</h2>
        <div className="customer-summary-grid">
          <article className="customer-summary-card"><span className="customer-summary-icon" aria-hidden="true">▣</span><p>Booking Aktif</p><strong>{loading ? "—" : activeBookings.length}</strong></article>
          <article className="customer-summary-card"><span className="customer-summary-icon" aria-hidden="true">▤</span><p>Transaksi</p><strong>{loading ? "—" : transactions.length}</strong></article>
          <article className="customer-summary-card customer-summary-card--next"><span className="customer-summary-icon" aria-hidden="true">◷</span><p>Jadwal Berikutnya</p><strong>{loading ? "Memuat..." : nextBooking ? formatTanggal(nextBooking.date) : "Belum ada jadwal"}</strong>{nextBooking && <small>{nextBooking.time} WIB</small>}</article>
        </div>
      </section>
      <section className="customer-section">
        <div className="customer-section-heading"><h2>Layanan Unggulan</h2><Link href="/pelanggan/layanan">Lihat semua layanan</Link></div>
        {loading ? <p aria-busy="true">Memuat katalog layanan...</p> : (
          <div className="featured-service-grid">
            {featuredServices.map((service) => (
              <Link className="featured-service-card" href={`/pelanggan/booking/buat?layanan=${encodeURIComponent(service.id)}`} key={service.id}>
                <strong>{service.name}</strong><span>{formatRupiah(service.price)}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
