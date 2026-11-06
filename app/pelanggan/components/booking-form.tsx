"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  customerBarbers,
  formatRupiah,
  formatTanggal,
  isBookingDatePast,
  isValidDateValue,
  isValidTimeValue,
} from "../data";
import { customerServices as serviceCatalog } from "../../../lib/data/services";
import { useCustomerPrototype } from "./customer-context";
import type { BookingDraftFields } from "./booking-draft-store";

type BookingField = keyof BookingDraftFields;
type BookingErrors = Partial<Record<BookingField, string>>;

function getFieldError(
  field: BookingField,
  value: string,
): string | undefined {
  switch (field) {
    case "serviceId":
      return serviceCatalog.some((service) => service.id === value)
        ? undefined
        : "Pilih layanan.";
    case "barberId":
      return customerBarbers.some((barber) => barber.id === value)
        ? undefined
        : "Pilih kapster.";
    case "date":
      if (!value) return "Pilih tanggal booking.";
      if (!isValidDateValue(value)) return "Masukkan tanggal yang valid.";
      if (isBookingDatePast(value))
        return "Pilih tanggal hari ini atau setelahnya.";
      return undefined;
    case "time":
      if (!value) return "Pilih waktu booking.";
      return isValidTimeValue(value)
        ? undefined
        : "Masukkan waktu yang valid.";
  }
}

