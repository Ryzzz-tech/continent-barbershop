"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { KapsterSchedule } from "../../prototype-types";
import {
  formatDayName,
  getScheduleStatusLabel,
  KapsterPageHeading,
} from "../../kapster-ui";
import { formatTanggal } from "../../../pelanggan/data";

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

export default function KapsterScheduleDetail({ scheduleId }: { scheduleId: string }) {
  const [schedule, setSchedule] = useState<KapsterSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSchedule = useCallback(async () => {
    try {
      const response = await fetch(`/api/jadwal/kapster/${encodeURIComponent(scheduleId)}`, { cache: "no-store" });
      const result: unknown = await response.json();
      if (!response.ok || !isRecord(result) || !isSchedule(result.schedule)) {
        throw new Error(
          isRecord(result) && typeof result.message === "string"
            ? result.message
            : "Jadwal tidak dapat dimuat.",
        );
      }
      setSchedule(result.schedule);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Jadwal tidak dapat dimuat.");
    } finally {
      setLoading(false);
    }
  }, [scheduleId]);

  useEffect(() => { void Promise.resolve().then(loadSchedule); }, [loadSchedule]);

  if (loading) {
    return <div className="cashier-page kapster-page" aria-busy="true"><KapsterPageHeading title="Detail Jadwal" /><p>Memuat jadwal...</p></div>;
  }
  if (!schedule) {
    return (
      <div className="cashier-page kapster-page">
        <KapsterPageHeading title="Detail Jadwal" />
        <div className="cashier-empty-state kapster-empty-state kapster-empty-state--card" role="alert">
          <h2>Jadwal tidak dapat dimuat</h2><p>{error}</p>
          <button className="cashier-button kapster-button kapster-button--secondary" onClick={() => { setLoading(true); setError(""); void loadSchedule(); }} type="button">Coba lagi</button>
          <Link className="cashier-button kapster-button kapster-button--primary" href="/kapster/jadwal">Kembali ke Jadwal &amp; Ketersediaan</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cashier-page kapster-page">
      <KapsterPageHeading title="Detail Jadwal">
        <Link className="kapster-text-link" href="/kapster/jadwal">← Kembali</Link>
      </KapsterPageHeading>
      <section className="cashier-panel kapster-panel kapster-detail-panel">
        <dl className="kapster-detail-list">
          <div><dt>Tanggal</dt><dd>{formatTanggal(schedule.date)}</dd></div>
          <div><dt>Hari</dt><dd>{formatDayName(schedule.date)}</dd></div>
          <div><dt>Jam Mulai</dt><dd>{schedule.startTime}</dd></div>
          <div><dt>Jam Selesai</dt><dd>{schedule.endTime}</dd></div>
          <div><dt>Status Ketersediaan</dt><dd><span className={`kapster-schedule-status kapster-schedule-status--${schedule.status}`}>{getScheduleStatusLabel(schedule.status)}</span></dd></div>
          <div><dt>Catatan</dt><dd>{schedule.note.trim() || "Tidak ada catatan tambahan."}</dd></div>
        </dl>
        <div className="kapster-form-actions">
          <Link className="cashier-button kapster-button kapster-button--secondary" href="/kapster/jadwal">Kembali ke Daftar</Link>
          <Link className="cashier-button kapster-button kapster-button--primary" href={`/kapster/jadwal/${encodeURIComponent(schedule.id)}/ubah`}>Ubah Jadwal</Link>
        </div>
      </section>
    </div>
  );
}
