"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatRupiah, formatTanggal } from "../../utils";
import { formatPaymentMethod } from "../../../pelanggan/data";
import { CashierPageHeading } from "../../cashier-ui";

type TransactionItem = {
  id: string;
  type: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

type Transaction = {
  id: string;
  date: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  customerName: string;
  cashierName: string;
  bookingId: string | null;
  items: TransactionItem[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTransactionItem(value: unknown): value is TransactionItem {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.type === "string" &&
    typeof value.name === "string" &&
    typeof value.quantity === "number" &&
    typeof value.unitPrice === "number" &&
    typeof value.total === "number"
  );
}

function isTransaction(value: unknown): value is Transaction {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.date === "string" &&
    typeof value.total === "number" &&
    typeof value.paymentMethod === "string" &&
    typeof value.paymentStatus === "string" &&
    typeof value.customerName === "string" &&
    typeof value.cashierName === "string" &&
    (typeof value.bookingId === "string" || value.bookingId === null) &&
    Array.isArray(value.items) &&
    value.items.every(isTransactionItem)
  );
}

export default function CashierTransactionDetail({
  transactionId,
}: {
  transactionId: string;
}) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTransaction = useCallback(async () => {
    if (!transactionId) {
      setError("ID transaksi tidak ditemukan.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/kasir/transaksi/${encodeURIComponent(transactionId)}`,
        { cache: "no-store" },
      );

      const result: unknown = await response.json();

      if (
        !response.ok ||
        !isRecord(result) ||
        !isTransaction(result.transaction)
      ) {
        throw new Error(
          isRecord(result) && typeof result.message === "string"
            ? result.message
            : "Detail transaksi tidak dapat dimuat.",
        );
      }

      setTransaction(result.transaction);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Detail transaksi tidak dapat dimuat.",
      );
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  useEffect(() => {
    void Promise.resolve().then(loadTransaction);
  }, [loadTransaction]);

  return (
    <div className="cashier-page">
      <CashierPageHeading
        title="Detail Transaksi"
        description="Periksa rincian transaksi."
      />

      {loading && (
        <div className="cashier-empty-state" aria-busy="true">
          <p>Memuat detail transaksi...</p>
        </div>
      )}

      {!loading && error && (
        <div className="cashier-empty-state" role="alert">
          <h2>Data transaksi tidak dapat dimuat</h2>
          <p>{error}</p>
          <button
            className="cashier-button cashier-button--secondary"
            onClick={() => void loadTransaction()}
            type="button"
          >
            Coba lagi
          </button>
          <Link
            className="cashier-button cashier-button--primary"
            href="/kasir/transaksi"
          >
            Kembali ke Catat Transaksi
          </Link>
        </div>
      )}

      {!loading && !error && transaction && (
        <>
          <section
            className="cashier-panel cashier-receipt"
            aria-label="Rincian transaksi"
          >
            <div className="cashier-receipt-brand">
              <span className="cashier-receipt-mark" aria-hidden="true">
                CB
              </span>
              <div>
                <strong>CONTINENT BARBERSHOP</strong>
                <small>Bukti pencatatan transaksi</small>
              </div>
            </div>

            <dl className="cashier-detail-list">
              <div>
                <dt>ID Transaksi</dt>
                <dd>{transaction.id}</dd>
              </div>
              <div>
                <dt>Tanggal Transaksi</dt>
                <dd>{formatTanggal(transaction.date)}</dd>
              </div>
              <div>
                <dt>Nama Pelanggan</dt>
                <dd>{transaction.customerName}</dd>
              </div>
              <div>
                <dt>Kasir</dt>
                <dd>{transaction.cashierName}</dd>
              </div>
              {transaction.bookingId && (
                <div>
                  <dt>ID Booking</dt>
                  <dd>{transaction.bookingId}</dd>
                </div>
              )}
              <div>
                <dt>Metode Pembayaran</dt>
                <dd>{formatPaymentMethod(transaction.paymentMethod)}</dd>
              </div>
              <div>
                <dt>Status Pembayaran</dt>
                <dd>{transaction.paymentStatus}</dd>
              </div>
            </dl>

            <h3>Rincian Item</h3>
            <dl className="cashier-detail-list">
              {transaction.items.map((item) => (
                <div key={item.id}>
                  <dt>
                    {item.name} ({item.type}) &times; {item.quantity}
                    <small>
                      {formatRupiah(item.unitPrice)} per item
                    </small>
                  </dt>
                  <dd>{formatRupiah(item.total)}</dd>
                </div>
              ))}
              <div className="cashier-detail-total">
                <dt>Total Transaksi</dt>
                <dd>{formatRupiah(transaction.total)}</dd>
              </div>
            </dl>

            <p className="cashier-receipt-status">
              Transaksi berhasil dicatat.
            </p>
          </section>

          <div className="cashier-form-actions cashier-actions">
            <Link
              className="cashier-button cashier-button--secondary"
              href="/kasir"
            >
              Kembali ke Beranda
            </Link>
            <button
              className="cashier-button cashier-button--primary"
              onClick={() => window.print()}
              type="button"
            >
              Cetak Struk
            </button>
          </div>
        </>
      )}
    </div>
  );
}
