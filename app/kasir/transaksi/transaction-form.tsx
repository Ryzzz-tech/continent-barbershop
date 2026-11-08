"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAppFeedback } from "../../components/app-feedback";
import {
  formatRupiah,
  getTodayDateValue,
} from "../utils";
import { CashierPageHeading, CashierPrototypeNote } from "../cashier-ui";

type Option = {
  id: string;
  name: string;
};

type Service = Option & {
  price: number;
  duration: number;
};

type Slot = {
  barberId: string;
  date: string;
  time: string;
};

type PaymentMethod = "tunai" | "transfer" | "qris";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isOptionsResult(
  value: unknown,
): value is {
  customers: Option[];
  services: Service[];
  barbers: Option[];
} {
  return (
    isRecord(value) &&
    Array.isArray(value.customers) &&
    Array.isArray(value.services) &&
    Array.isArray(value.barbers) &&
    value.customers.every(
      (item) =>
        isRecord(item) &&
        typeof item.id === "string" &&
        typeof item.name === "string",
    ) &&
    value.services.every(
      (item) =>
        isRecord(item) &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        typeof item.price === "number" &&
        typeof item.duration === "number",
    ) &&
    value.barbers.every(
      (item) =>
        isRecord(item) &&
        typeof item.id === "string" &&
        typeof item.name === "string",
    )
  );
}

function isSlotsResult(value: unknown): value is { slots: Slot[] } {
  return (
    isRecord(value) &&
    Array.isArray(value.slots) &&
    value.slots.every(
      (item) =>
        isRecord(item) &&
        typeof item.barberId === "string" &&
        typeof item.date === "string" &&
        typeof item.time === "string",
    )
  );
}

function getErrorMessage(value: unknown, fallback: string) {
  return isRecord(value) && typeof value.message === "string"
    ? value.message
    : fallback;
}

