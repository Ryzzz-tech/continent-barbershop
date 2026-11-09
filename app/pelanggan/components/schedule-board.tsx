"use client";

import { useCallback, useEffect, useState } from "react";

type Barber = { id: string; name: string };
type Slot = { barberId: string; date: string; time: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isScheduleOptions(value: unknown): value is { barbers: Barber[]; slots: Slot[] } {
  return isRecord(value) &&
    Array.isArray(value.barbers) &&
    Array.isArray(value.slots) &&
    value.barbers.every((item) => isRecord(item) && typeof item.id === "string" && typeof item.name === "string") &&
    value.slots.every((item) =>
      isRecord(item) &&
      typeof item.barberId === "string" &&
      typeof item.date === "string" &&
      typeof item.time === "string",
    );
}

export default function ScheduleBoard() {
  const [date, setDate] = useState("");
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadSchedules = useCallback(async () => {
    if (!date) return;
    try {
      const response = await fetch(`/api/jadwal/kapster?date=${encodeURIComponent(date)}`, { cache: "no-store" });
      const result: unknown = await response.json();
      if (!response.ok || !isScheduleOptions(result)) {
        throw new Error(
          isRecord(result) && typeof result.message === "string"
            ? result.message
            : "Jadwal kapster tidak dapat dimuat.",
        );
      }
      setBarbers(result.barbers);
      setSlots(result.slots);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Jadwal kapster tidak dapat dimuat.");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { void Promise.resolve().then(loadSchedules); }, [loadSchedules]);

  return (
    <div className="schedule-board">
      <section className="customer-panel schedule-date-panel">
        <label htmlFor="schedule-date">Pilih Tanggal</label>
        <input
          id="schedule-date"
          onChange={(event) => {
            setDate(event.target.value);
            setSelectedBarber(null);
            setLoading(true);
            setError("");
          }}
          type="date"
          value={date}
        />
      </section>

      {!date ? (
        <div className="customer-info-banner">
          <strong>Informasi Jadwal</strong>
          <p>Pilih tanggal untuk melihat slot jadwal yang tersedia.</p>
        </div>
      ) : loading ? (
        <div className="customer-info-banner" aria-busy="true"><p>Memuat jadwal...</p></div>
      ) : error ? (
        <div className="customer-info-banner" role="alert">
          <strong>Jadwal tidak dapat dimuat</strong>
          <p>{error}</p>
          <button className="customer-outline-button" onClick={() => { setLoading(true); setError(""); void loadSchedules(); }} type="button">Coba lagi</button>
        </div>
      ) : (
        <>
          <h2 className="customer-subheading">Pilih Kapster</h2>
          {barbers.length === 0 ? (
            <div className="customer-empty-state"><h3>Belum ada kapster aktif</h3></div>
          ) : (
            <div className="barber-card-list">
              {barbers.map((barber) => {
                const barberSlots = slots.filter((slot) => slot.barberId === barber.id);
                return (
                  <article className="barber-card" key={barber.id}>
                    <div className="barber-avatar" aria-hidden="true">{barber.name.split(" ").map((part) => part[0]).join("")}</div>
                    <div className="barber-card__identity"><h3>{barber.name}</h3></div>
                    <span className={`status-pill ${barberSlots.length ? "status-pill--active" : "status-pill--draft"}`}>
                      {barberSlots.length ? "Tersedia" : "Tidak ada slot"}
                    </span>
                    <button className="customer-outline-button" onClick={() => setSelectedBarber(barber.id)} type="button">Lihat Jadwal</button>
                  </article>
                );
              })}
            </div>
          )}
          {selectedBarber && (
            <div className="customer-info-banner" role="status">
              <strong>Slot tersedia</strong>
              <p>
                {slots.filter((slot) => slot.barberId === selectedBarber).length
                  ? slots.filter((slot) => slot.barberId === selectedBarber).map((slot) => `${slot.time} WIB`).join(", ")
                  : "Tidak ada slot tersedia pada tanggal tersebut."}
              </p>
              <small>Slot ini dihitung dengan durasi layanan 30 menit. Form booking akan memeriksa ulang durasi layanan yang dipilih.</small>
            </div>
          )}
        </>
      )}
    </div>
  );
}
