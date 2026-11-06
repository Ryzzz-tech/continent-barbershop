"use client";

import { useMemo, useState, type FormEvent } from "react";
import { formatRupiah, formatTanggal, isValidDateValue } from "../../pelanggan/data";
import { ownerPrototypeTransactions } from "../prototype-data";
import { OwnerPageHeading, OwnerPrototypeNote } from "../owner-ui";

export default function OwnerTransactionReport() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedRange, setAppliedRange] = useState({ from: "", to: "" });
  const [error, setError] = useState("");

  const transactions = useMemo(
    () => ownerPrototypeTransactions.filter((transaction) =>
      (!appliedRange.from || transaction.date >= appliedRange.from) &&
      (!appliedRange.to || transaction.date <= appliedRange.to),
    ),
    [appliedRange],
  );
  const revenue = transactions.reduce((total, transaction) => total + transaction.total, 0);

  function applyFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if ((fromDate && !isValidDateValue(fromDate)) || (toDate && !isValidDateValue(toDate))) {
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

  return (
    <div className="cashier-page owner-page">
      <OwnerPageHeading
        title="Laporan Transaksi"
        description="Pilih periode waktu untuk melihat laporan transaksi."
      />
      <OwnerPrototypeNote>
        Data laporan adalah transaksi contoh prototipe dan tidak diambil dari transaksi Kasir atau database.
      </OwnerPrototypeNote>

      <form className="cashier-panel owner-report-filter" onSubmit={applyFilter} noValidate>
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
          <button className="cashier-button cashier-button--primary" type="submit">
            Tampilkan
          </button>
        </div>
        {error && <p className="cashier-error-banner" role="alert">{error}</p>}
      </form>

      <section className="cashier-panel owner-report-panel">
        <div className="cashier-panel-heading">
          <div>
            <h2>Data Transaksi</h2>
            <p>
              Periode: {appliedRange.from ? formatTanggal(appliedRange.from) : "Semua tanggal"}
              {" — "}
              {appliedRange.to ? formatTanggal(appliedRange.to) : "Semua tanggal"}
            </p>
          </div>
        </div>
        {transactions.length > 0 ? (
          <>
            <div className="cashier-table-scroll owner-table-scroll">
              <table className="cashier-table owner-table">
                <thead>
                  <tr>
                    <th scope="col">No.</th>
                    <th scope="col">Tanggal</th>
                    <th scope="col">Kapster</th>
                    <th scope="col">Layanan / Produk</th>
                    <th scope="col">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction, index) => (
                    <tr key={transaction.id}>
                      <td>{String(index + 1).padStart(2, "0")}</td>
                      <td>{formatTanggal(transaction.date)}</td>
                      <td>{transaction.barber}</td>
                      <td>{transaction.item}</td>
                      <td>{formatRupiah(transaction.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="owner-report-total">
              <span>Total Pendapatan</span>
              <strong>{formatRupiah(revenue)}</strong>
            </div>
          </>
        ) : (
          <div className="cashier-empty-state owner-empty-state">
            <p>Tidak ada transaksi pada periode ini</p>
          </div>
        )}
      </section>
    </div>
  );
}
