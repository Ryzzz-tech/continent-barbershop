"use client";

import Link from "next/link";
import { customerBarbers, formatRupiah } from "./utils";
import { useCashierPrototype } from "./cashier-context";
import {
  CashierPageHeading,
  CashierPrototypeNote,
} from "./cashier-ui";

const quickLinks = [
  {
    href: "/kasir/booking",
    label: "Catat Booking",
    description: "Buat catatan booking pelanggan.",
    icon: "＋",
  },
  {
    href: "/kasir/transaksi",
    label: "Catat Transaksi",
    description: "Catat pembayaran secara prototipe.",
    icon: "↗",
  },
  {
    href: "/kasir/pelanggan",
    label: "Data Pelanggan",
    description: "Lihat dan kelola data pelanggan.",
    icon: "♙",
  },
];

export default function CashierDashboard() {
  const { bookings, transactions } = useCashierPrototype();

  const todaysBookings = bookings.filter(
    (booking) => booking.isSample || booking.isToday,
  );
  const todaysTransactions = transactions.filter(
    (transaction) => transaction.isToday,
  );
  const dailyIncome = todaysTransactions.reduce(
    (total, transaction) => total + transaction.paidAmount,
    0,
  );

  return (
    <div className="cashier-page">
      <CashierPageHeading
        title="Beranda"
        description="Selamat datang, Kasir. Berikut ringkasan aktivitas hari ini."
      />
      <CashierPrototypeNote>
        Ringkasan dan data pada halaman ini adalah prototipe frontend, bukan
        catatan dari database.
      </CashierPrototypeNote>

      <section className="cashier-metric-grid" aria-label="Ringkasan hari ini">
        <article className="cashier-metric-card">
          <span className="cashier-metric-icon" aria-hidden="true">▣</span>
          <div>
            <p>Booking Hari Ini</p>
            <strong>{todaysBookings.length}</strong>
          </div>
        </article>
        <article className="cashier-metric-card">
          <span className="cashier-metric-icon" aria-hidden="true">▤</span>
          <div>
            <p>Transaksi Hari Ini</p>
            <strong>{todaysTransactions.length}</strong>
          </div>
        </article>
        <article className="cashier-metric-card">
          <span className="cashier-metric-icon" aria-hidden="true">Rp</span>
          <div>
            <p>Pendapatan Hari Ini</p>
            <strong>{formatRupiah(dailyIncome)}</strong>
          </div>
        </article>
      </section>

      <section className="cashier-section">
        <h2>Akses Cepat</h2>
        <div className="cashier-quick-grid">
          {quickLinks.map((item) => (
            <Link
              className="cashier-quick-card"
              href={item.href}
              key={item.href}
            >
              <span aria-hidden="true">{item.icon}</span>
              <strong>{item.label}</strong>
              <small>{item.description}</small>
              <span className="cashier-quick-arrow" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="cashier-panel cashier-table-panel">
        <div className="cashier-panel-heading">
          <div>
            <h2>Booking Hari Ini</h2>
            <p>Contoh dan catatan booking prototipe.</p>
          </div>
          <Link className="cashier-text-link" href="/kasir/booking">
            Catat Booking
          </Link>
        </div>
        <div className="cashier-table-scroll">
          <table className="cashier-table">
            <thead>
              <tr>
                <th scope="col">Jam</th>
                <th scope="col">Pelanggan</th>
                <th scope="col">Layanan</th>
                <th scope="col">Kapster</th>
              </tr>
            </thead>
            <tbody>
              {todaysBookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.time}</td>
                  <td>
                    <span className="cashier-cell-title">
                      {booking.customerName}
                    </span>
                    {booking.isSample && (
                      <span className="cashier-sample-tag">Prototipe</span>
                    )}
                  </td>
                  <td>{booking.serviceName}</td>
                  <td>
                    {customerBarbers.find(
                      (barber) => barber.id === booking.barberId,
                    )?.name ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
