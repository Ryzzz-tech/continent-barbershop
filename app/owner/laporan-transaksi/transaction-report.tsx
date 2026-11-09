"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  formatPaymentMethod,
  formatRupiah,
  formatTanggal,
  isValidDateValue,
} from "../../pelanggan/data";
import { OwnerPageHeading } from "../owner-ui";

type TransactionItem = {
  id: string;
  type: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

type ReportTransaction = {
  id: string;
  date: string;
  customerName: string;
  barberName: string;
  bookingId: string | null;
  paymentMethod: string;
  paymentStatus: string;
  total: number;
  items: TransactionItem[];
};

type ReportData = {
  success: true;
  summary: {
    transactionCount: number;
    paidTransactionCount: number;
    revenue: number;
  };
  transactions: ReportTransaction[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isItem(value: unknown): value is TransactionItem {
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

function isTransaction(value: unknown): value is ReportTransaction {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.date === "string" &&
    typeof value.customerName === "string" &&
    typeof value.barberName === "string" &&
    (typeof value.bookingId === "string" || value.bookingId === null) &&
    typeof value.paymentMethod === "string" &&
    typeof value.paymentStatus === "string" &&
    typeof value.total === "number" &&
    Array.isArray(value.items) &&
    value.items.every(isItem)
  );
}

function isReportData(value: unknown): value is ReportData {
  return (
    isRecord(value) &&
    value.success === true &&
    isRecord(value.summary) &&
    typeof value.summary.transactionCount === "number" &&
    typeof value.summary.paidTransactionCount === "number" &&
    typeof value.summary.revenue === "number" &&
    Array.isArray(value.transactions) &&
    value.transactions.every(isTransaction)
  );
}

function getErrorMessage(value: unknown, fallback: string) {
  return isRecord(value) && typeof value.message === "string"
    ? value.message
    : fallback;
}

export default function OwnerTransactionReport() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedRange, setAppliedRange] = useState({
    from: "",
    to: "",
  });
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadReport() {
      setLoading(true);
      setError("");

      try {
        const query = new URLSearchParams();

        if (appliedRange.from) {
          query.set("from", appliedRange.from);
        }

        if (appliedRange.to) {
          query.set("to", appliedRange.to);
        }

        const response = await fetch(
          `/api/owner/laporan-transaksi?${query.toString()}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const result: unknown = await response.json();

        if (!response.ok || !isReportData(result)) {
          throw new Error(
            getErrorMessage(result, "Laporan transaksi tidak dapat dimuat."),
          );
        }

        setData(result);
      } catch (loadError) {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        ) {
          return;
        }

        setData(null);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Laporan transaksi tidak dapat dimuat.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadReport();

    return () => controller.abort();
  }, [appliedRange]);

  function applyFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      (fromDate && !isValidDateValue(fromDate)) ||
      (toDate && !isValidDateValue(toDate))
    ) {
      setError("Masukkan tanggal awal dan akhir yang valid.");
      return;
    }

    if (fromDate && toDate && fromDate > toDate) {
      setError("Tanggal awal tidak boleh lebih besar dari tanggal akhir.");
      return;
    }

    setError("");
    setAppliedRange({ from: fromDate, to: toDate });
  }

  const transactions = data?.transactions ?? [];

  return (
    <div className="cashier-page owner-page">
      <OwnerPageHeading
        title="Laporan Transaksi"
        description="Pilih periode waktu untuk melihat laporan transaksi."
      />



      <form
        className="cashier-panel owner-report-filter"
        onSubmit={applyFilter}
        noValidate
      >
        <div className="owner-filter-fields">
          <div className="cashier-field">
            <label htmlFor="owner-report-from">Dari Tanggal</label>
            <input
              aria-invalid={Boolean(error)}
              id="owner-report-from"
              onChange={(event) => setFromDate(event.target.value)}
              type="date"
              value={fromDate}
            />
          </div>

          <div className="cashier-field">
            <label htmlFor="owner-report-to">Sampai Tanggal</label>
            <input
              aria-invalid={Boolean(error)}
              id="owner-report-to"
              onChange={(event) => setToDate(event.target.value)}
              type="date"
              value={toDate}
            />
          </div>

          <button
            className="cashier-button cashier-button--primary"
            disabled={loading}
            type="submit"
          >
            {loading ? "Memuat..." : "Tampilkan"}
          </button>
        </div>

        {error && (
          <p className="cashier-error-banner" role="alert">
            {error}
          </p>
        )}
      </form>

      <section className="cashier-panel owner-report-panel">
        <div className="cashier-panel-heading">
          <div>
            <h2>Data Transaksi</h2>
            <p>
              Periode:{" "}
              {appliedRange.from
                ? formatTanggal(appliedRange.from)
                : "Semua tanggal"}{" sampai "}
              {appliedRange.to
                ? formatTanggal(appliedRange.to)
                : "Semua tanggal"}
            </p>
          </div>
        </div>

        {loading && (
          <div className="cashier-empty-state" aria-busy="true">
            <p>Memuat laporan transaksi...</p>
          </div>
        )}

        {!loading && error && (
          <div className="cashier-empty-state" role="alert">
            <p>Laporan transaksi tidak dapat ditampilkan.</p>
            <button
              className="cashier-button cashier-button--secondary"
              onClick={() => {
                setAppliedRange((current) => ({ ...current }));
              }}
              type="button"
            >
              Coba lagi
            </button>
          </div>
        )}

        {!loading && !error && data && transactions.length > 0 && (
          <>
            <div className="owner-report-total">
              <span>
                Jumlah Transaksi: {data.summary.transactionCount}
                {" | "}
                Transaksi Dibayar: {data.summary.paidTransactionCount}
              </span>
              <strong>
                Pendapatan: {formatRupiah(data.summary.revenue)}
              </strong>
            </div>

            <div className="cashier-table-scroll owner-table-scroll">
              <table className="cashier-table owner-table">
                <thead>
                  <tr>
                    <th scope="col">No.</th>
                    <th scope="col">ID Transaksi</th>
                    <th scope="col">Tanggal</th>
                    <th scope="col">Pelanggan</th>
                    <th scope="col">Kapster</th>
                    <th scope="col">Layanan / Produk</th>
                    <th scope="col">Metode</th>
                    <th scope="col">Status</th>
                    <th scope="col">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction, index) => (
                    <tr key={transaction.id}>
                      <td>{String(index + 1).padStart(2, "0")}</td>
                      <td>{transaction.id}</td>
                      <td>{formatTanggal(transaction.date)}</td>
                      <td>{transaction.customerName}</td>
                      <td>{transaction.barberName}</td>
                      <td>
                        {transaction.items.length > 0
                          ? transaction.items
                              .map(
                                (item) =>
                                  `${item.name} × ${item.quantity}`,
                              )
                              .join(", ")
                          : "—"}
                      </td>
                      <td>{formatPaymentMethod(transaction.paymentMethod)}</td>
                      <td>{transaction.paymentStatus}</td>
                      <td>{formatRupiah(transaction.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!loading && !error && data && transactions.length === 0 && (
          <div className="cashier-empty-state owner-empty-state">
            <p>Tidak ada transaksi pada periode ini.</p>
          </div>
        )}
      </section>
    </div>
  );
}
