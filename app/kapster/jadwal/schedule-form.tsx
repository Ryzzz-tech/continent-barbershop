"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  formatTanggal,
  isValidDateValue,
} from "../../pelanggan/data";
import { useKapsterPrototype } from "../kapster-context";
import {
  formatDayName,
  getScheduleStatusLabel,
  KapsterPageHeading,
} from "../kapster-ui";
import type { KapsterSchedule } from "../prototype-types";

type ScheduleValues = Omit<KapsterSchedule, "id">;
type ScheduleField = keyof ScheduleValues;

const initialForm: ScheduleValues = {
  date: "",
  startTime: "",
  endTime: "",
  status: "available",
  note: "",
};

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export default function KapsterScheduleForm({
  scheduleId,
}: {
  scheduleId?: string;
}) {
  const router = useRouter();
  const { getSchedule, saveSchedule, getScheduleConflict, announce } =
    useKapsterPrototype();
  const originalSchedule = scheduleId ? getSchedule(scheduleId) : undefined;
  const [values, setValues] = useState<ScheduleValues>(() =>
    originalSchedule
      ? {
          date: originalSchedule.date,
          startTime: originalSchedule.startTime,
          endTime: originalSchedule.endTime,
          status: originalSchedule.status,
          note: originalSchedule.note,
        }
      : initialForm,
  );
  const [errors, setErrors] = useState<Partial<Record<ScheduleField, string>>>({});
  const isEdit = Boolean(scheduleId);

  if (isEdit && !originalSchedule) {
    return (
      <div className="cashier-page kapster-page">
        <KapsterPageHeading title="Ubah Jadwal" />
        <div className="cashier-empty-state kapster-empty-state kapster-empty-state--card">
          <h2>Jadwal tidak ditemukan</h2>
          <p>Jadwal mungkin sudah dihapus atau sesi prototipe telah dimulai ulang.</p>
          <Link className="cashier-button kapster-button kapster-button--primary" href="/kapster/jadwal">
            Kembali ke Jadwal &amp; Ketersediaan
          </Link>
        </div>
      </div>
    );
  }

  function updateField(field: ScheduleField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function resetForm() {
    if (!originalSchedule) return;
    setValues({
      date: originalSchedule.date,
      startTime: originalSchedule.startTime,
      endTime: originalSchedule.endTime,
      status: originalSchedule.status,
      note: originalSchedule.note,
    });
    setErrors({});
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Partial<Record<ScheduleField, string>> = {};
    if (!isValidDateValue(values.date)) {
      nextErrors.date = "Tanggal jadwal wajib diisi dengan tanggal yang valid.";
    }
    if (!isValidTime(values.startTime)) {
      nextErrors.startTime = "Jam mulai wajib diisi dengan waktu yang valid.";
    }
    if (!isValidTime(values.endTime)) {
      nextErrors.endTime = "Jam selesai wajib diisi dengan waktu yang valid.";
    } else if (isValidTime(values.startTime) && values.endTime <= values.startTime) {
      nextErrors.endTime = "Jam selesai harus lebih besar daripada jam mulai.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const schedule: KapsterSchedule = {
      ...values,
      id: scheduleId ?? `SCH-${values.date.replaceAll("-", "")}-${crypto.randomUUID().slice(0, 8)}`,
    };
    const conflict = getScheduleConflict(schedule);
    if (conflict === "overlap") {
      setErrors((current) => ({
        ...current,
        date: "Jadwal bertumpang tindih dengan jadwal kerja lain pada tanggal tersebut.",
      }));
      return;
    }
    if (conflict === "active-booking") {
      setErrors((current) => ({
        ...current,
        status: "Jadwal ini mencakup booking aktif. Booking harus diselesaikan atau dijadwalkan ulang sebelum waktu ditandai tidak tersedia.",
      }));
      return;
    }

    if (!saveSchedule(schedule)) {
      setErrors((current) => ({
        ...current,
        date: "Jadwal tidak dapat disimpan karena terjadi benturan.",
      }));
      return;
    }

    announce(
      isEdit
        ? "Perubahan jadwal disimpan pada state prototipe."
        : "Jadwal ditambahkan pada state prototipe.",
    );
    router.push("/kapster/jadwal");
  }

  return (
    <div className="kapster-page">
      <KapsterPageHeading
        title={isEdit ? "Ubah Jadwal" : "Tambah Jadwal"}
        description={
          isEdit
            ? "Perbarui jadwal kerja dan ketersediaan waktu pelayanan Anda."
            : "Lengkapi informasi berikut untuk menambahkan jadwal kerja dan ketersediaan waktu pelayanan Anda."
        }
      />
      <form className="kapster-schedule-form-layout" onSubmit={submit} noValidate>
        <section className="kapster-panel">
          <div className="kapster-form-grid">
            <div className="kapster-field kapster-field--full">
              <label htmlFor="schedule-date">Tanggal Jadwal</label>
              <input
                aria-invalid={Boolean(errors.date)}
                aria-describedby={errors.date ? "schedule-date-error" : undefined}
                id="schedule-date"
                onChange={(event) => updateField("date", event.target.value)}
                type="date"
                value={values.date}
              />
              {errors.date && <span className="kapster-field-error" id="schedule-date-error">{errors.date}</span>}
            </div>
            <div className="kapster-field">
              <label htmlFor="schedule-start">Jam Mulai</label>
              <input
                aria-invalid={Boolean(errors.startTime)}
                aria-describedby={errors.startTime ? "schedule-start-error" : undefined}
                id="schedule-start"
                onChange={(event) => updateField("startTime", event.target.value)}
                type="time"
                value={values.startTime}
              />
              {errors.startTime && <span className="kapster-field-error" id="schedule-start-error">{errors.startTime}</span>}
            </div>
            <div className="kapster-field">
              <label htmlFor="schedule-end">Jam Selesai</label>
              <input
                aria-invalid={Boolean(errors.endTime)}
                aria-describedby={errors.endTime ? "schedule-end-error" : undefined}
                id="schedule-end"
                onChange={(event) => updateField("endTime", event.target.value)}
                type="time"
                value={values.endTime}
              />
              {errors.endTime && <span className="kapster-field-error" id="schedule-end-error">{errors.endTime}</span>}
            </div>
            <fieldset className="kapster-schedule-status-field">
              <legend>Status Ketersediaan</legend>
              <div className="kapster-schedule-status-options">
                <label className={`kapster-schedule-status-option${values.status === "available" ? " is-selected" : ""}`}>
                  <input
                    checked={values.status === "available"}
                    name="schedule-status"
                    onChange={() => updateField("status", "available")}
                    type="radio"
                    value="available"
                  />
                  <span className="kapster-radio-visible" />
                  Tersedia
                </label>
                <label className={`kapster-schedule-status-option${values.status === "unavailable" ? " is-selected" : ""}`}>
                  <input
                    checked={values.status === "unavailable"}
                    name="schedule-status"
                    onChange={() => {
                      updateField("status", "unavailable");
                      setErrors((current) => ({ ...current, status: undefined }));
                    }}
                    type="radio"
                    value="unavailable"
                  />
                  <span className="kapster-radio-visible" />
                  Tidak Tersedia
                </label>
              </div>
              {errors.status && <span className="kapster-field-error">{errors.status}</span>}
            </fieldset>
            <div className="kapster-field kapster-field--full">
              <label htmlFor="schedule-note">Catatan (Opsional)</label>
              <textarea
                id="schedule-note"
                onChange={(event) => updateField("note", event.target.value)}
                placeholder="Tambahkan catatan jadwal..."
                rows={4}
                value={values.note}
              />
            </div>
          </div>
          <div className="kapster-form-actions">
            <Link className="cashier-button kapster-button kapster-button--secondary" href="/kapster/jadwal">
              Batal
            </Link>
            {isEdit && (
              <button
                className="cashier-button kapster-button kapster-button--secondary"
                onClick={resetForm}
                type="button"
              >
                Reset
              </button>
            )}
            <button className="cashier-button kapster-button kapster-button--primary" type="submit">
              {isEdit ? "Simpan Perubahan" : "Simpan Jadwal"}
            </button>
          </div>
        </section>
        <aside className="cashier-panel kapster-panel kapster-summary-panel">
          <h2>{isEdit ? "Ringkasan Perubahan" : "Ringkasan Jadwal"}</h2>
          <dl className="kapster-detail-list">
            <div><dt>Tanggal Jadwal</dt><dd>{values.date ? formatTanggal(values.date) : "Belum dipilih"}</dd></div>
            <div><dt>Hari</dt><dd>{values.date ? formatDayName(values.date) : "—"}</dd></div>
            <div><dt>Jam Mulai</dt><dd>{values.startTime || "—"}</dd></div>
            <div><dt>Jam Selesai</dt><dd>{values.endTime || "—"}</dd></div>
            <div><dt>Status</dt><dd><span className={`kapster-schedule-status kapster-schedule-status--${values.status}`}>{getScheduleStatusLabel(values.status)}</span></dd></div>
          </dl>
          <p className="kapster-summary-note">
            Jadwal aktif akan divalidasi terhadap jadwal kerja lain dan booking
            aktif pada tanggal yang sama.
          </p>
        </aside>
      </form>
    </div>
  );
}
