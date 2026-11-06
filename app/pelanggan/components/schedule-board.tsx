"use client";

import { useState } from "react";
import { customerBarbers } from "../data";

export default function ScheduleBoard() {
  const [date, setDate] = useState("");
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null);

  return (
    <div className="schedule-board">
      <section className="customer-panel schedule-date-panel">
        <label htmlFor="schedule-date">Pilih Tanggal</label>
        <input
          id="schedule-date"
          onChange={(event) => {
            setDate(event.target.value);
            setSelectedBarber(null);
          }}
          type="date"
          value={date}
        />
      </section>

      {!date ? (
        <div className="customer-info-banner">
          <strong>Informasi Jadwal</strong>
          <p>Pilih tanggal terlebih dahulu untuk menampilkan kapster dan jadwal.</p>
        </div>
      ) : (
        <>
          <h2 className="customer-subheading">Pilih Kapster</h2>
          <div className="barber-card-list">
            {customerBarbers.map((barber) => (
              <article className="barber-card" key={barber.id}>
                <div className="barber-avatar" aria-hidden="true">
                  {barber.name.split(" ").map((part) => part[0]).join("")}
                </div>
                <div className="barber-card__identity">
                  <h3>{barber.name}</h3>
                  <p>ID Kapster: {barber.id}</p>
                </div>
                <span className="status-pill status-pill--active">Aktif</span>
                <button
                  className="customer-outline-button"
                  onClick={() => setSelectedBarber(barber.id)}
                  type="button"
                >
                  Lihat Jadwal
                </button>
              </article>
            ))}
          </div>
          {selectedBarber && (
            <div className="customer-info-banner" role="status">
              <strong>Informasi jadwal belum tersedia</strong>
              <p>
                Data ketersediaan kapster untuk {date} masih berupa prototipe.
                Tidak ada slot waktu yang ditampilkan.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
