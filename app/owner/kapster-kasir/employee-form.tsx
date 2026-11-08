"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { OwnerPageHeading, OwnerPrototypeNote } from "../owner-ui";

type EmployeeRole = "Kapster" | "Kasir";

type EmployeeValues = {
  name: string;
  role: EmployeeRole;
  phone: string;
  username: string;
  password: string;
};

type EmployeeField = keyof EmployeeValues;

type EmployeeRecord = {
  id: string;
  name: string;
  role: EmployeeRole;
  phone: string;
  username: string;
  hasPassword: boolean;
  isActive: boolean;
  profileStatus: string;
};

const blankValues: EmployeeValues = {
  name: "",
  role: "Kapster",
  phone: "",
  username: "",
  password: "",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isEmployee(value: unknown): value is EmployeeRecord {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    (value.role === "Kapster" || value.role === "Kasir") &&
    typeof value.phone === "string" &&
    typeof value.username === "string" &&
    typeof value.hasPassword === "boolean" &&
    typeof value.isActive === "boolean" &&
    typeof value.profileStatus === "string"
  );
}

function getErrorMessage(value: unknown, fallback: string) {
  return isRecord(value) && typeof value.message === "string"
    ? value.message
    : fallback;
}

export default function OwnerEmployeeForm({
  employeeId,
}: {
  employeeId?: string;
}) {
  const router = useRouter();
  const isEdit = Boolean(employeeId);

  const [values, setValues] = useState<EmployeeValues>(blankValues);
  const [hasPassword, setHasPassword] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<EmployeeField, string>>
  >({});
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!employeeId) {
      setLoading(false);
      return;
    }

    const currentEmployeeId: string = employeeId;
    let cancelled = false;

    async function loadEmployee() {
      setLoading(true);
      setFormError("");

      try {
        const response = await fetch(
          `/api/owner/employees/${encodeURIComponent(currentEmployeeId)}`,
          { cache: "no-store" },
        );

        const result: unknown = await response.json();

        if (
          !response.ok ||
          !isRecord(result) ||
          !isEmployee(result.employee)
        ) {
          throw new Error(
            getErrorMessage(result, "Data karyawan tidak dapat dimuat."),
          );
        }

        if (cancelled) return;

        const employee = result.employee;

        setValues({
          name: employee.name,
          role: employee.role,
          phone: employee.phone,
          username: employee.username,
          password: "",
        });

        setHasPassword(employee.hasPassword);
      } catch (error) {
        if (!cancelled) {
          setFormError(
            error instanceof Error
              ? error.message
              : "Data karyawan tidak dapat dimuat.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadEmployee();

    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  function updateField(field: EmployeeField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || loading) return;

    const nextErrors: Partial<Record<EmployeeField, string>> = {};

    if (!values.name.trim()) {
      nextErrors.name = "Nama lengkap wajib diisi.";
    }

    const phone = values.phone.replace(/[\s()-]/g, "");

    if (!phone) {
      nextErrors.phone = "Nomor HP wajib diisi.";
    } else if (!/^(?:\+?62|0)8\d{8,10}$/.test(phone)) {
      nextErrors.phone = "Masukkan nomor HP Indonesia yang valid.";
    }

    const email = values.username.trim();

    if (!email) {
      nextErrors.username = "Email login wajib diisi.";
    } else if (
      email.length > 100 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      nextErrors.username = "Masukkan alamat email yang valid.";
    }

    const passwordRequired = !isEdit || !hasPassword;

    if (passwordRequired && !values.password) {
      nextErrors.password =
        "Password wajib diisi untuk membuat akun login.";
    } else if (
      values.password &&
      values.password.length < 8
    ) {
      nextErrors.password = "Password minimal 8 karakter.";
    } else if (
      values.password &&
      new TextEncoder().encode(values.password).length > 72
    ) {
      nextErrors.password = "Password maksimal 72 byte.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setFormError("");

    try {
      const endpoint = isEdit
        ? `/api/owner/employees/${encodeURIComponent(employeeId!)}`
        : "/api/owner/employees";

      const response = await fetch(endpoint, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          role: values.role,
          phone,
          username: email,
          password: values.password,
        }),
      });

      const result: unknown = await response.json();

      if (!response.ok || !isRecord(result) || result.success !== true) {
        throw new Error(
          getErrorMessage(result, "Data karyawan gagal disimpan."),
        );
      }

      router.push("/owner/kapster-kasir");
      router.refresh();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menyimpan data karyawan.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="cashier-page owner-page">
      <OwnerPageHeading
        title={isEdit ? "Ubah Data Kapster & Kasir" : "Tambah Data Kapster & Kasir"}
        description={
          isEdit
            ? "Perbarui profil dan informasi akun login karyawan."
            : "Masukkan informasi profil dan akun login karyawan baru."
        }
      />

      <OwnerPrototypeNote>
        Data karyawan disimpan ke PostgreSQL. Email digunakan sebagai
        identitas login, sedangkan password diproses menggunakan hash
        sebelum disimpan. Password lama tidak ditampilkan.
      </OwnerPrototypeNote>

      {loading ? (
        <div className="cashier-empty-state owner-empty-state">
          Memuat data karyawan...
        </div>
      ) : (
        <form
          className="cashier-form-panel owner-employee-form"
          onSubmit={submit}
          noValidate
        >
          <div className="cashier-field cashier-field--full">
            <label htmlFor="owner-employee-name">Nama Lengkap</label>
            <input
              aria-describedby={
                errors.name ? "owner-employee-name-error" : undefined
              }
              aria-invalid={Boolean(errors.name)}
              id="owner-employee-name"
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Masukkan nama lengkap"
              value={values.name}
            />
            {errors.name && (
              <span
                className="cashier-field-error"
                id="owner-employee-name-error"
              >
                {errors.name}
              </span>
            )}
          </div>

          <div className="cashier-field">
            <label htmlFor="owner-employee-role">Peran</label>
            <select
              disabled={isEdit}
              id="owner-employee-role"
              onChange={(event) =>
                updateField("role", event.target.value as EmployeeRole)
              }
              value={values.role}
            >
              <option value="Kapster">Kapster</option>
              <option value="Kasir">Kasir</option>
            </select>
            {isEdit && (
              <span className="owner-optional-label">
                Peran tidak dapat diubah setelah profil dibuat.
              </span>
            )}
          </div>

          <div className="cashier-field">
            <label htmlFor="owner-employee-phone">Nomor HP</label>
            <input
              aria-describedby={
                errors.phone ? "owner-employee-phone-error" : undefined
              }
              aria-invalid={Boolean(errors.phone)}
              autoComplete="tel"
              id="owner-employee-phone"
              onChange={(event) => updateField("phone", event.target.value)}
              placeholder="Contoh: 081234567890"
              type="tel"
              value={values.phone}
            />
            {errors.phone && (
              <span
                className="cashier-field-error"
                id="owner-employee-phone-error"
              >
                {errors.phone}
              </span>
            )}
          </div>

          <div className="cashier-field">
            <label htmlFor="owner-employee-username">Email untuk Login</label>
            <input
              aria-describedby={
                errors.username ? "owner-employee-username-error" : undefined
              }
              aria-invalid={Boolean(errors.username)}
              autoComplete="username"
              id="owner-employee-username"
              onChange={(event) => updateField("username", event.target.value)}
              placeholder="Contoh: nama@continent.com"
              type="email"
              value={values.username}
            />
            {errors.username && (
              <span
                className="cashier-field-error"
                id="owner-employee-username-error"
              >
                {errors.username}
              </span>
            )}
          </div>

          <div className="cashier-field">
            <label htmlFor="owner-employee-password">
              Password{" "}
              {isEdit && hasPassword && (
                <span className="owner-optional-label">
                  (opsional, kosongkan jika tidak diubah)
                </span>
              )}
            </label>
            <input
              aria-describedby={
                errors.password ? "owner-employee-password-error" : undefined
              }
              aria-invalid={Boolean(errors.password)}
              autoComplete="new-password"
              id="owner-employee-password"
              onChange={(event) => updateField("password", event.target.value)}
              placeholder={
                isEdit && hasPassword
                  ? "Kosongkan jika tidak diubah"
                  : "Masukkan password minimal 8 karakter"
              }
              type="password"
              value={values.password}
            />
            {errors.password && (
              <span
                className="cashier-field-error"
                id="owner-employee-password-error"
              >
                {errors.password}
              </span>
            )}
          </div>

          {formError && (
            <p className="cashier-error-banner owner-form-error" role="alert">
              {formError}
            </p>
          )}

          <div className="cashier-form-actions owner-form-actions">
            <Link
              className="cashier-button cashier-button--secondary"
              href="/owner/kapster-kasir"
            >
              Batal
            </Link>
            <button
              className="cashier-button cashier-button--primary"
              disabled={saving}
              type="submit"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
