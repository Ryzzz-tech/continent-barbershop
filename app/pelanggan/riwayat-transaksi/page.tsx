"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatPaymentMethod, formatRupiah, formatTanggal } from "../data";

type Transaction = {
  id: string;
  date: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  bookingId: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTransaction(value: unknown): value is Transaction {
  return isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.date === "string" &&
    typeof value.total === "number" &&
    typeof value.paymentMethod === "string" &&
    typeof value.paymentStatus === "string" &&
    (value.bookingId === null || typeof value.bookingId === "string");
}

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTransactions = useCallback(async () => {
    try {
      const response = await fetch("/api/transaksi", { cache: "no-store" });
      const result: unknown = await response.json();
      if (!response.ok || !isRecord(result) || !Array.isArray(result.transactions) || !result.transactions.every(isTransaction)) {
        throw new Error(
          isRecord(result) && typeof result.message === "string"
            ? result.message
            : "Riwayat transaksi tidak dapat dimuat.",
        );
      }
      setTransactions(result.transactions);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Riwayat transaksi tidak dapat dimuat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void Promise.resolve().then(loadTransactions); }, [loadTransactions]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("id-ID");
    return transactions.filter((transaction) =>
      !normalized ||
      transaction.id.toLocaleLowerCase("id-ID").includes(normalized) ||
      transaction.paymentMethod.toLocaleLowerCase("id-ID").includes(normalized) ||
      (transaction.bookingId?.toLocaleLowerCase("id-ID").includes(normalized) ?? false),
    );
  }, [query, transactions]);

  return (
    <div className="customer-page">
      <header className="customer-page-heading"><h1>RIWAYAT TRANSAKSI</h1><p>Lihat transaksi pembayaran yang pernah Anda lakukan.</p></header>
      <div className="customer-history-toolbar">
        <label className="customer-search"><span aria-hidden="true">&#x2315;</span><input aria-label="Cari transaksi" onChange={(event) => setQuery(event.target.value)} placeholder="Cari transaksi..." type="search" value={query} /></label>
        <button className="customer-outline-button" onClick={() => setQuery("")} type="button">Reset Pencarian</button>
      </div>
      {loading && <div className="customer-empty-state" aria-busy="true"><p>Memuat transaksi...</p></div>}
      {!loading && error && (
        <div className="customer-empty-state" role="alert">
          <h2>Riwayat transaksi tidak dapat dimuat</h2><p>{error}</p>
          <button className="customer-outline-button" onClick={() => { setLoading(true); setError(""); void loadTransactions(); }} type="button">Coba lagi</button>
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div className="customer-empty-state">
          <span className="empty-state-icon" aria-hidden="true">&#x25A4;</span>
          <h2>{transactions.length && query ? "Transaksi tidak ditemukan" : "Belum ada transaksi"}</h2>
          <p>{transactions.length && query ? "Tidak ada transaksi yang cocok dengan pencarian." : "Transaksi pembayaran yang tersimpan akan muncul di sini."}</p>
          <Link className="customer-text-link" href="/pelanggan/layanan">Lihat layanan</Link>
        </div>
      )}
      {!loading && !error && filtered.length > 0 && (
        <div className="customer-booking-list">
          {filtered.map((transaction) => (
            <article className="booking-draft-card" key={transaction.id}>
              <div className="booking-draft-card__header">
                <div><span className="kapster-booking-id">{transaction.id}</span><h3>{transaction.bookingId ? `Booking ${transaction.bookingId}` : "Transaksi"}</h3></div>
                <strong>{formatRupiah(transaction.total)}</strong>
              </div>
              <dl className="customer-detail-list">
                <div><dt>Tanggal</dt><dd>{formatTanggal(transaction.date)}</dd></div>
                <div><dt>Metode</dt><dd>{formatPaymentMethod(transaction.paymentMethod)}</dd></div>
                <div><dt>Status Pembayaran</dt><dd>{transaction.paymentStatus}</dd></div>
              </dl>
              <Link className="customer-outline-button" href={`/pelanggan/riwayat-transaksi/${encodeURIComponent(transaction.id)}`}>Lihat Detail</Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
