"use client";

import Link from "next/link";
import { useState } from "react";
import { customerBarbers, formatTanggal } from "../../utils";
import { useCashierPrototype } from "../../cashier-context";
import {
  CashierPageHeading,
  CashierPrototypeNote,
} from "../../cashier-ui";

export default function CashierBookingDetail() {
  const { bookingDraft, saveBooking, announce } = useCashierPrototype();
  const [error, setError] = useState("");

  if (!bookingDraft) {
    return (
      <div className="cashier-page">
        <CashierPageHeading title="Detail Booking" />
        <div className="cashier-empty-state">
          <h2>Data booking tidak tersedia</h2>
          <p>Mulai dari formulir Catat Booking untuk mengisi detail.</p>
          <Link className="cashier-button cashier-button--primary" href="/kasir/booking">
            Kembali ke Catat Booking
          </Link>
        </div>
      </div>
    );
  }

  const draft = bookingDraft;
  const barber = customerBarbers.find(
    (item) => item.id === draft.barberId,
  );

  function handleSave() {
    if (
      !draft.customerName.trim() ||
      !draft.serviceId ||
      !draft.date ||
      !draft.time ||
      !barber
    ) {
      setError("Detail booking tidak lengkap. Kembali ke formulir untuk memperbaikinya.");
      return;
    }
    if (draft.saved) {
      setError("Booking ini sudah dicatat dalam prototipe.");
      return;
    }
    if (!saveBooking(draft)) {
      setError("Booking ini sudah dicatat dan tidak dapat disimpan ulang.");
      return;
    }
    setError("");
    announce("Booking berhasil dicatat pada simulasi prototipe, bukan database.");
  }

  return (
    <div className="cashier-page">
      <CashierPageHeading
        title="Detail Booking"
        description="Periksa kembali informasi sebelum mencatat booking."
      >
        <Link className="cashier-text-link" href="/kasir/booking">
          ← Ubah Data
        </Link>
      </CashierPageHeading>
      <CashierPrototypeNote>
        Jadwal belum diverifikasi melalui backend. Status ketersediaan kapster
        belum diketahui.
      </CashierPrototypeNote>
      <section className="cashier-panel cashier-detail-panel">
        <dl className="cashier-detail-list">
          <div><dt>Nama Pelanggan</dt><dd>{draft.customerName}</dd></div>
          <div><dt>Layanan</dt><dd>{draft.serviceName}</dd></div>
          <div><dt>Jadwal</dt><dd>{formatTanggal(draft.date)}, {draft.time}</dd></div>
          <div><dt>Kapster</dt><dd>{barber?.name ?? "Tidak ditemukan"}</dd></div>
        </dl>
        <div className="cashier-availability cashier-availability--unknown" role="status">
          <span aria-hidden="true">◷</span>
          <span>
            <strong>Jadwal belum terverifikasi</strong>
            <small>Ketersediaan kapster belum terhubung ke sistem jadwal.</small>
          </span>
        </div>
        {draft.saved && (
          <p className="cashier-success-banner" role="status">
            Booking berhasil dicatat pada state prototipe. Data belum tersimpan ke
            PostgreSQL.
          </p>
        )}
        {error && <p className="cashier-error-banner" role="alert">{error}</p>}
        <div className="cashier-form-actions">
          <Link className="cashier-button cashier-button--secondary" href="/kasir">
            Kembali ke Beranda
          </Link>
          <button
            className="cashier-button cashier-button--primary"
            disabled={draft.saved}
            onClick={handleSave}
            type="button"
          >
            {draft.saved ? "Booking Tercatat" : "Simpan Booking"}
          </button>
        </div>
      </section>
    </div>
  );
}
