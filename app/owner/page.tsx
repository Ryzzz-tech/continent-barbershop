import Link from "next/link";
import { OwnerPageHeading } from "./owner-ui";

const menuCards = [
  {
    href: "/owner/laporan-transaksi",
    icon: "▤",
    title: "Laporan Transaksi",
    description: "Lihat laporan transaksi berdasarkan periode waktu.",
  },
  {
    href: "/owner/restock-produk",
    icon: "＋",
    title: "Restock Produk",
    description: "Tambah jumlah stok produk yang tersedia.",
  },
  {
    href: "/owner/kapster-kasir",
    icon: "♙",
    title: "Data Kapster & Kasir",
    description: "Tambah, lihat, ubah, dan hapus data kapster dan kasir.",
  },
  {
    href: "/owner/layanan-produk",
    icon: "▦",
    title: "Data Layanan & Produk",
    description: "Tambah, lihat, ubah, dan hapus data layanan dan produk.",
  },
];

export default function OwnerDashboardPage() {
  return (
    <div className="cashier-page owner-page">
      <OwnerPageHeading title="Menu Utama" />
      <p className="owner-welcome">
        Selamat Datang, Owner. Pilih menu yang ingin dikelola.
      </p>
      <section className="owner-menu-grid" aria-label="Menu pengelolaan Owner">
        {menuCards.map((card) => (
          <Link className="cashier-quick-card owner-menu-card" href={card.href} key={card.href}>
            <span aria-hidden="true">{card.icon}</span>
            <strong>{card.title}</strong>
            <small>{card.description}</small>
            <span className="cashier-quick-arrow" aria-hidden="true">→</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
