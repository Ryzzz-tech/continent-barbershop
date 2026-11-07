"use client";

import Link from "next/link";
import { useCustomerServices } from "../components/use-customer-services";
import { customerBarbers, formatTanggal } from "../pelanggan/data";
import { useKapsterPrototype } from "./kapster-context";
import {
  getBookingStatusLabel,
  KapsterPageHeading,
  KapsterPrototypeNote,
} from "./kapster-ui";

export default function KapsterDashboard() {
  const customerServices = useCustomerServices();
  const { bookings, activeBarberId } = useKapsterPrototype();
  const assignedBookings = bookings
    .filter((booking) => booking.barberId === activeBarberId)
    .sort((left, right) =>
      `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`),
    );
  const todayBookings = assignedBookings.filter(
    (booking) => booking.date === "2026-11-06",
  );
  const waitingCount = todayBookings.filter(
    (booking) => booking.status === "waiting",
  ).length;
  const completedCount = todayBookings.filter(
    (booking) => booking.status === "completed",
  ).length;
  const nextBooking = todayBookings.find(
    (booking) => booking.status === "waiting" || booking.status === "in-progress",
  );
  const barberName =
    customerBarbers.find((barber) => barber.id === activeBarberId)?.name ??
    "Kapster";

  return (
    <div className="cashier-page kapster-page">
      <KapsterPageHeading
        title="Beranda"
        description="Selamat datang kembali! Pantau booking dan aktivitas pelayanan Anda hari ini."
      />
      <KapsterPrototypeNote>
        Data yang ditampilkan adalah prototipe untuk {barberName} (K0001), bukan
        data dari database. Contoh booking memakai tanggal 6 November 2026.
      </KapsterPrototypeNote>

      <section className="cashier-metric-grid kapster-metric-grid" aria-label="Ringkasan booking hari ini">
        <article className="cashier-metric-card kapster-metric-card">
          <span className="cashier-metric-icon kapster-metric-icon" aria-hidden="true">▣</span>
          <div><p>Booking Hari Ini</p><strong>{String(todayBookings.length).padStart(2, "0")}</strong></div>
        </article>
        <article className="cashier-metric-card kapster-metric-card">
          <span className="cashier-metric-icon kapster-metric-icon kapster-metric-icon--orange" aria-hidden="true">◷</span>
          <div><p>Menunggu Dilayani</p><strong>{String(waitingCount).padStart(2, "0")}</strong></div>
        </article>
        <article className="cashier-metric-card kapster-metric-card">
          <span className="cashier-metric-icon kapster-metric-icon kapster-metric-icon--green" aria-hidden="true">✓</span>
          <div><p>Selesai Dilayani</p><strong>{String(completedCount).padStart(2, "0")}</strong></div>
        </article>
        <article className="cashier-metric-card kapster-metric-card">
          <span className="cashier-metric-icon kapster-metric-icon kapster-metric-icon--blue" aria-hidden="true">♙</span>
          <div>
            <p>Pelanggan Berikutnya</p>
            <strong className="kapster-next-customer">
              {nextBooking?.customerName ?? "Belum ada"}
            </strong>
            {nextBooking && <small>{nextBooking.time.replace(":", ".")} WIB</small>}
          </div>
        </article>
      </section>

      <section className="cashier-panel kapster-panel kapster-next-panel">
        <div className="kapster-panel-heading">
          <div>
            <h2>Jadwal Pelayanan Berikutnya</h2>
            <p>Booking yang ditugaskan kepada Anda.</p>
          </div>
          <Link className="kapster-text-link" href="/kapster/booking">
            Lihat Semua Booking
          </Link>
        </div>
        {todayBookings.length ? (
          <div className="kapster-appointment-list">
            {todayBookings
              .filter(
                (booking) =>
                  booking.status === "waiting" || booking.status === "in-progress",
              )
              .map((booking) => {
                const service = customerServices.find(
                  (item) => item.id === booking.serviceId,
                );
                return (
                  <Link
                    className="kapster-appointment-card"
                    href={`/kapster/booking/${encodeURIComponent(booking.id)}`}
                    key={booking.id}
                  >
                    <span className="kapster-appointment-time">
                      {booking.time.replace(":", ".")}
                      <small>WIB</small>
                    </span>
                    <span className="kapster-appointment-details">
                      <strong>{booking.customerName}</strong>
                      <small>{service?.name ?? "Layanan tidak tersedia"}</small>
                    </span>
                    <span className={`kapster-status kapster-status--${booking.status}`}>
                      {getBookingStatusLabel(booking.status)}
                    </span>
                  </Link>
                );
              })}
          </div>
        ) : (
          <div className="kapster-empty-state">
            <h3>Belum ada jadwal pelayanan hari ini</h3>
            <p>Booking baru yang ditugaskan kepada Anda akan muncul di sini.</p>
          </div>
        )}
        {nextBooking && (
          <p className="kapster-schedule-date">
            Jadwal untuk {formatTanggal(nextBooking.date)}.
          </p>
        )}
        <div className="kapster-day-summary">
          <span>{todayBookings.length} booking</span>
          <span>{waitingCount} menunggu</span>
          <span>{todayBookings.filter((booking) => booking.status === "in-progress").length} diproses</span>
          <span>{completedCount} selesai</span>
        </div>
      </section>
    </div>
  );
}
