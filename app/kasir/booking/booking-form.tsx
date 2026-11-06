"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { customerServices } from "../../../lib/data/services";
import {
  customerBarbers,
  formatRupiah,
  isBookingDatePast,
  isValidDateValue,
  isValidTimeValue,
} from "../utils";
import { useCashierPrototype } from "../cashier-context";
import { CashierPageHeading, CashierPrototypeNote } from "../cashier-ui";

type BookingFormValues = {
  customerName: string;
  serviceId: string;
  date: string;
  time: string;
  barberId: string;
};

type BookingField = keyof BookingFormValues;

export default function CashierBookingForm() {
  const router = useRouter();
  const { customers, bookings, bookingDraft, setBookingDraft } =
    useCashierPrototype();
  const [values, setValues] = useState<BookingFormValues>({
    customerName: bookingDraft?.customerName ?? "",
    serviceId: bookingDraft?.serviceId ?? "",
    date: bookingDraft?.date ?? "",
    time: bookingDraft?.time ?? "",
    barberId: bookingDraft?.barberId ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<BookingField, string>>>({});
  const [formError, setFormError] = useState("");
  const knownNames = Array.from(
    new Set([
      ...customers.map((customer) => customer.name),
      ...bookings.map((booking) => booking.customerName),
    ]),
  );

  function updateField(field: BookingField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Partial<Record<BookingField, string>> = {};
    if (!values.customerName.trim()) {
      nextErrors.customerName = "Masukkan nama pelanggan.";
    }
    if (!customerServices.some((service) => service.id === values.serviceId)) {
      nextErrors.serviceId = "Pilih layanan dari katalog.";
    }
    if (!isValidDateValue(values.date)) {
      nextErrors.date = "Pilih tanggal pelayanan yang valid.";
    } else if (isBookingDatePast(values.date)) {
      nextErrors.date = "Tanggal pelayanan tidak boleh sudah berlalu.";
    }
    if (!isValidTimeValue(values.time)) {
      nextErrors.time = "Pilih waktu pelayanan yang valid.";
    }
    if (!customerBarbers.some((barber) => barber.id === values.barberId)) {
      nextErrors.barberId = "Pilih kapster.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const service = customerServices.find(
      (item) => item.id === values.serviceId,
    );
    if (!service) {
      setFormError("Layanan tidak ditemukan pada katalog.");
      return;
    }

    setBookingDraft({
      id: `booking-${crypto.randomUUID()}`,
      customerName: values.customerName.trim(),
      serviceId: service.id,
      serviceName: service.name,
      date: values.date,
      time: values.time,
      barberId: values.barberId,
      isSample: false,
      saved: false,
    });
    router.push("/kasir/booking/detail");
  }

  return (
    <div className="cashier-page">
      <CashierPageHeading
        title="Catat Booking"
        description="Masukkan informasi pelanggan dan jadwal pelayanan."
      />
      <CashierPrototypeNote>
        Data booking hanya disimpan sementara pada state prototipe. Jadwal
        kapster belum terhubung ke pemeriksaan ketersediaan.
      </CashierPrototypeNote>
      <form className="cashier-form-panel" onSubmit={submit} noValidate>
        <div className="cashier-form-grid">
          <div className="cashier-field cashier-field--full">
            <label htmlFor="booking-customer">Nama Pelanggan</label>
            <input
              aria-invalid={Boolean(errors.customerName)}
              aria-describedby={errors.customerName ? "booking-customer-error" : undefined}
              autoComplete="off"
              id="booking-customer"
              list="cashier-customer-names"
              onChange={(event) => updateField("customerName", event.target.value)}
              placeholder="Pilih atau masukkan nama pelanggan"
              value={values.customerName}
            />
            <datalist id="cashier-customer-names">
              {knownNames.map((name) => <option key={name} value={name} />)}
            </datalist>
            {errors.customerName && (
              <span className="cashier-field-error" id="booking-customer-error">
                {errors.customerName}
              </span>
            )}
          </div>

          <div className="cashier-field">
            <label htmlFor="booking-service">Layanan</label>
            <select
              aria-invalid={Boolean(errors.serviceId)}
              aria-describedby={errors.serviceId ? "booking-service-error" : undefined}
              id="booking-service"
              onChange={(event) => updateField("serviceId", event.target.value)}
              value={values.serviceId}
            >
              <option value="">Pilih layanan</option>
              {customerServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} — {formatRupiah(service.price)}
                </option>
              ))}
            </select>
            {errors.serviceId && (
              <span className="cashier-field-error" id="booking-service-error">
                {errors.serviceId}
              </span>
            )}
          </div>

          <div className="cashier-field">
            <label htmlFor="booking-barber">Kapster</label>
            <select
              aria-invalid={Boolean(errors.barberId)}
              aria-describedby={errors.barberId ? "booking-barber-error" : undefined}
              id="booking-barber"
              onChange={(event) => updateField("barberId", event.target.value)}
              value={values.barberId}
            >
              <option value="">Pilih kapster</option>
              {customerBarbers.map((barber) => (
                <option key={barber.id} value={barber.id}>
                  {barber.name}
                </option>
              ))}
            </select>
            {errors.barberId && (
              <span className="cashier-field-error" id="booking-barber-error">
                {errors.barberId}
              </span>
            )}
          </div>

          <div className="cashier-field">
            <label htmlFor="booking-date">Tanggal Pelayanan</label>
            <input
              aria-invalid={Boolean(errors.date)}
              aria-describedby={errors.date ? "booking-date-error" : undefined}
              id="booking-date"
              onChange={(event) => updateField("date", event.target.value)}
              type="date"
              value={values.date}
            />
            {errors.date && (
              <span className="cashier-field-error" id="booking-date-error">
                {errors.date}
              </span>
            )}
          </div>

          <div className="cashier-field">
            <label htmlFor="booking-time">Waktu Pelayanan</label>
            <input
              aria-invalid={Boolean(errors.time)}
              aria-describedby={errors.time ? "booking-time-error" : undefined}
              id="booking-time"
              onChange={(event) => updateField("time", event.target.value)}
              type="time"
              value={values.time}
            />
            {errors.time && (
              <span className="cashier-field-error" id="booking-time-error">
                {errors.time}
              </span>
            )}
          </div>
        </div>

        {formError && <p className="cashier-error-banner" role="alert">{formError}</p>}
        <div className="cashier-form-actions">
          <Link className="cashier-button cashier-button--secondary" href="/kasir">
            Batal
          </Link>
          <button className="cashier-button cashier-button--primary" type="submit">
            Cek Jadwal Kapster
          </button>
        </div>
      </form>
    </div>
  );
}
