"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { customerServices } from "../../../lib/data/services";
import {
  customerBarbers,
  formatRupiah,
  formatRupiahInput,
  getTodayDateValue,
  isBookingDatePast,
  isValidDateValue,
  isValidTimeValue,
  rupiahInputValue,
} from "../utils";
import { useCashierPrototype } from "../cashier-context";
import { CashierPageHeading, CashierPrototypeNote } from "../cashier-ui";

type TransactionValues = {
  customerName: string;
  serviceId: string;
  date: string;
  time: string;
  barberId: string;
  paidAmount: string;
};

type TransactionField = keyof TransactionValues;

export default function CashierTransactionForm() {
  const router = useRouter();
  const { customers, bookings, setTransactionDraft } = useCashierPrototype();
  const [values, setValues] = useState<TransactionValues>({
    customerName: "",
    serviceId: "",
    date: "",
    time: "",
    barberId: "",
    paidAmount: "",
  });
  const [errors, setErrors] = useState<Partial<Record<TransactionField, string>>>({});
  const [formError, setFormError] = useState("");
  const service = customerServices.find((item) => item.id === values.serviceId);
  const knownNames = Array.from(
    new Set([
      ...customers.map((customer) => customer.name),
      ...bookings.map((booking) => booking.customerName),
    ]),
  );

  function updateField(field: TransactionField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Partial<Record<TransactionField, string>> = {};
    if (!values.customerName.trim()) {
      nextErrors.customerName = "Masukkan nama pelanggan.";
    }
    if (!service) {
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
    const paidAmount = rupiahInputValue(values.paidAmount);
    if (!Number.isSafeInteger(paidAmount) || paidAmount <= 0) {
      nextErrors.paidAmount = "Masukkan nominal pembayaran Rupiah yang valid.";
    } else if (service && paidAmount < service.price) {
      nextErrors.paidAmount = "Nominal pembayaran tidak boleh kurang dari total tagihan.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (!service) {
      setFormError("Layanan tidak ditemukan pada katalog.");
      return;
    }

    const transaction = {
      id: `transaksi-${crypto.randomUUID()}`,
      customerName: values.customerName.trim(),
      serviceId: service.id,
      serviceName: service.name,
      date: values.date,
      time: values.time,
      barberId: values.barberId,
      total: service.price,
      paidAmount,
      isSample: false,
      isToday: values.date === getTodayDateValue(),
    };
    if (!setTransactionDraft(transaction)) {
      setFormError("Transaksi prototipe ini sudah tercatat.");
      return;
    }
    router.push("/kasir/transaksi/detail");
  }

  return (
    <div className="cashier-page">
      <CashierPageHeading
        title="Catat Transaksi"
        description="Masukkan detail layanan dan nominal pembayaran yang diterima."
      />
      <CashierPrototypeNote>
        Ini hanya simulasi pencatatan transaksi lokal. Tidak ada pembayaran
        eksternal atau penyimpanan database.
      </CashierPrototypeNote>
      <form className="cashier-form-panel" onSubmit={submit} noValidate>
        <div className="cashier-form-grid">
          <div className="cashier-field cashier-field--full">
            <label htmlFor="transaction-customer">Nama Pelanggan</label>
            <input
              aria-invalid={Boolean(errors.customerName)}
              aria-describedby={errors.customerName ? "transaction-customer-error" : undefined}
              autoComplete="off"
              id="transaction-customer"
              list="cashier-customer-names"
              onChange={(event) => updateField("customerName", event.target.value)}
              placeholder="Pilih atau masukkan nama pelanggan"
              value={values.customerName}
            />
            <datalist id="cashier-customer-names">
              {knownNames.map((name) => <option key={name} value={name} />)}
            </datalist>
            {errors.customerName && (
              <span className="cashier-field-error" id="transaction-customer-error">
                {errors.customerName}
              </span>
            )}
          </div>

          <div className="cashier-field">
            <label htmlFor="transaction-service">Layanan</label>
            <select
              aria-invalid={Boolean(errors.serviceId)}
              aria-describedby={errors.serviceId ? "transaction-service-error" : undefined}
              id="transaction-service"
              onChange={(event) => updateField("serviceId", event.target.value)}
              value={values.serviceId}
            >
              <option value="">Pilih layanan</option>
              {customerServices.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — {formatRupiah(item.price)}
                </option>
              ))}
            </select>
            {errors.serviceId && (
              <span className="cashier-field-error" id="transaction-service-error">
                {errors.serviceId}
              </span>
            )}
          </div>

          <div className="cashier-field">
            <label htmlFor="transaction-barber">Kapster</label>
            <select
              aria-invalid={Boolean(errors.barberId)}
              aria-describedby={errors.barberId ? "transaction-barber-error" : undefined}
              id="transaction-barber"
              onChange={(event) => updateField("barberId", event.target.value)}
              value={values.barberId}
            >
              <option value="">Pilih kapster</option>
              {customerBarbers.map((barber) => (
                <option key={barber.id} value={barber.id}>{barber.name}</option>
              ))}
            </select>
            {errors.barberId && (
              <span className="cashier-field-error" id="transaction-barber-error">
                {errors.barberId}
              </span>
            )}
          </div>

          <div className="cashier-field">
            <label htmlFor="transaction-date">Tanggal Pelayanan</label>
            <input
              aria-invalid={Boolean(errors.date)}
              aria-describedby={errors.date ? "transaction-date-error" : undefined}
              id="transaction-date"
              onChange={(event) => updateField("date", event.target.value)}
              type="date"
              value={values.date}
            />
            {errors.date && (
              <span className="cashier-field-error" id="transaction-date-error">
                {errors.date}
              </span>
            )}
          </div>

          <div className="cashier-field">
            <label htmlFor="transaction-time">Waktu Pelayanan</label>
            <input
              aria-invalid={Boolean(errors.time)}
              aria-describedby={errors.time ? "transaction-time-error" : undefined}
              id="transaction-time"
              onChange={(event) => updateField("time", event.target.value)}
              type="time"
              value={values.time}
            />
            {errors.time && (
              <span className="cashier-field-error" id="transaction-time-error">
                {errors.time}
              </span>
            )}
          </div>

          <div className="cashier-field cashier-field--full">
            <label htmlFor="transaction-amount">Nominal Pembayaran</label>
            <div className="cashier-currency-input">
              <span aria-hidden="true">Rp</span>
              <input
                aria-invalid={Boolean(errors.paidAmount)}
                aria-describedby={errors.paidAmount ? "transaction-amount-error" : "transaction-amount-hint"}
                id="transaction-amount"
                inputMode="numeric"
                onChange={(event) => updateField("paidAmount", formatRupiahInput(event.target.value))}
                placeholder="Masukkan nominal pembayaran"
                type="text"
                value={values.paidAmount}
              />
            </div>
            {service && (
              <span className="cashier-field-hint" id="transaction-amount-hint">
                Total tagihan: {formatRupiah(service.price)}
              </span>
            )}
            {errors.paidAmount && (
              <span className="cashier-field-error" id="transaction-amount-error">
                {errors.paidAmount}
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
            Proses Pembayaran
          </button>
        </div>
      </form>
    </div>
  );
}
