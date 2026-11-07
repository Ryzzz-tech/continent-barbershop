"use client";

import Link from "next/link";
import { useCustomerServices } from "../components/use-customer-services";
import { formatRupiah } from "./data";

const featuredServiceIds = [
  "regular-haircut",
  "premium-haircut",
  "full-service",
  "hair-styling",
  "hair-colour",
  "home-service",
];

export default function CustomerHomePage() {
  const customerServices = useCustomerServices();
  const featuredServices = featuredServiceIds
    .map((id) => customerServices.find((service) => service.id === id))
    .filter((service) => service !== undefined);

  return (
    <div className="customer-page customer-home">
      <header className="customer-page-heading">
        <h1>SELAMAT DATANG DI CONTINENT BARBERSHOP</h1>
        <p>
          Kelola booking, lihat jadwal kapster, dan periksa transaksi Anda
          melalui halaman ini.
        </p>
      </header>

      <section className="customer-promo">
        <h2>Tampil Rapi, Tampil Percaya Diri</h2>
        <p>Temukan layanan perawatan rambut yang sesuai dengan gaya Anda.</p>
        <Link className="customer-primary-button" href="/pelanggan/booking/buat">
          Buat Booking <span aria-hidden="true">+</span>
        </Link>
      </section>

      <section className="customer-section">
        <h2>Ringkasan Aktivitas</h2>
        <div className="customer-summary-grid">
          <article className="customer-summary-card">
            <span className="customer-summary-icon" aria-hidden="true">▣</span>
            <p>Booking Aktif</p>
            <strong>0</strong>
          </article>
          <article className="customer-summary-card">
            <span className="customer-summary-icon" aria-hidden="true">▤</span>
            <p>Transaksi</p>
            <strong>0</strong>
          </article>
          <article className="customer-summary-card customer-summary-card--next">
            <span className="customer-summary-icon" aria-hidden="true">◷</span>
            <p>Jadwal Berikutnya</p>
            <strong>Belum ada jadwal</strong>
          </article>
        </div>
      </section>

      <section className="customer-section">
        <div className="customer-section-heading">
          <h2>Layanan Unggulan</h2>
          <Link href="/pelanggan/layanan">Lihat semua layanan</Link>
        </div>
        <div className="featured-service-grid">
          {featuredServices.map((service) => (
            <Link
              className="featured-service-card"
              href="/pelanggan/layanan"
              key={service.id}
            >
              <strong>{service.name}</strong>
              <span>{formatRupiah(service.price)}</span>
              {service.description?.trim() && (
                <small>{service.description.trim()}</small>
              )}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
