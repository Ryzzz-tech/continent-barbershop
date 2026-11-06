"use client";

import Link from "next/link";
import { useKapsterPrototype } from "../../kapster-context";
import {
  formatDayName,
  getScheduleStatusLabel,
  KapsterPageHeading,
} from "../../kapster-ui";
import { formatTanggal } from "../../../pelanggan/data";

export default function KapsterScheduleDetail({
  scheduleId,
}: {
  scheduleId: string;
}) {
  const { getSchedule } = useKapsterPrototype();
  const schedule = getSchedule(scheduleId);

  if (!schedule) {
    return (
      <div className="cashier-page kapster-page">
        <KapsterPageHeading title="Detail Jadwal" />
        <div className="cashier-empty-state kapster-empty-state kapster-empty-state--card">
          <h2>Jadwal tidak ditemukan</h2>
          <p>Jadwal mungkin sudah dihapus atau tidak tersedia pada sesi ini.</p>
          <Link className="cashier-button kapster-button kapster-button--primary" href="/kapster/jadwal">
            Kembali ke Jadwal &amp; Ketersediaan
          </Link>
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
          <div>
            <dt>Status Ketersediaan</dt>
            <dd><span className={`kapster-schedule-status kapster-schedule-status--${schedule.status}`}>{getScheduleStatusLabel(schedule.status)}</span></dd>
          </div>
          <div><dt>Catatan</dt><dd>{schedule.note.trim() || "Tidak ada catatan tambahan."}</dd></div>
        </dl>
        <div className="kapster-form-actions">
          <Link className="cashier-button kapster-button kapster-button--secondary" href="/kapster/jadwal">
            Kembali ke Daftar
          </Link>
          <Link
            className="cashier-button kapster-button kapster-button--primary"
            href={`/kapster/jadwal/${encodeURIComponent(schedule.id)}/ubah`}
          >
            Ubah Jadwal
          </Link>
        </div>
      </section>
    </div>
  );
}
