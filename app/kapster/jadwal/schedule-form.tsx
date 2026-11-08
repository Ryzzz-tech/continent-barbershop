"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAppFeedback } from "../../components/app-feedback";
import { formatTanggal, isValidDateValue } from "../../pelanggan/data";
import type { KapsterSchedule } from "../prototype-types";
import {
  formatDayName,
  getScheduleStatusLabel,
  KapsterPageHeading,
} from "../kapster-ui";

type ScheduleValues = Omit<KapsterSchedule, "id">;
type ScheduleField = keyof ScheduleValues;

const initialForm: ScheduleValues = {
  date: "",
  startTime: "",
  endTime: "",
  status: "available",
  note: "",
};

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

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export default function KapsterScheduleForm({ scheduleId }: { scheduleId?: string }) {
  const router = useRouter();
  const { showToast } = useAppFeedback();
  const [values, setValues] = useState<ScheduleValues>(initialForm);
  const [originalValues, setOriginalValues] = useState<ScheduleValues | null>(null);
  const [errors, setErrors] = useState<Partial<Record<ScheduleField, string>>>({});
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(Boolean(scheduleId));
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(scheduleId);

  const loadSchedule = useCallback(async () => {
    if (!scheduleId) return;
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
      const schedule = result.schedule;
      const nextValues: ScheduleValues = {
        date: schedule.date,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        status: schedule.status,
        note: schedule.note,
      };
      setValues(nextValues);
      setOriginalValues(nextValues);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Jadwal tidak dapat dimuat.");
    } finally {
      setLoading(false);
    }
  }, [scheduleId]);

  useEffect(() => { void Promise.resolve().then(loadSchedule); }, [loadSchedule]);

  function updateField(field: ScheduleField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function resetForm() {
    if (originalValues) {
      setValues(originalValues);
      setErrors({});
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Partial<Record<ScheduleField, string>> = {};
    if (!isValidDateValue(values.date)) nextErrors.date = "Tanggal jadwal wajib diisi dengan tanggal yang valid.";
    if (!isValidTime(values.startTime)) nextErrors.startTime = "Jam mulai wajib diisi dengan waktu yang valid.";
    if (!isValidTime(values.endTime)) nextErrors.endTime = "Jam selesai wajib diisi dengan waktu yang valid.";
    else if (isValidTime(values.startTime) && values.endTime <= values.startTime) {
      nextErrors.endTime = "Jam selesai harus lebih besar daripada jam mulai.";
    }
    if (values.note.trim().length > 100) nextErrors.note = "Catatan maksimal 100 karakter.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      const response = await fetch(
        scheduleId ? `/api/jadwal/kapster/${encodeURIComponent(scheduleId)}` : "/api/jadwal/kapster",
        {
          method: scheduleId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...values, note: values.note.trim() }),
        },
      );
      const result: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          isRecord(result) && typeof result.message === "string"
            ? result.message
            : "Jadwal tidak dapat disimpan.",
        );
      }
      showToast(
        scheduleId ? "Jadwal Diperbarui" : "Jadwal Ditambahkan",
        scheduleId ? "Perubahan jadwal tersimpan di database." : "Jadwal baru tersimpan di database.",
        "success",
      );
      router.push("/kapster/jadwal");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Jadwal tidak dapat disimpan.";
      setLoadError(message);
      showToast("Jadwal Gagal Disimpan", message, "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="kapster-page" aria-busy="true"><KapsterPageHeading title={isEdit ? "Ubah Jadwal" : "Tambah Jadwal"} /><p>Memuat jadwal...</p></div>;
  }
  if (isEdit && loadError && !originalValues) {
    return (
      <div className="cashier-page kapster-page">
        <KapsterPageHeading title="Ubah Jadwal" />
        <div className="cashier-empty-state kapster-empty-state kapster-empty-state--card" role="alert">
          <h2>Jadwal tidak dapat dimuat</h2><p>{loadError}</p>
          <button className="cashier-button kapster-button kapster-button--secondary" onClick={() => { setLoading(true); setLoadError(""); void loadSchedule(); }} type="button">Coba lagi</button>
          <Link className="cashier-button kapster-button kapster-button--primary" href="/kapster/jadwal">Kembali ke Jadwal &amp; Ketersediaan</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="kapster-page">
      <KapsterPageHeading
        title={isEdit ? "Ubah Jadwal" : "Tambah Jadwal"}
        description={isEdit ? "Perbarui jadwal kerja dan ketersediaan waktu pelayanan Anda." : "Lengkapi informasi jadwal kerja dan ketersediaan waktu pelayanan Anda."}
      />
      <form className="kapster-schedule-form-layout" onSubmit={submit} noValidate>
        <section className="kapster-panel">
          <div className="kapster-form-grid">
            <div className="kapster-field kapster-field--full">
              <label htmlFor="schedule-date">Tanggal Jadwal</label>
              <input aria-invalid={Boolean(errors.date)} id="schedule-date" onChange={(event) => updateField("date", event.target.value)} type="date" value={values.date} />
              {errors.date && <span className="kapster-field-error">{errors.date}</span>}
            </div>
            <div className="kapster-field">
              <label htmlFor="schedule-start">Jam Mulai</label>
              <input aria-invalid={Boolean(errors.startTime)} id="schedule-start" onChange={(event) => updateField("startTime", event.target.value)} type="time" value={values.startTime} />
              {errors.startTime && <span className="kapster-field-error">{errors.startTime}</span>}
            </div>
            <div className="kapster-field">
              <label htmlFor="schedule-end">Jam Selesai</label>
              <input aria-invalid={Boolean(errors.endTime)} id="schedule-end" onChange={(event) => updateField("endTime", event.target.value)} type="time" value={values.endTime} />
              {errors.endTime && <span className="kapster-field-error">{errors.endTime}</span>}
            </div>
            <fieldset className="kapster-schedule-status-field">
              <legend>Status Ketersediaan</legend>
              <div className="kapster-schedule-status-options">
                <label className={`kapster-schedule-status-option${values.status === "available" ? " is-selected" : ""}`}>
                  <input checked={values.status === "available"} name="schedule-status" onChange={() => updateField("status", "available")} type="radio" value="available" />
                  <span className="kapster-radio-visible" />Tersedia
                </label>
                <label className={`kapster-schedule-status-option${values.status === "unavailable" ? " is-selected" : ""}`}>
                  <input checked={values.status === "unavailable"} name="schedule-status" onChange={() => updateField("status", "unavailable")} type="radio" value="unavailable" />
                  <span className="kapster-radio-visible" />Tidak Tersedia
                </label>
              </div>
            </fieldset>
            <div className="kapster-field kapster-field--full">
              <label htmlFor="schedule-note">Catatan (Opsional)</label>
              <textarea id="schedule-note" maxLength={100} onChange={(event) => updateField("note", event.target.value)} placeholder="Tambahkan catatan jadwal..." rows={4} value={values.note} />
              {errors.note && <span className="kapster-field-error">{errors.note}</span>}
            </div>
          </div>
          {loadError && <p className="kapster-error-banner" role="alert">{loadError}</p>}
          <div className="kapster-form-actions">
            <Link className="cashier-button kapster-button kapster-button--secondary" href="/kapster/jadwal">Batal</Link>
            {isEdit && <button className="cashier-button kapster-button kapster-button--secondary" onClick={resetForm} type="button">Reset</button>}
            <button className="cashier-button kapster-button kapster-button--primary" disabled={saving} type="submit">{saving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Simpan Jadwal"}</button>
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
          <p className="kapster-summary-note">Jadwal akan divalidasi terhadap jadwal lain dan booking aktif sebelum disimpan.</p>
        </aside>
      </form>
    </div>
  );
}
