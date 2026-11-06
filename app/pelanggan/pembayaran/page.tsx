"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { customerServices } from "../../../lib/data/services";
import {
  customerBarbers,
  formatTanggal,
  formatRupiah,
  isBookingDatePast,
  isValidDateValue,
  isValidTimeValue,
} from "../data";
import { useCustomerPrototype } from "../components/customer-context";

const paymentMethods = [
  { id: "bank-transfer", label: "Transfer Bank", detail: "Virtual Account" },
  { id: "qris", label: "QRIS", detail: "Pembayaran QR" },
  { id: "e-wallet", label: "E-Wallet", detail: "Dompet digital" },
];

export default function OnlinePaymentPage() {
  const { bookingDraft, storageError } = useCustomerPrototype();
  const [paymentMethod, setPaymentMethod] = useState("");
  const [message, setMessage] = useState("");
  const service = customerServices.find(
    (item) => item.id === bookingDraft?.serviceId,
  );
  const barber = customerBarbers.find(
    (item) => item.id === bookingDraft?.barberId,
  );
  const draftIsComplete = Boolean(
    bookingDraft &&
      service &&
      barber &&
      isValidDateValue(bookingDraft.date) &&
      !isBookingDatePast(bookingDraft.date) &&
      isValidTimeValue(bookingDraft.time) &&
      bookingDraft.price === service.price &&
      bookingDraft.total === service.price,
  );

  function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!paymentMethod) {
      setMessage("Pilih metode pembayaran terlebih dahulu.");
      return;
    }
    setMessage(
      "Integrasi pembayaran belum tersedia. Tidak ada pembayaran yang diproses dan booking belum tersimpan.",
    );
  }

  if (!bookingDraft) {
    return (
      <div className="customer-page">
        <header className="customer-page-heading">
          <h1>PEMBAYARAN ONLINE</h1>
          <p>Ringkasan pembayaran booking Anda.</p>
        </header>
        {storageError && (
          <p className="customer-form-error" role="status">
            {storageError}
          </p>
        )}
        <div className="customer-empty-state">
          <span className="empty-state-icon" aria-hidden="true">▤</span>
          <h2>Belum ada draft booking</h2>
          <p>
            Lengkapi formulir booking untuk meninjau pilihan metode pembayaran.
          </p>
          <Link className="customer-primary-button" href="/pelanggan/booking/buat">
            Buat Booking
          </Link>
        </div>
      </div>
    );
  }

  if (!draftIsComplete || !service || !barber) {
    return (
      <div className="customer-page">
        <header className="customer-page-heading">
          <h1>PEMBAYARAN ONLINE</h1>
          <p>Lengkapi draft booking sebelum memilih metode pembayaran.</p>
        </header>
        {storageError && (
          <p className="customer-form-error" role="status">
            {storageError}
          </p>
        )}
        <div className="customer-empty-state">
          <span className="empty-state-icon" aria-hidden="true">▤</span>
          <h2>Draft booking belum lengkap</h2>
          <p>
            Draft {bookingDraft.reference} belum memiliki pilihan layanan,
            kapster, tanggal, atau waktu yang valid. Draft belum menjadi booking.
          </p>
          <Link
            className="customer-primary-button"
            href={`/pelanggan/booking/buat${service ? `?layanan=${encodeURIComponent(service.id)}` : ""}`}
          >
            Lengkapi Draft Booking
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-page">
      <Link className="customer-back-link" href="/pelanggan/booking/buat">
        <span aria-hidden="true">←</span> Kembali ke Form Booking
      </Link>
      <header className="customer-page-heading">
        <h1>PEMBAYARAN ONLINE</h1>
        <p>Tinjau draft dan pilih metode pembayaran.</p>
      </header>
      {storageError && (
        <p className="customer-form-error" role="status">
          {storageError}
        </p>
      )}

      <div className="payment-layout">
        <section className="customer-panel">
          <h2>Pilih Metode Pembayaran</h2>
          <form onSubmit={submitPayment}>
            <div className="payment-method-list">
              {paymentMethods.map((method) => (
                <label
                  className={`payment-method${paymentMethod === method.id ? " is-selected" : ""}`}
                  key={method.id}
                >
                  <input
                    checked={paymentMethod === method.id}
                    name="payment-method"
                    onChange={() => {
                      setPaymentMethod(method.id);
                      setMessage(
                        "Integrasi pembayaran belum tersedia. Pilihan ini hanya pratinjau; tidak ada pembayaran yang diproses.",
                      );
                    }}
                    type="radio"
                    value={method.id}
                  />
                  <span className="payment-method__mark" aria-hidden="true">
                    {method.id === "qris" ? "▦" : method.id === "e-wallet" ? "▣" : "▤"}
                  </span>
                  <span>
                    <strong>{method.label}</strong>
                    <small>{method.detail}</small>
                  </span>
                </label>
              ))}
            </div>
            <p className="customer-field-hint">
              Ini hanya pilihan metode untuk pratinjau. Tidak ada pembayaran
              atau transaksi yang dibuat.
            </p>
            {message && (
              <p
                className={paymentMethod ? "customer-info-banner" : "customer-form-error"}
                role={paymentMethod ? "status" : "alert"}
              >
                {message}
              </p>
            )}
            <button className="customer-primary-button" type="submit">
              Lanjutkan Pembayaran
            </button>
          </form>
        </section>

        <aside className="booking-summary-panel">
          <h2>Ringkasan Booking</h2>
          <dl className="customer-detail-list">
            <div>
              <dt>Referensi Draft</dt>
              <dd>{bookingDraft.reference}</dd>
            </div>
            <div>
              <dt>Layanan</dt>
              <dd>{service.name}</dd>
            </div>
            <div>
              <dt>Kapster</dt>
              <dd>{barber?.name ?? "Belum dipilih"}</dd>
            </div>
            <div>
              <dt>Tanggal</dt>
              <dd>{formatTanggal(bookingDraft.date)}</dd>
            </div>
            <div>
              <dt>Waktu</dt>
              <dd>{bookingDraft.time}</dd>
            </div>
            <div className="booking-summary-total">
              <dt>Total</dt>
              <dd>{formatRupiah(bookingDraft.total)}</dd>
            </div>
          </dl>
          <span className="status-pill status-pill--draft">
            Draft — belum dibayar
          </span>
        </aside>
      </div>
    </div>
  );
}
