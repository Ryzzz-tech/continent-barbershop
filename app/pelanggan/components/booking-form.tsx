"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAppFeedback } from "../../components/app-feedback";
import { customerServices, formatRupiah, formatTanggal, isValidDateValue } from "../data";

type ServiceOption = { id: string; name: string; price: number; duration: number };
type BarberOption = { id: string; name: string };
type SlotOption = { barberId: string; date: string; time: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isServiceOptions(value: unknown): value is {
  services: ServiceOption[];
  barbers: BarberOption[];
} {
  return isRecord(value) &&
    Array.isArray(value.services) &&
    Array.isArray(value.barbers) &&
    value.services.every((item) =>
      isRecord(item) &&
      typeof item.id === "string" &&
      typeof item.name === "string" &&
      typeof item.price === "number" &&
      typeof item.duration === "number",
    ) &&
    value.barbers.every((item) =>
      isRecord(item) && typeof item.id === "string" && typeof item.name === "string",
    );
}

function isSlots(value: unknown): value is { slots: SlotOption[] } {
  return isRecord(value) &&
    Array.isArray(value.slots) &&
    value.slots.every((item) =>
      isRecord(item) &&
      typeof item.barberId === "string" &&
      typeof item.date === "string" &&
      typeof item.time === "string",
    );
}

export default function BookingForm({
  initialServiceId,
  bookingId,
}: {
  initialServiceId: string;
  bookingId?: string;
}) {
  const router = useRouter();
  const { showToast } = useAppFeedback();
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [barbers, setBarbers] = useState<BarberOption[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [barberId, setBarberId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsRefresh, setOptionsRefresh] = useState(0);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [slotError, setSlotError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedService = services.find((service) => service.id === serviceId);
  const selectedBarber = barbers.find((barber) => barber.id === barberId);
  const minDate = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }, []);

  useEffect(() => {
    let active = true;
    async function loadOptions() {
      try {
        const response = await fetch("/api/booking/options", { cache: "no-store" });
        const result: unknown = await response.json();
        if (!response.ok || !isServiceOptions(result)) {
          throw new Error(
            isRecord(result) && typeof result.message === "string"
              ? result.message
              : "Katalog layanan dan kapster tidak dapat dimuat.",
          );
        }
        if (!active) return;
        setServices(result.services);
        setBarbers(result.barbers);
        const alias = customerServices.find((service) => service.id === initialServiceId);
        const selected = result.services.find((service) =>
          service.id === initialServiceId ||
          service.name.toLocaleLowerCase("id-ID") === alias?.name.toLocaleLowerCase("id-ID"),
        );
        setServiceId(selected?.id ?? "");
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : "Katalog tidak dapat dimuat.");
      } finally {
        if (active) setLoadingOptions(false);
      }
    }
    void loadOptions();
    return () => { active = false; };
  }, [initialServiceId, optionsRefresh]);

  useEffect(() => {
    const id = bookingId;
    if (typeof id !== "string") return;
    const bookingUrl = `/api/booking/${encodeURIComponent(id)}`;
    let active = true;
    async function loadBooking() {
      try {
        const response = await fetch(bookingUrl, { cache: "no-store" });
        const result: unknown = await response.json();
        if (!response.ok || !isRecord(result) || !isRecord(result.booking)) {
          throw new Error(
            isRecord(result) && typeof result.message === "string"
              ? result.message
              : "Booking tidak dapat dimuat untuk diubah.",
          );
        }
        const record = result.booking;
        if (
          typeof record.id !== "string" ||
          typeof record.serviceId !== "string" ||
          typeof record.barberId !== "string" ||
          typeof record.date !== "string" ||
          typeof record.time !== "string" ||
          typeof record.customerNote !== "string" ||
          record.paymentStatus === "Sudah Dibayar"
        ) {
          throw new Error("Booking ini tidak dapat diubah.");
        }
        if (!active) return;
        setServiceId(record.serviceId);
        setBarberId(record.barberId);
        setDate(record.date);
        setTime(record.time);
        setNote(record.customerNote);
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : "Booking tidak dapat dimuat.");
      }
    }
    void loadBooking();
    return () => { active = false; };
  }, [bookingId]);

  useEffect(() => {
    if (!serviceId || !barberId || !date) {
      return;
    }
    const controller = new AbortController();
    async function loadSlots() {
      try {
        const params = new URLSearchParams({ date, serviceId, barberId });
        const response = await fetch(`/api/jadwal/kapster?${params}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const result: unknown = await response.json();
        if (!response.ok || !isSlots(result)) {
          throw new Error(
            isRecord(result) && typeof result.message === "string"
              ? result.message
              : "Slot jadwal tidak dapat dimuat.",
          );
        }
        setSlots(result.slots);
        setTime((current) =>
          result.slots.some((slot) => slot.time === current) ? current : "",
        );
        if (result.slots.length === 0) setSlotError("Tidak ada slot tersedia untuk pilihan tersebut.");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSlotError(error instanceof Error ? error.message : "Slot jadwal tidak dapat dimuat.");
      } finally {
        if (!controller.signal.aborted) setLoadingSlots(false);
      }
    }
    void loadSlots();
    return () => controller.abort();
  }, [barberId, date, serviceId]);

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!services.some((service) => service.id === serviceId)) nextErrors.serviceId = "Pilih layanan.";
    if (!barbers.some((barber) => barber.id === barberId)) nextErrors.barberId = "Pilih kapster.";
    if (!isValidDateValue(date) || date < minDate) nextErrors.date = "Pilih tanggal hari ini atau setelahnya.";
    if (!slots.some((slot) => slot.time === time)) nextErrors.time = "Pilih slot yang tersedia.";
    if (note.trim().length > 100) nextErrors.note = "Catatan maksimal 100 karakter.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const response = await fetch(
        bookingId ? `/api/booking/${encodeURIComponent(bookingId)}` : "/api/booking",
        {
        method: bookingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, barberId, date, time, note: note.trim() }),
        },
      );
      const result: unknown = await response.json();
      if (!response.ok || !isRecord(result) || !isRecord(result.booking) || typeof result.booking.id !== "string") {
        throw new Error(
          isRecord(result) && typeof result.message === "string"
            ? result.message
            : "Booking tidak dapat disimpan.",
        );
      }
      showToast(
        bookingId ? "Booking Berhasil Diubah" : "Booking Berhasil Dibuat",
        bookingId
          ? `Perubahan booking ${result.booking.id} telah disimpan.`
          : `Booking ${result.booking.id} telah disimpan dan menunggu konfirmasi.`,
        "success",
      );
      router.push(
        bookingId
          ? `/pelanggan/booking/${encodeURIComponent(result.booking.id)}`
          : `/pelanggan/pembayaran?booking=${encodeURIComponent(result.booking.id)}`,
      );
    } catch (error) {
      showToast(
        "Booking Gagal",
        error instanceof Error ? error.message : "Booking tidak dapat disimpan.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="customer-page">
      <Link className="customer-back-link" href="/pelanggan/booking">
        <span aria-hidden="true">&#8592;</span> Kembali ke Booking Saya
      </Link>
      <header className="customer-page-heading">
        <h1>Form Booking</h1>
        <p>Lengkapi detail pemesanan layanan Anda.</p>
      </header>

      {loadError && (
        <div className="customer-form-error" role="alert">
          <p>{loadError}</p>
          <button className="customer-outline-button" onClick={() => { setLoadingOptions(true); setLoadError(""); setOptionsRefresh((value) => value + 1); }} type="button">
            Coba lagi
          </button>
        </div>
      )}

      <form className="booking-form-layout" onSubmit={submitBooking} noValidate>
        <div className="booking-form-fields">
          <section className="customer-panel">
            <h2><span>1</span> Pilih Layanan</h2>
            <label htmlFor="booking-service">Layanan</label>
            <select
              aria-invalid={Boolean(errors.serviceId)}
              id="booking-service"
              onChange={(event) => {
                    const nextServiceId = event.target.value;
                    setServiceId(nextServiceId);
                    setSlots([]);
                    setTime("");
                    setLoadingSlots(Boolean(nextServiceId && barberId && date));
                    setSlotError("");
                    setErrors((current) => ({ ...current, serviceId: "" }));
              }}
              required
              value={serviceId}
            >
              <option value="">{loadingOptions ? "Memuat layanan..." : "Pilih layanan"}</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>{service.name}</option>
              ))}
            </select>
            {errors.serviceId && <p className="customer-field-error" role="alert">{errors.serviceId}</p>}
            <p className="booking-service-price">
              Harga layanan: <strong>{selectedService ? formatRupiah(selectedService.price) : "\u2014"}</strong>
            </p>
          </section>

          <section className="customer-panel">
            <h2><span>2</span> Pilih Kapster</h2>
            <label htmlFor="booking-barber">Kapster</label>
            <select
              aria-invalid={Boolean(errors.barberId)}
              id="booking-barber"
              onChange={(event) => {
                const nextBarberId = event.target.value;
                setBarberId(nextBarberId);
                setTime("");
                setSlots([]);
                setLoadingSlots(Boolean(serviceId && nextBarberId && date));
                setSlotError("");
                setErrors((current) => ({ ...current, barberId: "" }));
              }}
              required
              value={barberId}
            >
              <option value="">{loadingOptions ? "Memuat kapster..." : "Pilih kapster"}</option>
              {barbers.map((barber) => (
                <option key={barber.id} value={barber.id}>{barber.name}</option>
              ))}
            </select>
            {errors.barberId && <p className="customer-field-error" role="alert">{errors.barberId}</p>}
          </section>

          <section className="customer-panel">
            <h2><span>3</span> Pilih Jadwal</h2>
            <div className="booking-date-time-grid">
              <div className="customer-field">
                <label htmlFor="booking-date">Tanggal</label>
                <input
                  aria-invalid={Boolean(errors.date)}
                  id="booking-date"
                  min={minDate}
                  onChange={(event) => {
                    const nextDate = event.target.value;
                    setDate(nextDate);
                    setTime("");
                    setSlots([]);
                    setLoadingSlots(Boolean(serviceId && barberId && nextDate));
                    setSlotError("");
                    setErrors((current) => ({ ...current, date: "" }));
                  }}
                  required
                  type="date"
                  value={date}
                />
                {errors.date && <p className="customer-field-error" role="alert">{errors.date}</p>}
              </div>
              <div className="customer-field">
                <label htmlFor="booking-time">Waktu</label>
                <select
                  aria-invalid={Boolean(errors.time)}
                  disabled={!date || !barberId || !serviceId || loadingSlots}
                  id="booking-time"
                  onChange={(event) => {
                    setTime(event.target.value);
                    setErrors((current) => ({ ...current, time: "" }));
                  }}
                  required
                  value={time}
                >
                  <option value="">
                    {loadingSlots ? "Memeriksa slot..." : "Pilih waktu tersedia"}
                  </option>
                  {slots.map((slot) => <option key={slot.time} value={slot.time}>{slot.time} WIB</option>)}
                </select>
                {errors.time && <p className="customer-field-error" role="alert">{errors.time}</p>}
                {slotError && <p className="customer-field-error" role="status">{slotError}</p>}
              </div>
            </div>
          </section>
          <section className="customer-panel">
            <label htmlFor="booking-note">Catatan (opsional)</label>
            <textarea
              id="booking-note"
              maxLength={100}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              value={note}
            />
            {errors.note && <p className="customer-field-error" role="alert">{errors.note}</p>}
          </section>
        </div>

        <aside className="booking-summary-panel">
          <h2>Ringkasan Booking</h2>
          <dl className="customer-detail-list">
            <div><dt>Layanan</dt><dd>{selectedService?.name ?? "Belum dipilih"}</dd></div>
            <div><dt>Kapster</dt><dd>{selectedBarber?.name ?? "Belum dipilih"}</dd></div>
            <div><dt>Tanggal</dt><dd>{date ? formatTanggal(date) : "Belum dipilih"}</dd></div>
            <div><dt>Waktu</dt><dd>{time || "Belum dipilih"}</dd></div>
            <div className="booking-summary-total">
              <dt>Total biaya</dt><dd>{selectedService ? formatRupiah(selectedService.price) : "\u2014"}</dd>
            </div>
          </dl>
          <button className="customer-primary-button" disabled={loadingOptions || submitting} type="submit">
            {submitting ? "Menyimpan Booking..." : bookingId ? "Simpan Perubahan" : "Lanjut ke Pembayaran"}
          </button>

        </aside>
      </form>
    </div>
  );
}
