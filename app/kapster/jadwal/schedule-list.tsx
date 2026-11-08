"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import ConfirmDialog from "../../components/confirm-dialog";
import { useAppFeedback } from "../../components/app-feedback";
import { formatTanggal } from "../../pelanggan/data";
import type { KapsterSchedule } from "../prototype-types";
import {
  formatDayName,
  getScheduleStatusLabel,
  KapsterPageHeading,
} from "../kapster-ui";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSchedule(value: unknown): value is KapsterSchedule {
  return isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.date === "string" &&
    typeof value.startTime === "string" &&
    typeof value.endTime === "string" &&
    (value.status === "available" || value.status === "unavailable") &&
    typeof value.note === "string";
}

export default function KapsterScheduleList() {
  const { showToast } = useAppFeedback();
  const [schedules, setSchedules] = useState<KapsterSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("");
  const [scheduleToDelete, setScheduleToDelete] = useState<KapsterSchedule | null>(null);

  const loadSchedules = useCallback(async () => {
    try {
      const response = await fetch("/api/jadwal/kapster?mine=true", { cache: "no-store" });
      const result: unknown = await response.json();
      if (!response.ok || !isRecord(result) || !Array.isArray(result.schedules) || !result.schedules.every(isSchedule)) {
        throw new Error(
          isRecord(result) && typeof result.message === "string"
            ? result.message
            : "Jadwal tidak dapat dimuat.",
        );
      }
      setSchedules(result.schedules);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Jadwal tidak dapat dimuat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void Promise.resolve().then(loadSchedules); }, [loadSchedules]);

  const filteredSchedules = useMemo(
    () =>
      schedules
        .filter((schedule) => !dateFilter || schedule.date === dateFilter)
        .filter((schedule) => statusFilter === "all" || schedule.status === statusFilter)
        .filter((schedule) => !monthFilter || schedule.date.startsWith(monthFilter))
        .sort((left, right) => `${left.date}T${left.startTime}`.localeCompare(`${right.date}T${right.startTime}`)),
    [dateFilter, monthFilter, schedules, statusFilter],
  );
  const availableCount = schedules.filter((schedule) => schedule.status === "available").length;
  const unavailableCount = schedules.filter((schedule) => schedule.status === "unavailable").length;

  async function removeSchedule() {
    if (!scheduleToDelete) return false;
    try {
      const response = await fetch(`/api/jadwal/kapster/${encodeURIComponent(scheduleToDelete.id)}`, {
        method: "DELETE",
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          isRecord(result) && typeof result.message === "string"
            ? result.message
            : "Jadwal tidak dapat dihapus.",
        );
      }
      setSchedules((current) => current.filter((schedule) => schedule.id !== scheduleToDelete.id));
      showToast("Jadwal Berhasil Dihapus", `Jadwal ${formatTanggal(scheduleToDelete.date)} berhasil dihapus.`, "success");
      return true;
    } catch (deleteError) {
      showToast(
        "Penghapusan Gagal",
        deleteError instanceof Error ? deleteError.message : "Jadwal tidak dapat dihapus.",
        "error",
      );
      return false;
    }
  }

  return (
    <div className="cashier-page kapster-page">
      <KapsterPageHeading title="Jadwal & Ketersediaan" description="Kelola jadwal kerja dan atur ketersediaan waktu pelayanan Anda.">
        <Link className="cashier-button kapster-button kapster-button--primary" href="/kapster/jadwal/tambah">
          <span aria-hidden="true">＋</span> Tambah Jadwal
        </Link>
      </KapsterPageHeading>
      <p className="cashier-prototype-note kapster-prototype-note">
        Status Tersedia menunjukkan jam kerja. Slot booking akan diperiksa kembali oleh server berdasarkan durasi layanan dan booking aktif.
      </p>

      <section className="kapster-schedule-metrics" aria-label="Ringkasan jadwal">
        <article className="cashier-metric-card kapster-schedule-metric">
          <span className="cashier-metric-icon kapster-metric-icon" aria-hidden="true">▦</span>
          <div><p>Total Jadwal</p><strong>{loading ? "—" : schedules.length}</strong></div>
        </article>
        <article className="cashier-metric-card kapster-schedule-metric">
          <span className="cashier-metric-icon kapster-metric-icon kapster-metric-icon--green" aria-hidden="true">✓</span>
          <div><p>Jadwal Aktif</p><strong>{loading ? "—" : availableCount}</strong></div>
        </article>
        <article className="cashier-metric-card kapster-schedule-metric">
          <span className="cashier-metric-icon kapster-metric-icon kapster-metric-icon--red" aria-hidden="true">×</span>
          <div><p>Jadwal Tidak Tersedia</p><strong>{loading ? "—" : unavailableCount}</strong></div>
        </article>
      </section>

      <section className="cashier-panel cashier-table-panel kapster-panel kapster-table-panel">
        <div className="kapster-panel-heading"><div><h2>Daftar Jadwal Kerja</h2><p>Jadwal yang dikelola untuk akun Kapster aktif.</p></div></div>
        <div className="kapster-schedule-filters">
          <label className="kapster-filter"><span>Cari berdasarkan tanggal</span><input aria-label="Cari berdasarkan tanggal" onChange={(event) => setDateFilter(event.target.value)} type="date" value={dateFilter} /></label>
          <label className="kapster-filter"><span>Status ketersediaan</span><select aria-label="Filter ketersediaan jadwal" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}><option value="all">Semua</option><option value="available">Tersedia</option><option value="unavailable">Tidak Tersedia</option></select></label>
          <label className="kapster-filter"><span>Bulan</span><input aria-label="Filter bulan" onChange={(event) => setMonthFilter(event.target.value)} type="month" value={monthFilter} /></label>
        </div>
        {loading && <div className="kapster-empty-state" aria-busy="true"><p>Memuat jadwal...</p></div>}
        {!loading && error && (
          <div className="kapster-empty-state" role="alert">
            <h2>Jadwal tidak dapat dimuat</h2><p>{error}</p>
            <button className="kapster-row-action" onClick={() => { setLoading(true); setError(""); void loadSchedules(); }} type="button">Coba lagi</button>
          </div>
        )}
        {!loading && !error && (
          <>
            <div className="kapster-table-scroll">
              <table className="cashier-table kapster-table kapster-schedule-table">
                <thead><tr><th scope="col">No.</th><th scope="col">Tanggal</th><th scope="col">Hari</th><th scope="col">Jam Mulai</th><th scope="col">Jam Selesai</th><th scope="col">Status Ketersediaan</th><th scope="col">Aksi</th></tr></thead>
                <tbody>
                  {filteredSchedules.map((schedule, index) => (
                    <tr key={schedule.id}>
                      <td>{String(index + 1).padStart(2, "0")}</td>
                      <td>{formatTanggal(schedule.date)}</td><td>{formatDayName(schedule.date)}</td>
                      <td>{schedule.startTime.replace(":", ".")}</td><td>{schedule.endTime.replace(":", ".")}</td>
                      <td><span className={`kapster-schedule-status kapster-schedule-status--${schedule.status}`}>{getScheduleStatusLabel(schedule.status)}</span></td>
                      <td><div className="kapster-row-actions">
                        <Link className="kapster-row-action" href={`/kapster/jadwal/${encodeURIComponent(schedule.id)}`}>Lihat</Link>
                        <Link className="kapster-row-action" href={`/kapster/jadwal/${encodeURIComponent(schedule.id)}/ubah`}>Ubah</Link>
                        <button className="kapster-row-action kapster-row-action--danger" onClick={() => setScheduleToDelete(schedule)} type="button">Hapus</button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredSchedules.length === 0 && (
              <div className="kapster-empty-state">
                <h2>{schedules.length ? "Tidak ada jadwal yang cocok" : "Belum ada jadwal"}</h2>
                <p>{schedules.length ? "Sesuaikan pencarian tanggal, bulan, atau filter ketersediaan." : "Tambahkan jadwal kerja agar pelanggan dapat memilih slot booking."}</p>
              </div>
            )}
          </>
        )}
      </section>
      {scheduleToDelete && (
        <ConfirmDialog
          title="Konfirmasi Penghapusan"
          description={`Apakah Anda yakin ingin menghapus jadwal ${formatTanggal(scheduleToDelete.date)}?`}
          onClose={() => setScheduleToDelete(null)}
          onConfirm={removeSchedule}
        />
      )}
    </div>
  );
}
