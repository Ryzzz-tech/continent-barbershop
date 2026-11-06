"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useOwnerPrototype } from "../owner-context";
import type { OwnerEmployee, OwnerEmployeeRole } from "../prototype-types";
import { OwnerPageHeading, OwnerPrototypeNote } from "../owner-ui";

type EmployeeValues = {
  name: string;
  role: OwnerEmployeeRole;
  phone: string;
  username: string;
  password: string;
};

type EmployeeField = keyof EmployeeValues;

const blankValues: EmployeeValues = {
  name: "",
  role: "Kapster",
  phone: "",
  username: "",
  password: "",
};

export default function OwnerEmployeeForm({ employeeId }: { employeeId?: string }) {
  const router = useRouter();
  const { employees, addEmployee, updateEmployee, announce } = useOwnerPrototype();
  const employee = employeeId ? employees.find((item) => item.id === employeeId) : undefined;
  const [values, setValues] = useState<EmployeeValues>(() => employee
    ? {
        name: employee.name,
        role: employee.role,
        phone: employee.phone,
        username: employee.username,
        password: "",
      }
    : blankValues);
  const [errors, setErrors] = useState<Partial<Record<EmployeeField, string>>>({});
  const [formError, setFormError] = useState("");
  const isEdit = Boolean(employeeId);

  if (isEdit && !employee) {
    return (
      <div className="cashier-page owner-page">
        <OwnerPageHeading title="Form Data Kapster & Kasir" />
        <div className="cashier-empty-state owner-empty-state">
          <h2>Data karyawan tidak ditemukan</h2>
          <p>Data mungkin sudah dihapus atau sesi prototipe telah dimulai ulang.</p>
          <Link className="cashier-button cashier-button--primary" href="/owner/kapster-kasir">
            Kembali ke Data Kapster & Kasir
          </Link>
        </div>
      </div>
    );
  }

  function updateField(field: EmployeeField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Partial<Record<EmployeeField, string>> = {};
    if (!values.name.trim()) nextErrors.name = "Nama lengkap wajib diisi.";
    const phone = values.phone.replace(/[\s()-]/g, "");
    if (!phone) {
      nextErrors.phone = "Nomor HP wajib diisi.";
    } else if (!/^(?:\+?62|0)8\d{8,11}$/.test(phone)) {
      nextErrors.phone = "Masukkan nomor HP Indonesia yang valid.";
    }
    if (!values.username.trim()) nextErrors.username = "Username wajib diisi.";
    if (!isEdit && !values.password) nextErrors.password = "Password wajib diisi untuk data baru.";

    const normalizedUsername = values.username.trim();
    const duplicateUsername = employees.some((item) =>
      item.id !== employeeId &&
      item.username.toLocaleLowerCase("id-ID") === normalizedUsername.toLocaleLowerCase("id-ID"),
    );
    if (duplicateUsername) nextErrors.username = "Username sudah digunakan.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const savedEmployee: OwnerEmployee = {
      id: employeeId ?? `owner-employee-${crypto.randomUUID()}`,
      name: values.name.trim(),
      role: values.role,
      phone,
      username: normalizedUsername,
      hasPassword: Boolean(values.password) || employee?.hasPassword === true,
    };
    const saved = employeeId
      ? updateEmployee(savedEmployee)
      : addEmployee(savedEmployee);
    if (!saved) {
      setFormError("Data tidak dapat disimpan. Periksa nama dan username duplikat.");
      return;
    }

    announce(
      employeeId
        ? "Perubahan data karyawan disimpan pada prototipe browser."
        : "Data karyawan ditambahkan pada prototipe browser.",
    );
    router.push("/owner/kapster-kasir");
  }

  return (
    <div className="cashier-page owner-page">
      <OwnerPageHeading
        title="Form Data Kapster & Kasir"
        description="Isi data berikut untuk menambah atau mengubah kapster dan kasir."
      />
      <OwnerPrototypeNote>
        Data prototipe hanya menyimpan penanda password, bukan kata sandinya. Password baru tidak menjadi kredensial login.
      </OwnerPrototypeNote>
      <form className="cashier-form-panel owner-employee-form" onSubmit={submit} noValidate>
        <div className="cashier-field cashier-field--full">
          <label htmlFor="owner-employee-name">Nama Lengkap</label>
          <input
            aria-describedby={errors.name ? "owner-employee-name-error" : undefined}
            aria-invalid={Boolean(errors.name)}
            id="owner-employee-name"
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Masukkan nama lengkap"
            value={values.name}
          />
          {errors.name && <span className="cashier-field-error" id="owner-employee-name-error">{errors.name}</span>}
        </div>
        <div className="cashier-field">
          <label htmlFor="owner-employee-role">Peran</label>
          <select
            id="owner-employee-role"
            onChange={(event) => updateField("role", event.target.value)}
            value={values.role}
          >
            <option value="Kapster">Kapster</option>
            <option value="Kasir">Kasir</option>
          </select>
        </div>
        <div className="cashier-field">
          <label htmlFor="owner-employee-phone">Nomor HP</label>
          <input
            aria-describedby={errors.phone ? "owner-employee-phone-error" : undefined}
            aria-invalid={Boolean(errors.phone)}
            autoComplete="tel"
            id="owner-employee-phone"
            onChange={(event) => updateField("phone", event.target.value)}
            placeholder="Contoh: 081234567890"
            type="tel"
            value={values.phone}
          />
          {errors.phone && <span className="cashier-field-error" id="owner-employee-phone-error">{errors.phone}</span>}
        </div>
        <div className="cashier-field">
          <label htmlFor="owner-employee-username">Username</label>
          <input
            aria-describedby={errors.username ? "owner-employee-username-error" : undefined}
            aria-invalid={Boolean(errors.username)}
            autoComplete="username"
            id="owner-employee-username"
            onChange={(event) => updateField("username", event.target.value)}
            placeholder="Masukkan username"
            value={values.username}
          />
          {errors.username && <span className="cashier-field-error" id="owner-employee-username-error">{errors.username}</span>}
        </div>
        <div className="cashier-field">
          <label htmlFor="owner-employee-password">
            Password {isEdit && <span className="owner-optional-label">(kosongkan untuk mempertahankan)</span>}
          </label>
          <input
            aria-describedby={errors.password ? "owner-employee-password-error" : undefined}
            aria-invalid={Boolean(errors.password)}
            autoComplete="new-password"
            id="owner-employee-password"
            onChange={(event) => updateField("password", event.target.value)}
            placeholder={isEdit ? "Kosongkan jika tidak diubah" : "Masukkan password"}
            type="password"
            value={values.password}
          />
          {errors.password && <span className="cashier-field-error" id="owner-employee-password-error">{errors.password}</span>}
        </div>
        {formError && <p className="cashier-error-banner owner-form-error" role="alert">{formError}</p>}
        <div className="cashier-form-actions owner-form-actions">
          <Link className="cashier-button cashier-button--secondary" href="/owner/kapster-kasir">
            Batal
          </Link>
          <button className="cashier-button cashier-button--primary" type="submit">
            Simpan
          </button>
        </div>
      </form>
    </div>
  );
}
