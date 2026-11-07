"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useAppFeedback } from "../../components/app-feedback";
import { useCustomerServices } from "../../components/use-customer-services";
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
  const { bookingDraft, storageError, markBookingDraftPaid } =
    useCustomerPrototype();
  const customerServices = useCustomerServices();
  const { showToast } = useAppFeedback();
  const [paymentMethod, setPaymentMethod] = useState("");
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
  const isPaid = bookingDraft?.paymentStatus === "paid";

  function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!paymentMethod) {
      showToast(
        "Metode Pembayaran Belum Dipilih",
        "Pilih Transfer Bank, QRIS, atau E-Wallet sebelum melanjutkan.",
        "error",
      );
      return;
    }
    if (!paymentMethods.some((method) => method.id === paymentMethod)) {
      showToast("Metode Pembayaran Tidak Valid", "Pilih metode pembayaran yang tersedia.", "error");
      return;
    }

    const result = markBookingDraftPaid();
    if (result === "paid") {
      showToast(
        "Pembayaran Berhasil!",
        "Pembayaran berhasil disimulasikan. Status pembayaran booking Anda sekarang adalah Sudah Dibayar.",
        "success",
      );
    } else if (result === "already-paid") {
      showToast(
        "Pembayaran Sudah Disimulasikan",
        "Draft booking ini telah berstatus Sudah Dibayar.",
        "info",
      );
    } else if (result === "missing") {
      showToast("Draft Booking Tidak Ditemukan", "Tidak ada draft booking yang dapat diproses.", "error");
    } else {
      showToast(
        "Status Pembayaran Gagal Disimpan",
        "Pembayaran belum ditandai berhasil karena perubahan tidak tersimpan.",
        "error",
      );
    }
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
                    disabled={isPaid}
                    name="payment-method"
                    onChange={() => {
                      setPaymentMethod(method.id);
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
              Pembayaran hanya disimulasikan untuk prototipe. Tidak ada transaksi
              keuangan, verifikasi bank, atau bukti transaksi yang dibuat.
            </p>
            <button
              className="customer-primary-button"
              disabled={isPaid}
              type="submit"
            >
              {isPaid ? "Pembayaran Berhasil Disimulasikan" : "Lanjutkan Pembayaran"}
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
          <span className={`status-pill ${isPaid ? "status-pill--active" : "status-pill--draft"}`}>
            {isPaid ? "Sudah Dibayar" : "Belum Dibayar"}
          </span>
        </aside>
      </div>
    </div>
  );
}
