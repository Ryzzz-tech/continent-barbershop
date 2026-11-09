"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatTanggal } from "../pelanggan/data";
import type { KapsterBooking } from "./prototype-types";
import {
  getBookingStatusClass,
  getBookingStatusLabel,
  KapsterPageHeading,
} from "./kapster-ui";

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

function todayInJakarta() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Jakarta" }).format(new Date());
}

export default function KapsterDashboard() {
  const [bookings, setBookings] = useState<KapsterBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBookings = useCallback(async () => {
    try {
      const response = await fetch("/api/booking", { cache: "no-store" });
      const result: unknown = await response.json();
      if (!response.ok || !isRecord(result) || !Array.isArray(result.bookings) || !result.bookings.every(isBooking)) {
        throw new Error(
          isRecord(result) && typeof result.message === "string"
            ? result.message
            : "Ringkasan booking tidak dapat dimuat.",
        );
      }
      setBookings(result.bookings);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Ringkasan booking tidak dapat dimuat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void Promise.resolve().then(loadBookings); }, [loadBookings]);

  const todayBookings = useMemo(
    () => bookings.filter((booking) => booking.date === todayInJakarta()),
    [bookings],
  );
  const waitingCount = todayBookings.filter(
    (booking) => booking.status === "Menunggu" || booking.status === "Dikonfirmasi",
  ).length;
  const completedCount = todayBookings.filter((booking) => booking.status === "Selesai").length;
  const nextBooking = bookings
    .filter((booking) =>
      ["Menunggu", "Dikonfirmasi", "Diproses"].includes(booking.status),
    )
    .sort((left, right) => `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`))[0];

  return (
    <div className="cashier-page kapster-page">
      <KapsterPageHeading
        title="Beranda"
        description="Selamat datang kembali! Pantau booking dan aktivitas pelayanan Anda hari ini."
      />


      {error && (
        <div className="kapster-error-banner" role="alert">
          {error}
          <button className="kapster-row-action" onClick={() => { setLoading(true); setError(""); void loadBookings(); }} type="button">Coba lagi</button>
        </div>
      )}
      <section className="cashier-metric-grid kapster-metric-grid" aria-label="Ringkasan booking hari ini">
        <article className="cashier-metric-card kapster-metric-card">
          <span className="cashier-metric-icon kapster-metric-icon" aria-hidden="true">&#128197;</span>
          <div><p>Booking Hari Ini</p><strong>{loading ? "..." : String(todayBookings.length).padStart(2, "0")}</strong></div>
        </article>
        <article className="cashier-metric-card kapster-metric-card">
          <span className="cashier-metric-icon kapster-metric-icon kapster-metric-icon--orange" aria-hidden="true">&#9203;</span>
          <div><p>Menunggu Dilayani</p><strong>{loading ? "..." : String(waitingCount).padStart(2, "0")}</strong></div>
        </article>
        <article className="cashier-metric-card kapster-metric-card">
          <span className="cashier-metric-icon kapster-metric-icon kapster-metric-icon--green" aria-hidden="true">&#10004;</span>
          <div><p>Selesai Dilayani</p><strong>{loading ? "..." : String(completedCount).padStart(2, "0")}</strong></div>
        </article>
        <article className="cashier-metric-card kapster-metric-card">
          <span className="cashier-metric-icon kapster-metric-icon kapster-metric-icon--blue" aria-hidden="true">&#128100;</span>
          <div>
            <p>Pelanggan Berikutnya</p>
            <strong className="kapster-next-customer">{loading ? "Memuat..." : nextBooking?.customerName ?? "Belum ada"}</strong>
            {nextBooking && <small>{nextBooking.time.replace(":", ".")} WIB</small>}
          </div>
        </article>
      </section>

      <section className="cashier-panel kapster-panel kapster-next-panel">
        <div className="kapster-panel-heading">
          <div><h2>Jadwal Pelayanan Berikutnya</h2><p>Booking yang ditugaskan kepada Anda.</p></div>
          <Link className="kapster-text-link" href="/kapster/booking">Lihat Semua Booking</Link>
        </div>
        {loading ? (
          <div className="kapster-empty-state" aria-busy="true"><p>Memuat jadwal...</p></div>
        ) : todayBookings.length ? (
          <div className="kapster-appointment-list">
            {todayBookings
              .filter((booking) => ["Menunggu", "Dikonfirmasi", "Diproses"].includes(booking.status))
              .map((booking) => (
                <Link
                  className="kapster-appointment-card"
                  href={`/kapster/booking/${encodeURIComponent(booking.id)}`}
                  key={booking.id}
                >
                  <span className="kapster-appointment-time">{booking.time.replace(":", ".")}<small>WIB</small></span>
                  <span className="kapster-appointment-details"><strong>{booking.customerName}</strong><small>{booking.serviceName}</small></span>
                  <span className={`kapster-status kapster-status--${getBookingStatusClass(booking.status)}`}>
                    {getBookingStatusLabel(booking.status)}
                  </span>
                </Link>
              ))}
          </div>
        ) : (
          <div className="kapster-empty-state">
            <h3>Belum ada jadwal pelayanan hari ini</h3>
            <p>Booking yang ditugaskan kepada Anda akan muncul di sini.</p>
          </div>
        )}
        {nextBooking && <p className="kapster-schedule-date">Jadwal berikutnya: {formatTanggal(nextBooking.date)}.</p>}
        <div className="kapster-day-summary">
          <span>{todayBookings.length} booking</span>
          <span>{waitingCount} menunggu</span>
          <span>{todayBookings.filter((booking) => booking.status === "Diproses").length} diproses</span>
          <span>{completedCount} selesai</span>
        </div>
      </section>
    </div>
  );
}