export default function CashierTransactionForm() {
  const router = useRouter();
  const { showToast } = useAppFeedback();

  const [customers, setCustomers] = useState<Option[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Option[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [barberId, setBarberId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("tunai");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const service = services.find((item) => item.id === serviceId);

  const loadOptions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/booking/options", {
        cache: "no-store",
      });
      const result: unknown = await response.json();

      if (!response.ok || !isOptionsResult(result)) {
        throw new Error(
          getErrorMessage(result, "Data transaksi tidak dapat dimuat."),
        );
      }

      setCustomers(result.customers);
      setServices(result.services);
      setBarbers(result.barbers);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Data transaksi tidak dapat dimuat.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadOptions);
  }, [loadOptions]);

  useEffect(() => {
    if (!date || !serviceId || !barberId) {
      setSlots([]);
      setTime("");
      setLoadingSlots(false);
      return;
    }

    const controller = new AbortController();

    async function loadSlots() {
      setLoadingSlots(true);
      setSlots([]);
      setTime("");
      setFormError("");

      try {
        const query = new URLSearchParams({
          date,
          serviceId,
          barberId,
        });

        const response = await fetch(
          `/api/jadwal/kapster?${query.toString()}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const result: unknown = await response.json();

        if (!response.ok || !isSlotsResult(result)) {
          throw new Error(
            getErrorMessage(result, "Slot jadwal tidak dapat dimuat."),
          );
        }

        setSlots(result.slots);
      } catch (loadError) {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        ) {
          return;
        }

        setFormError(
          loadError instanceof Error
            ? loadError.message
            : "Slot jadwal tidak dapat dimuat.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoadingSlots(false);
        }
      }
    }

    void loadSlots();

    return () => controller.abort();
  }, [barberId, date, serviceId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!customers.some((item) => item.id === customerId)) {
      setFormError("Pilih pelanggan dari data yang tersedia.");
      return;
    }

    if (
      !service ||
      !barbers.some((item) => item.id === barberId)
    ) {
      setFormError("Pilih layanan dan kapster yang tersedia.");
      return;
    }

    if (!date || date < getTodayDateValue()) {
      setFormError("Pilih tanggal pelayanan yang valid.");
      return;
    }

    if (loadingSlots || !slots.some((slot) => slot.time === time)) {
      setFormError("Pilih slot jadwal yang masih tersedia.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/kasir/transaksi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId,
          serviceId,
          barberId,
          date,
          time,
          paymentMethod,
        }),
      });

      const result: unknown = await response.json();

      if (
        !response.ok ||
        !isRecord(result) ||
        result.success !== true ||
        !isRecord(result.transaction) ||
        typeof result.transaction.id !== "string"
      ) {
        throw new Error(
          getErrorMessage(result, "Transaksi tidak dapat disimpan."),
        );
      }

      const transactionId = result.transaction.id;

      showToast(
        "Transaksi Berhasil Disimpan",
        `Transaksi ${transactionId} dan booking terkait sudah tersimpan di PostgreSQL.`,
        "success",
      );

      router.push(
        `/kasir/transaksi/detail?id=${encodeURIComponent(transactionId)}`,
      );
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Transaksi tidak dapat disimpan.";

      setFormError(message);
      showToast("Pencatatan Transaksi Gagal", message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="cashier-page">
      <CashierPageHeading
        title="Catat Transaksi"
        description="Masukkan informasi pelanggan, layanan, jadwal, dan pembayaran."
      />

      <CashierPrototypeNote>
        Booking dan transaksi akan disimpan bersama ke PostgreSQL setelah
        jadwal dan data pembayaran berhasil diverifikasi.
      </CashierPrototypeNote>

      {error && (
        <div className="cashier-error-banner" role="alert">
          {error}
          <button
            className="cashier-text-link"
            onClick={() => void loadOptions()}
            type="button"
          >
            Coba lagi
          </button>
        </div>
      )}

      <form className="cashier-form-panel" onSubmit={submit} noValidate>
        <div className="cashier-form-grid">
          <div className="cashier-field cashier-field--full">
            <label htmlFor="transaction-customer">Pelanggan</label>
            <select
              id="transaction-customer"
              onChange={(event) => setCustomerId(event.target.value)}
              value={customerId}
              disabled={loading}
            >
              <option value="">
                {loading ? "Memuat pelanggan..." : "Pilih pelanggan"}
              </option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          <div className="cashier-field">
            <label htmlFor="transaction-service">Layanan</label>
            <select
              id="transaction-service"
              onChange={(event) => setServiceId(event.target.value)}
              value={serviceId}
              disabled={loading}
            >
              <option value="">Pilih layanan</option>
              {services.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — {formatRupiah(item.price)}
                </option>
              ))}
            </select>
          </div>

          <div className="cashier-field">
            <label htmlFor="transaction-barber">Kapster</label>
            <select
              id="transaction-barber"
              onChange={(event) => setBarberId(event.target.value)}
              value={barberId}
              disabled={loading}
            >
              <option value="">Pilih kapster</option>
              {barbers.map((barber) => (
                <option key={barber.id} value={barber.id}>
                  {barber.name}
                </option>
              ))}
            </select>
          </div>

          <div className="cashier-field">
            <label htmlFor="transaction-date">Tanggal Pelayanan</label>
            <input
              id="transaction-date"
              min={getTodayDateValue()}
              onChange={(event) => {
                setDate(event.target.value);
                setTime("");
                setSlots([]);
              }}
              type="date"
              value={date}
            />
          </div>

          <div className="cashier-field">
            <label htmlFor="transaction-time">Waktu Pelayanan</label>
            <select
              disabled={!date || !serviceId || !barberId || loadingSlots}
              id="transaction-time"
              onChange={(event) => setTime(event.target.value)}
              value={time}
            >
              <option value="">
                {loadingSlots
                  ? "Memeriksa slot..."
                  : "Pilih waktu tersedia"}
              </option>
              {slots.map((slot) => (
                <option key={slot.time} value={slot.time}>
                  {slot.time} WIB
                </option>
              ))}
            </select>
          </div>

          <div className="cashier-field">
            <label htmlFor="transaction-payment-method">
              Metode Pembayaran
            </label>
            <select
              id="transaction-payment-method"
              onChange={(event) =>
                setPaymentMethod(event.target.value as PaymentMethod)
              }
              value={paymentMethod}
            >
              <option value="tunai">Tunai</option>
              <option value="transfer">Transfer Bank</option>
              <option value="qris">QRIS</option>
            </select>
          </div>

          <div className="cashier-field">
            <label>Total Tagihan</label>
            <div className="cashier-field-hint">
              {service ? formatRupiah(service.price) : "Pilih layanan terlebih dahulu"}
            </div>
          </div>
        </div>

        {formError && (
          <p className="cashier-error-banner" role="alert">
            {formError}
          </p>
        )}

        <div className="cashier-form-actions">
          <Link
            className="cashier-button cashier-button--secondary"
            href="/kasir"
          >
            Batal
          </Link>
          <button
            className="cashier-button cashier-button--primary"
            disabled={loading || saving || Boolean(error)}
            type="submit"
          >
            {saving ? "Menyimpan..." : "Proses Pembayaran"}
          </button>
        </div>
      </form>
    </div>
  );
}
