"use client";

import Link from "next/link";
import { useState } from "react";
import ConfirmDialog from "../../components/confirm-dialog";
import { useAppFeedback } from "../../components/app-feedback";
import { useCustomerServices } from "../../components/use-customer-services";
import { customerBarbers, formatTanggal, formatRupiah } from "../data";
import { useCustomerPrototype } from "../components/customer-context";

export default function CustomerBookingsPage() {
  const {
    bookingDraft,
    clearBookingDraft,
    storageError,
  } = useCustomerPrototype();
  const { showToast } = useAppFeedback();
  const customerServices = useCustomerServices();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const service = customerServices.find(
    (item) => item.id === bookingDraft?.serviceId,
  );
  const barber = customerBarbers.find(
    (item) => item.id === bookingDraft?.barberId,
  );

  return (
    <div className="customer-page">
      <header className="customer-page-heading">
        <h1>BOOKING SAYA</h1>
        <p>Kelola booking layanan Anda melalui halaman ini.</p>
      </header>

      {storageError && (
        <p className="customer-form-error" role="status">
          {storageError}
        </p>
      )}

      <section className="customer-booking-callout">
        <div>
          <h2>Butuh potong rambut?</h2>
          <p>Pilih layanan dan jadwal untuk memulai booking.</p>
        </div>
        <Link className="customer-primary-button" href="/pelanggan/booking/buat">
          Buat Booking
        </Link>
      </section>

      <section className="customer-section">
        {bookingDraft && (
          <>
            <h2>Draft Booking</h2>
          <article className="booking-draft-card">
            <div className="booking-draft-card__header">
              <div>
                <span className="status-pill status-pill--draft">
                  Draft — belum dikirim
                </span>
                <h3>{service?.name ?? "Layanan belum dipilih"}</h3>
              </div>
              <strong>{service ? formatRupiah(service.price) : "—"}</strong>
            </div>
            <dl className="customer-detail-list">
              <div>
                <dt>Referensi Draft</dt>
                <dd>{bookingDraft.reference}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>Bukan booking tersimpan atau aktif</dd>
              </div>
              <div>
                <dt>Status Pembayaran</dt>
                <dd>
                  {bookingDraft.paymentStatus === "paid"
                    ? "Sudah Dibayar (simulasi)"
                    : "Belum Dibayar"}
                </dd>
              </div>
              <div>
                <dt>Kapster</dt>
                <dd>{barber?.name ?? "Belum dipilih"}</dd>
              </div>
              <div>
                <dt>Tanggal</dt>
                <dd>
                  {bookingDraft.date
                    ? formatTanggal(bookingDraft.date)
                    : "Belum dipilih"}
                </dd>
              </div>
              <div>
                <dt>Waktu</dt>
                <dd>{bookingDraft.time || "Belum dipilih"}</dd>
              </div>
              <div>
                <dt>Total biaya</dt>
                <dd>{service ? formatRupiah(service.price) : "—"}</dd>
              </div>
            </dl>
            <div className="customer-card-actions">
              <Link
                className="customer-outline-button"
                href={`/pelanggan/booking/buat?layanan=${encodeURIComponent(bookingDraft.serviceId)}`}
              >
                Ubah Draft
              </Link>
              <button
                className="customer-danger-button"
                onClick={() => setConfirmCancel(true)}
                type="button"
              >
                Batalkan
              </button>
            </div>
          </article>
          </>
        )}
      </section>

      <section className="customer-section">
        <h2>Booking Tersimpan</h2>
        <div className="customer-empty-state">
          <span className="empty-state-icon" aria-hidden="true">▣</span>
          <h3>Belum ada booking tersimpan</h3>
          <p>
            Booking aktif atau yang dibatalkan akan ditampilkan di bagian ini
            setelah tersedia penyimpanan backend. Draft di atas bukan booking.
          </p>
        </div>
      </section>

      {confirmCancel && (
        <ConfirmDialog
          title="Konfirmasi Pembatalan"
          description="Apakah Anda yakin ingin membatalkan booking draft ini?"
          detail={`Pilihan layanan dan jadwal sementara${bookingDraft ? ` untuk draft ${bookingDraft.reference}` : ""} akan dihapus. Belum ada booking yang dikirim.`}
          confirmLabel="Ya, Batalkan"
          onClose={() => setConfirmCancel(false)}
          onConfirm={() => {
            if (clearBookingDraft()) {
              showToast(
                "Draft Booking Dibatalkan",
                "Draft booking berhasil dibatalkan.",
                "success",
              );
              return true;
            }
            showToast(
              "Pembatalan Gagal",
              storageError ?? "Draft tidak dapat dihapus dari penyimpanan browser.",
              "error",
            );
            return false;
          }}
        />
      )}
    </div>
  );
}
