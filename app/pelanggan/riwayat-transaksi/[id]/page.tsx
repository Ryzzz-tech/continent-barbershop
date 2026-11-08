"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatRupiah, formatTanggal } from "../../data";

type Transaction = {
  id: string;
  date: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  bookingId: string | null;
  items: { id: string; name: string; quantity: number; price: number; total: number }[];
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
    (value.bookingId === null || typeof value.bookingId === "string") &&
    Array.isArray(value.items) &&
    value.items.every((item) =>
      isRecord(item) &&
      typeof item.id === "string" &&
      typeof item.name === "string" &&
      typeof item.quantity === "number" &&
      typeof item.price === "number" &&
      typeof item.total === "number",
    );
}

function TransactionDetailContent() {
  const params = useParams<{ id: string }>();
  const transactionId = decodeURIComponent(params.id);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTransaction = useCallback(async () => {
    try {
      const response = await fetch(`/api/transaksi/${encodeURIComponent(transactionId)}`, { cache: "no-store" });
      const result: unknown = await response.json();
      if (!response.ok || !isRecord(result) || !isTransaction(result.transaction)) {
        throw new Error(
          isRecord(result) && typeof result.message === "string"
            ? result.message
            : "Detail transaksi tidak dapat dimuat.",
        );
      }
      setTransaction(result.transaction);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Detail transaksi tidak dapat dimuat.");
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  useEffect(() => { void Promise.resolve().then(loadTransaction); }, [loadTransaction]);

  return (
    <div className="customer-page">
      <Link className="customer-back-link" href="/pelanggan/riwayat-transaksi"><span aria-hidden="true">←</span> Kembali ke Riwayat Transaksi</Link>
      <header className="customer-page-heading"><h1>DETAIL TRANSAKSI</h1></header>
      {loading && <div className="customer-empty-state" aria-busy="true"><p>Memuat detail transaksi...</p></div>}
      {!loading && error && (
        <div className="customer-empty-state" role="alert">
          <h2>Detail transaksi tidak dapat dimuat</h2><p>{error}</p>
          <button className="customer-outline-button" onClick={() => { setLoading(true); setError(""); void loadTransaction(); }} type="button">Coba lagi</button>
          <Link className="customer-primary-button" href="/pelanggan/riwayat-transaksi">Kembali</Link>
        </div>
      )}
      {!loading && !error && transaction && (
        <section className="customer-panel">
          <div className="booking-draft-card__header"><div><span className="kapster-booking-id">{transaction.id}</span><h2>{transaction.bookingId ? `Booking ${transaction.bookingId}` : "Transaksi"}</h2></div><strong>{formatRupiah(transaction.total)}</strong></div>
          <dl className="customer-detail-list">
            <div><dt>Tanggal</dt><dd>{formatTanggal(transaction.date)}</dd></div>
            <div><dt>Metode Pembayaran</dt><dd>{transaction.paymentMethod}</dd></div>
            <div><dt>Status Pembayaran</dt><dd>{transaction.paymentStatus}</dd></div>
          </dl>
          <h3>Rincian</h3>
          {transaction.items.map((item) => (
            <dl className="customer-detail-list" key={item.id}>
              <div><dt>{item.name} × {item.quantity}</dt><dd>{formatRupiah(item.total)}</dd></div>
            </dl>
          ))}
          {transaction.paymentMethod.includes("Simulasi") && (
            <p className="customer-field-hint">Transaksi ini merupakan simulasi prototipe, bukan bukti pembayaran atau penerimaan dana sungguhan.</p>
          )}
        </section>
      )}
    </div>
  );
}

export default function TransactionDetailPage() {
  return <Suspense fallback={<div className="customer-page" aria-busy="true"><p>Memuat detail transaksi...</p></div>}><TransactionDetailContent /></Suspense>;
}
