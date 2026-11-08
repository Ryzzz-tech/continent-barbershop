"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAppFeedback } from "../../components/app-feedback";
import { formatRupiah, isValidDateValue } from "../../pelanggan/data";
import { CashierPageHeading, CashierPrototypeNote } from "../cashier-ui";

type Option = { id: string; name: string };
type Service = Option & { price: number; duration: number };
type Slot = { barberId: string; date: string; time: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isOptions(value: unknown): value is { customers: Option[]; services: Service[]; barbers: Option[] } {
  return isRecord(value) &&
    Array.isArray(value.customers) &&
    Array.isArray(value.services) &&
    Array.isArray(value.barbers) &&
    value.customers.every((item) => isRecord(item) && typeof item.id === "string" && typeof item.name === "string") &&
    value.services.every((item) => isRecord(item) && typeof item.id === "string" && typeof item.name === "string" && typeof item.price === "number" && typeof item.duration === "number") &&
    value.barbers.every((item) => isRecord(item) && typeof item.id === "string" && typeof item.name === "string");
}

function isSlots(value: unknown): value is { slots: Slot[] } {
  return isRecord(value) && Array.isArray(value.slots) && value.slots.every((item) =>
    isRecord(item) && typeof item.barberId === "string" && typeof item.date === "string" && typeof item.time === "string",
  );
}

export default function CashierBookingForm() {
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
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const service = services.find((item) => item.id === serviceId);

  const loadOptions = useCallback(async () => {
    try {
      const response = await fetch("/api/booking/options", { cache: "no-store" });
      const result: unknown = await response.json();
      if (!response.ok || !isOptions(result)) {
        throw new Error(isRecord(result) && typeof result.message === "string" ? result.message : "Data booking tidak dapat dimuat.");
      }
      setCustomers(result.customers);
      setServices(result.services);
      setBarbers(result.barbers);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Data booking tidak dapat dimuat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void Promise.resolve().then(loadOptions); }, [loadOptions]);

  useEffect(() => {
    if (!date || !serviceId || !barberId) return;
    const controller = new AbortController();
    async function loadSlots() {
      try {
        const query = new URLSearchParams({ date, serviceId, barberId });
        const response = await fetch(`/api/jadwal/kapster?${query}`, { cache: "no-store", signal: controller.signal });
        const result: unknown = await response.json();
        if (!response.ok || !isSlots(result)) {
          throw new Error(isRecord(result) && typeof result.message === "string" ? result.message : "Slot jadwal tidak dapat dimuat.");
        }
        setSlots(result.slots);
        setTime((current) => result.slots.some((slot) => slot.time === current) ? current : "");
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setFormError(loadError instanceof Error ? loadError.message : "Slot jadwal tidak dapat dimuat.");
      } finally {
        if (!controller.signal.aborted) setLoadingSlots(false);
      }
    }
    void loadSlots();
    return () => controller.abort();
  }, [barberId, date, serviceId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (!customerId || !customers.some((customer) => customer.id === customerId)) {
      setFormError("Pilih pelanggan dari data yang tersedia.");
      return;
    }
    if (!service || !barbers.some((barber) => barber.id === barberId)) {
      setFormError("Pilih layanan dan kapster yang tersedia.");
      return;
    }
    if (!isValidDateValue(date) || date < new Date().toLocaleDateString("sv-SE")) {
      setFormError("Pilih tanggal pelayanan yang valid.");
      return;
    }
    if (!slots.some((slot) => slot.time === time)) {
      setFormError("Pilih slot jadwal yang tersedia.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, serviceId, barberId, date, time }),
      });
      const result: unknown = await response.json();
      if (!response.ok || !isRecord(result) || !isRecord(result.booking) || typeof result.booking.id !== "string") {
        throw new Error(isRecord(result) && typeof result.message === "string" ? result.message : "Booking tidak dapat dicatat.");
      }
      showToast("Booking Berhasil Dicatat", `Booking ${result.booking.id} tersimpan di PostgreSQL.`, "success");
      router.push(`/kasir/booking/detail?id=${encodeURIComponent(result.booking.id)}`);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Booking tidak dapat dicatat.";
      setFormError(message);
      showToast("Pencatatan Booking Gagal", message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="cashier-page">
      <CashierPageHeading title="Catat Booking" description="Masukkan informasi pelanggan dan jadwal pelayanan." />
      <CashierPrototypeNote>Booking dibuat dengan data pelanggan, layanan, dan jadwal yang diverifikasi server serta disimpan di PostgreSQL.</CashierPrototypeNote>
      {error && <div className="cashier-error-banner" role="alert">{error}<button className="cashier-text-link" onClick={() => { setLoading(true); setError(""); void loadOptions(); }} type="button">Coba lagi</button></div>}
      <form className="cashier-form-panel" onSubmit={submit} noValidate>
        <div className="cashier-form-grid">
          <div className="cashier-field cashier-field--full">
            <label htmlFor="booking-customer">Pelanggan</label>
            <select id="booking-customer" onChange={(event) => setCustomerId(event.target.value)} value={customerId}>
              <option value="">{loading ? "Memuat pelanggan..." : "Pilih pelanggan"}</option>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
          </div>
          <div className="cashier-field">
            <label htmlFor="booking-service">Layanan</label>
            <select id="booking-service" onChange={(event) => {
              const nextServiceId = event.target.value;
              setServiceId(nextServiceId);
              setSlots([]);
              setTime("");
              setLoadingSlots(Boolean(nextServiceId && barberId && date));
            }} value={serviceId}>
              <option value="">Pilih layanan</option>
              {services.map((item) => <option key={item.id} value={item.id}>{item.name} — {formatRupiah(item.price)}</option>)}
            </select>
          </div>
          <div className="cashier-field">
            <label htmlFor="booking-barber">Kapster</label>
            <select id="booking-barber" onChange={(event) => {
              const nextBarberId = event.target.value;
              setBarberId(nextBarberId);
              setSlots([]);
              setTime("");
              setLoadingSlots(Boolean(nextBarberId && serviceId && date));
            }} value={barberId}>
              <option value="">Pilih kapster</option>
              {barbers.map((barber) => <option key={barber.id} value={barber.id}>{barber.name}</option>)}
            </select>
          </div>
          <div className="cashier-field">
            <label htmlFor="booking-date">Tanggal Pelayanan</label>
            <input id="booking-date" min={new Date().toLocaleDateString("sv-SE")} onChange={(event) => {
              const nextDate = event.target.value;
              setDate(nextDate);
              setSlots([]);
              setTime("");
              setLoadingSlots(Boolean(nextDate && serviceId && barberId));
            }} type="date" value={date} />
          </div>
          <div className="cashier-field">
            <label htmlFor="booking-time">Waktu Pelayanan</label>
            <select disabled={!date || !serviceId || !barberId || loadingSlots} id="booking-time" onChange={(event) => setTime(event.target.value)} value={time}>
              <option value="">{loadingSlots ? "Memeriksa slot..." : "Pilih waktu tersedia"}</option>
              {slots.map((slot) => <option key={slot.time} value={slot.time}>{slot.time} WIB</option>)}
            </select>
          </div>
        </div>
        {formError && <p className="cashier-error-banner" role="alert">{formError}</p>}
        <div className="cashier-form-actions">
          <Link className="cashier-button cashier-button--secondary" href="/kasir">Batal</Link>
          <button className="cashier-button cashier-button--primary" disabled={loading || saving} type="submit">{saving ? "Menyimpan..." : "Simpan Booking"}</button>
        </div>
      </form>
    </div>
  );
}