export default function BookingForm({
  initialServiceId,
}: {
  initialServiceId: string;
}) {
  const router = useRouter();
  const { bookingDraft, setBookingDraft, storageError } =
    useCustomerPrototype();
  const [serviceOverride, setServiceOverride] = useState<string | null>(null);
  const [errors, setErrors] = useState<BookingErrors>({});

  const queryServiceIsValid = serviceCatalog.some(
    (service) => service.id === initialServiceId,
  );
  const serviceId =
    serviceOverride ??
    (queryServiceIsValid
      ? initialServiceId
      : bookingDraft?.serviceId ?? "");
  const barberId = bookingDraft?.barberId ?? "";
  const date = bookingDraft?.date ?? "";
  const time = bookingDraft?.time ?? "";
  const selectedService = serviceCatalog.find(
    (service) => service.id === serviceId,
  );
  const selectedBarber = customerBarbers.find(
    (barber) => barber.id === barberId,
  );
  const now = new Date();
  const minBookingDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  function updateField(field: BookingField, value: string) {
    const updated: BookingDraftFields = {
      serviceId,
      barberId,
      date,
      time,
      [field]: value,
    };

    if (field === "serviceId") setServiceOverride(value);
    setBookingDraft(updated);

    setErrors((current) => {
      const next = { ...current };
      const fieldValue = updated[field];
      const message = getFieldError(field, fieldValue);
      if (message) next[field] = message;
      else delete next[field];
      return next;
    });
  }

  function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values: BookingDraftFields = { serviceId, barberId, date, time };
    const nextErrors: BookingErrors = {};

    for (const field of Object.keys(values) as BookingField[]) {
      const message = getFieldError(field, values[field]);
      if (message) nextErrors[field] = message;
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setBookingDraft(values);
    router.push("/pelanggan/pembayaran");
  }

  return (
    <div className="customer-page">
      <Link className="customer-back-link" href="/pelanggan/booking">
        <span aria-hidden="true">←</span> Kembali ke Booking Saya
      </Link>
      <header className="customer-page-heading">
        <h1>Form Booking</h1>
        <p>Lengkapi detail pemesanan layanan Anda.</p>
      </header>

      {storageError && (
        <p className="customer-form-error" role="status">
          {storageError}
        </p>
      )}

      <form className="booking-form-layout" onSubmit={submitBooking} noValidate>
        <div className="booking-form-fields">
          <section className="customer-panel">
              <h2><span>1</span> Pilih Layanan</h2>
            <label htmlFor="booking-service">Layanan</label>
            <select
              aria-describedby={errors.serviceId ? "booking-service-error" : undefined}
              aria-invalid={Boolean(errors.serviceId)}
              id="booking-service"
              onChange={(event) => updateField("serviceId", event.target.value)}
              required
              value={serviceId}
            >
              <option value="">Pilih layanan</option>
              {serviceCatalog.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
            {errors.serviceId && (
              <p className="customer-field-error" id="booking-service-error" role="alert">
                {errors.serviceId}
              </p>
            )}
            <p className="booking-service-price">
              Harga layanan:{" "}
              <strong>
                {selectedService ? formatRupiah(selectedService.price) : "—"}
              </strong>
            </p>
          </section>

          <section className="customer-panel">
              <h2><span>2</span> Pilih Kapster</h2>
            <label htmlFor="booking-barber">Kapster</label>
            <select
              aria-describedby={errors.barberId ? "booking-barber-error" : undefined}
              aria-invalid={Boolean(errors.barberId)}
              id="booking-barber"
              onChange={(event) => updateField("barberId", event.target.value)}
              required
              value={barberId}
            >
              <option value="">Pilih kapster</option>
              {customerBarbers.map((barber) => (
                <option key={barber.id} value={barber.id}>
                  {barber.name} — {barber.id}
                </option>
              ))}
            </select>
            {errors.barberId && (
              <p className="customer-field-error" id="booking-barber-error" role="alert">
                {errors.barberId}
              </p>
            )}
            <p className="customer-field-hint">
              Ketersediaan kapster belum terhubung ke jadwal backend.
            </p>
          </section>

          <section className="customer-panel">
              <h2><span>3</span> Pilih Jadwal</h2>
            <div className="booking-date-time-grid">
              <div className="customer-field">
                <label htmlFor="booking-date">Tanggal</label>
                <input
                  aria-describedby={errors.date ? "booking-date-error" : undefined}
                  aria-invalid={Boolean(errors.date)}
                  id="booking-date"
                  min={minBookingDate}
                  onChange={(event) => updateField("date", event.target.value)}
                  required
                  type="date"
                  value={date}
                />
                {errors.date && (
                  <p className="customer-field-error" id="booking-date-error" role="alert">
                    {errors.date}
                  </p>
                )}
              </div>
              <div className="customer-field">
                <label htmlFor="booking-time">Waktu</label>
                <input
                  aria-describedby={errors.time ? "booking-time-error" : undefined}
                  aria-invalid={Boolean(errors.time)}
                  id="booking-time"
                  onChange={(event) => updateField("time", event.target.value)}
                  required
                  step={60}
                  type="time"
                  value={time}
                />
                {errors.time && (
                  <p className="customer-field-error" id="booking-time-error" role="alert">
                    {errors.time}
                  </p>
                )}
              </div>
            </div>
            <p className="customer-field-hint">
              Waktu yang dipilih belum diverifikasi sebagai slot tersedia.
            </p>
          </section>
        </div>

        <aside className="booking-summary-panel">
          <h2>Ringkasan Booking</h2>
          <dl className="customer-detail-list">
            <div>
              <dt>Layanan</dt>
              <dd>{selectedService?.name ?? "Belum dipilih"}</dd>
            </div>
            <div>
              <dt>Kapster</dt>
              <dd>{selectedBarber?.name ?? "Belum dipilih"}</dd>
            </div>
            <div>
              <dt>Tanggal</dt>
              <dd>{date ? formatTanggal(date) : "Belum dipilih"}</dd>
            </div>
            <div>
              <dt>Waktu</dt>
              <dd>{isValidTimeValue(time) ? time : "Belum dipilih"}</dd>
            </div>
            <div className="booking-summary-total">
              <dt>Total biaya</dt>
              <dd>
                {selectedService ? formatRupiah(selectedService.price) : "—"}
              </dd>
            </div>
          </dl>
          <button className="customer-primary-button" type="submit">
            Lanjut ke Pembayaran
          </button>
          <p className="customer-prototype-note">
            Draft disimpan sementara di sesi browser dan bukan booking aktif.
          </p>
        </aside>
      </form>
    </div>
  );
}
