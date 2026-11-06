"use client";

import Link from "next/link";
import { customerBarbers, formatRupiah, formatTanggal } from "../../utils";
import { useCashierPrototype } from "../../cashier-context";
import { CashierPageHeading, CashierPrototypeNote } from "../../cashier-ui";

export default function CashierTransactionDetail() {
  const { transactionDraft } = useCashierPrototype();

  if (!transactionDraft) {
    return (
      <div className="cashier-page">
        <CashierPageHeading title="Detail Transaksi" />
        <div className="cashier-empty-state">
          <h2>Data transaksi tidak tersedia</h2>
          <p>Mulai dari formulir Catat Transaksi untuk mengisi detail.</p>
          <Link className="cashier-button cashier-button--primary" href="/kasir/transaksi">
            Kembali ke Catat Transaksi
          </Link>
        </div>
      </div>
    );
  }

  const barber = customerBarbers.find(
    (item) => item.id === transactionDraft.barberId,
  );

  return (
    <div className="cashier-page">
      <CashierPageHeading
        title="Detail Transaksi"
        description="Rincian pencatatan pembayaran prototipe."
      />
      <CashierPrototypeNote>
        Simulasi pencatatan lokal saja. Transaksi ini tidak diproses oleh penyedia
        pembayaran dan belum tersimpan ke database.
      </CashierPrototypeNote>
      <section className="cashier-panel cashier-receipt" aria-label="Rincian transaksi">
        <div className="cashier-receipt-brand">
          <span className="cashier-receipt-mark" aria-hidden="true">CB</span>
          <div>
            <strong>CONTINENT BARBERSHOP</strong>
            <small>Rincian transaksi prototipe</small>
          </div>
        </div>
        <dl className="cashier-detail-list">
          <div><dt>Nama Pelanggan</dt><dd>{transactionDraft.customerName}</dd></div>
          <div><dt>Layanan</dt><dd>{transactionDraft.serviceName}</dd></div>
          <div><dt>Jadwal</dt><dd>{formatTanggal(transactionDraft.date)}, {transactionDraft.time}</dd></div>
          <div><dt>Kapster</dt><dd>{barber?.name ?? "Tidak ditemukan"}</dd></div>
          <div><dt>Total Tagihan</dt><dd>{formatRupiah(transactionDraft.total)}</dd></div>
          <div className="cashier-detail-total">
            <dt>Nominal Pembayaran</dt>
            <dd>{formatRupiah(transactionDraft.paidAmount)}</dd>
          </div>
        </dl>
        <p className="cashier-receipt-status">
          Simulasi pencatatan — bukan bukti pembayaran nyata
        </p>
      </section>
      <div className="cashier-form-actions cashier-actions">
        <Link className="cashier-button cashier-button--secondary" href="/kasir">
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
    </div>
  );
}
