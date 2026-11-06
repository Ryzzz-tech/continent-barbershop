"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatTanggal } from "../../pelanggan/data";
import { useKapsterPrototype } from "../kapster-context";
import {
  formatDayName,
  getScheduleStatusLabel,
  KapsterPageHeading,
  KapsterPrototypeNote,
} from "../kapster-ui";

export default function KapsterScheduleList() {
  const { schedules, deleteSchedule, announce } = useKapsterPrototype();
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("");
  const filteredSchedules = useMemo(
    () =>
      schedules
        .filter((schedule) => !dateFilter || schedule.date === dateFilter)
        .filter((schedule) => statusFilter === "all" || schedule.status === statusFilter)
        .filter((schedule) => !monthFilter || schedule.date.startsWith(monthFilter))
        .sort((left, right) =>
          `${left.date}T${left.startTime}`.localeCompare(`${right.date}T${right.startTime}`),
        ),
    [dateFilter, monthFilter, schedules, statusFilter],
  );
  const availableCount = schedules.filter(
    (schedule) => schedule.status === "available",
  ).length;
  const unavailableCount = schedules.filter(
    (schedule) => schedule.status === "unavailable",
  ).length;

  function removeSchedule(id: string) {
    const schedule = schedules.find((item) => item.id === id);
    if (!schedule) return;
    if (!window.confirm(`Hapus jadwal ${formatTanggal(schedule.date)} dari prototipe?`)) {
      return;
    }
    if (deleteSchedule(id)) {
      announce("Jadwal dihapus dari state prototipe.");
    }
  }

  return (
    <div className="cashier-page kapster-page">
      <KapsterPageHeading
        title="Jadwal & Ketersediaan"
        description="Kelola jadwal kerja dan atur ketersediaan waktu pelayanan Anda."
      >
        <Link className="cashier-button kapster-button kapster-button--primary" href="/kapster/jadwal/tambah">
          <span aria-hidden="true">＋</span> Tambah Jadwal
        </Link>
      </KapsterPageHeading>
      <KapsterPrototypeNote>
        Jadwal hanya milik Kapster Rizky Pratama (K0001). Status Tersedia
        menunjukkan jam kerja, bukan jaminan slot booking kosong. Jadwal yang
        ditandai Tidak Tersedia tidak boleh menutup booking aktif.
      </KapsterPrototypeNote>

      <section className="kapster-schedule-metrics" aria-label="Ringkasan jadwal">
        <article className="cashier-metric-card kapster-schedule-metric">
          <span className="cashier-metric-icon kapster-metric-icon" aria-hidden="true">▦</span>
          <div><p>Total Jadwal</p><strong>{schedules.length}</strong></div>
        </article>
        <article className="cashier-metric-card kapster-schedule-metric">
          <span className="cashier-metric-icon kapster-metric-icon kapster-metric-icon--green" aria-hidden="true">✓</span>
          <div><p>Jadwal Aktif</p><strong>{availableCount}</strong></div>
        </article>
        <article className="cashier-metric-card kapster-schedule-metric">
          <span className="cashier-metric-icon kapster-metric-icon kapster-metric-icon--red" aria-hidden="true">×</span>
          <div><p>Jadwal Tidak Tersedia</p><strong>{unavailableCount}</strong></div>
        </article>
      </section>

      <section className="cashier-panel cashier-table-panel kapster-panel kapster-table-panel">
        <div className="kapster-panel-heading">
          <div>
            <h2>Daftar Jadwal Kerja</h2>
            <p>Jadwal yang dikelola untuk akun Kapster aktif.</p>
          </div>
        </div>
        <div className="kapster-schedule-filters">
          <label className="kapster-filter">
            <span>Cari berdasarkan tanggal</span>
            <input
              aria-label="Cari berdasarkan tanggal"
              onChange={(event) => setDateFilter(event.target.value)}
              type="date"
              value={dateFilter}
            />
          </label>
          <label className="kapster-filter">
            <span>Status ketersediaan</span>
            <select
              aria-label="Filter ketersediaan jadwal"
              onChange={(event) => setStatusFilter(event.target.value)}
              value={statusFilter}
            >
              <option value="all">Semua</option>
              <option value="available">Tersedia</option>
              <option value="unavailable">Tidak Tersedia</option>
            </select>
          </label>
          <label className="kapster-filter">
            <span>Bulan</span>
            <input
              aria-label="Filter bulan"
              onChange={(event) => setMonthFilter(event.target.value)}
              type="month"
              value={monthFilter}
            />
          </label>
        </div>
        <div className="kapster-table-scroll">
          <table className="cashier-table kapster-table kapster-schedule-table">
            <thead>
              <tr>
                <th scope="col">No.</th>
                <th scope="col">Tanggal</th>
                <th scope="col">Hari</th>
                <th scope="col">Jam Mulai</th>
                <th scope="col">Jam Selesai</th>
                <th scope="col">Status Ketersediaan</th>
                <th scope="col">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.map((schedule, index) => (
                <tr key={schedule.id}>
                  <td>{String(index + 1).padStart(2, "0")}</td>
                  <td>{formatTanggal(schedule.date)}</td>
                  <td>{formatDayName(schedule.date)}</td>
                  <td>{schedule.startTime.replace(":", ".")}</td>
                  <td>{schedule.endTime.replace(":", ".")}</td>
                  <td>
                    <span className={`kapster-schedule-status kapster-schedule-status--${schedule.status}`}>
                      {getScheduleStatusLabel(schedule.status)}
                    </span>
                  </td>
                  <td>
                    <div className="kapster-row-actions">
                      <Link
                        className="kapster-row-action"
                        href={`/kapster/jadwal/${encodeURIComponent(schedule.id)}`}
                      >
                        Lihat
                      </Link>
                      <Link
                        className="kapster-row-action"
                        href={`/kapster/jadwal/${encodeURIComponent(schedule.id)}/ubah`}
                      >
                        Ubah
                      </Link>
                      <button
                        className="kapster-row-action kapster-row-action--danger"
                        onClick={() => removeSchedule(schedule.id)}
                        type="button"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredSchedules.length === 0 && (
          <div className="kapster-empty-state">
            <h2>Tidak ada jadwal yang cocok</h2>
            <p>Sesuaikan pencarian tanggal, bulan, atau filter ketersediaan.</p>
          </div>
        )}
      </section>
    </div>
  );
}
