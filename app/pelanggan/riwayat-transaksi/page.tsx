"use client";

import Link from "next/link";
import { useState } from "react";

export default function TransactionHistoryPage() {
  const [query, setQuery] = useState("");

  return (
    <div className="customer-page">
      <header className="customer-page-heading">
        <h1>RIWAYAT TRANSAKSI</h1>
        <p>Lihat transaksi pembayaran yang pernah Anda lakukan.</p>
      </header>
      <div className="customer-history-toolbar">
        <label className="customer-search">
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="Cari transaksi"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari transaksi..."
            type="search"
            value={query}
          />
        </label>
        <button
          className="customer-outline-button"
          onClick={() => setQuery("")}
          type="button"
        >
          Reset Pencarian
        </button>
      </div>
      <div className="customer-empty-state">
        <span className="empty-state-icon" aria-hidden="true">▤</span>
        <h2>
          {query ? "Transaksi tidak ditemukan" : "Belum ada transaksi"}
        </h2>
        <p>
          {query
            ? "Tidak ada transaksi tersimpan yang cocok. Riwayat belum terhubung ke backend."
            : "Transaksi yang telah tercatat akan muncul di sini. Prototipe ini tidak membuat transaksi pembayaran."}
        </p>
        <Link className="customer-text-link" href="/pelanggan/layanan">
          Lihat layanan
        </Link>
      </div>
    </div>
  );
}
