"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatRupiah } from "./utils";
import { CashierPageHeading } from "./cashier-ui";

type DashboardBooking = {
  id: string;
  date: string;
  time: string;
  status: string;
  customerName: string;
  serviceName: string;
  barberName: string;
};

type CashierDashboardData = {
  success: true;
  date: string;
  bookingCount: number;
  transactionCount: number;
  dailyIncome: number;
  upcomingBookings: DashboardBooking[];
};

const quickLinks = [
  {
    href: "/kasir/booking",
    label: "Catat Booking",
    description: "Buat booking pelanggan.",
    icon: "+",
  },
  {
    href: "/kasir/transaksi",
    label: "Catat Transaksi",
    description: "Buka halaman pencatatan transaksi.",
    icon: ">",
  },
  {
    href: "/kasir/pelanggan",
    label: "Data Pelanggan",
    description: "Lihat dan kelola data pelanggan.",
    icon: "P",
  },
];

function formatBookingDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export default function CashierDashboard() {
  const [data, setData] = useState<CashierDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const response = await fetch("/api/kasir/dashboard", {
          cache: "no-store",
        });
        const result = (await response.json()) as
          | CashierDashboardData
          | { error?: string };

        if (!response.ok || !("success" in result) || result.success !== true) {
          throw new Error(
            "error" in result && result.error
              ? result.error
              : "Data dashboard gagal dimuat.",
          );
        }

        if (isMounted) {
          setData(result);
          setError("");
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Terjadi kesalahan saat mengambil data dashboard.",
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="cashier-page">
      <CashierPageHeading
        title="Beranda"
        description="Selamat datang, Kasir. Berikut ringkasan aktivitas hari ini."
      />

      <section className="cashier-metric-grid" aria-label="Ringkasan hari ini">
        <article className="cashier-metric-card">
          <span className="cashier-metric-icon" aria-hidden="true">B</span>
          <div>
            <p>Booking Hari Ini</p>
            <strong>
              {loading && !data ? "..." : data?.bookingCount ?? "—"}
            </strong>
          </div>
        </article>

        <article className="cashier-metric-card">
          <span className="cashier-metric-icon" aria-hidden="true">T</span>
          <div>
            <p>Transaksi Hari Ini</p>
            <strong>
              {loading && !data ? "..." : data?.transactionCount ?? "—"}
            </strong>
          </div>
        </article>

        <article className="cashier-metric-card">
          <span className="cashier-metric-icon" aria-hidden="true">Rp</span>
          <div>
            <p>Pendapatan Hari Ini</p>
            <strong>
              {data ? formatRupiah(data.dailyIncome) : loading ? "..." : "—"}
            </strong>
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
              <span className="cashier-quick-arrow" aria-hidden="true">&gt;</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="cashier-panel cashier-table-panel">
        <div className="cashier-panel-heading">
          <div>
            <h2>Booking Terdekat</h2>
            <p>Lima booking mendatang dari database.</p>
          </div>
          <Link className="cashier-text-link" href="/kasir/booking">
            Lihat Booking
          </Link>
        </div>

        {error && (
          <p role="alert">
            Gagal memuat data dashboard: {error}
          </p>
        )}

        <div className="cashier-table-scroll">
          <table className="cashier-table">
            <thead>
              <tr>
                <th scope="col">Tanggal</th>
                <th scope="col">Jam</th>
                <th scope="col">Pelanggan</th>
                <th scope="col">Layanan</th>
                <th scope="col">Kapster</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>Memuat data booking...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6}>Data booking belum dapat ditampilkan.</td>
                </tr>
              ) : data && data.upcomingBookings.length > 0 ? (
                data.upcomingBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>{formatBookingDate(booking.date)}</td>
                    <td>{booking.time}</td>
                    <td>{booking.customerName}</td>
                    <td>{booking.serviceName}</td>
                    <td>{booking.barberName}</td>
                    <td>{booking.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>Belum ada booking mendatang.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
