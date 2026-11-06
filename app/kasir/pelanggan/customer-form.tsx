"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useCashierPrototype } from "../cashier-context";
import { CashierPageHeading, CashierPrototypeNote } from "../cashier-ui";
import type { CashierCustomer } from "../prototype-types";

type CustomerValues = Omit<CashierCustomer, "id">;
type CustomerField = keyof CustomerValues;

const fieldLabels: Record<CustomerField, string> = {
  name: "Nama Pelanggan",
  phone: "No HP",
  email: "Email",
  note: "Catatan (Opsional)",
};

const emptyValues: CustomerValues = {
  name: "",
  phone: "",
  email: "",
  note: "",
};

export default function CashierCustomerForm({
  customerId,
}: {
  customerId?: string;
}) {
  const router = useRouter();
  const { customers, addCustomer, updateCustomer, announce } =
    useCashierPrototype();
  const customer = customerId
    ? customers.find((item) => item.id === customerId)
    : undefined;
  const [values, setValues] = useState<CustomerValues>(() =>
    customer
      ? {
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          note: customer.note,
        }
      : emptyValues,
  );
  const [errors, setErrors] = useState<Partial<Record<CustomerField, string>>>({});
  const [formError, setFormError] = useState("");
  const isEdit = Boolean(customerId);

  if (isEdit && !customer) {
    return (
      <div className="cashier-page">
        <CashierPageHeading title="Ubah Data Pelanggan" />
        <div className="cashier-empty-state">
          <h2>Data pelanggan tidak ditemukan</h2>
          <p>Data mungkin sudah dihapus atau sesi prototipe telah dimulai ulang.</p>
          <Link className="cashier-button cashier-button--primary" href="/kasir/pelanggan">
            Kembali ke Data Pelanggan
          </Link>
        </div>
      </div>
    );
  }

  function updateField(field: CustomerField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Partial<Record<CustomerField, string>> = {};
    if (!values.name.trim()) {
      nextErrors.name = "Nama pelanggan wajib diisi.";
    }

    const normalizedPhone = values.phone.replace(/[\s()-]/g, "");
    if (!normalizedPhone) {
      nextErrors.phone = "Nomor HP wajib diisi.";
    } else if (!/^(?:\+?62|0)8\d{8,11}$/.test(normalizedPhone)) {
      nextErrors.phone = "Masukkan nomor HP Indonesia yang valid.";
    }

    if (!values.email.trim()) {
      nextErrors.email = "Email wajib diisi.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      nextErrors.email = "Masukkan alamat email yang valid.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const savedCustomer: CashierCustomer = {
      id: customerId ?? `pelanggan-${crypto.randomUUID()}`,
      name: values.name.trim(),
      phone: normalizedPhone,
      email: values.email.trim(),
      note: values.note.trim(),
    };

    if (customerId) {
      if (!updateCustomer(savedCustomer)) {
        setFormError("Data pelanggan tidak dapat diubah karena tidak ditemukan.");
        return;
      }
      announce("Perubahan data pelanggan disimpan pada state prototipe.");
    } else {
      addCustomer(savedCustomer);
      announce("Data pelanggan ditambahkan pada state prototipe.");
    }
    router.push("/kasir/pelanggan");
  }

  return (
    <div className="cashier-page">
      <CashierPageHeading
        title={isEdit ? "Ubah Data Pelanggan" : "Tambah Data Pelanggan"}
        description={
          isEdit
            ? "Perbarui informasi pelanggan pada prototipe."
            : "Lengkapi informasi pelanggan untuk ditambahkan ke prototipe."
        }
      />
      <CashierPrototypeNote>
        Data hanya disimpan sementara di browser dan tidak dikirim ke database.
      </CashierPrototypeNote>
      <form className="cashier-form-panel cashier-customer-form" onSubmit={submit} noValidate>
        {(Object.keys(fieldLabels) as CustomerField[]).map((field) => {
          const error = errors[field];
          const inputId = `customer-${field}`;
          return (
            <div className="cashier-field" key={field}>
              <label htmlFor={inputId}>{fieldLabels[field]}</label>
              {field === "note" ? (
                <textarea
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `${inputId}-error` : undefined}
                  id={inputId}
                  onChange={(event) => updateField(field, event.target.value)}
                  placeholder="Catatan tambahan (opsional)"
                  rows={4}
                  value={values.note}
                />
              ) : (
                <input
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `${inputId}-error` : undefined}
                  autoComplete={field === "name" ? "name" : field === "phone" ? "tel" : "email"}
                  id={inputId}
                  onChange={(event) => updateField(field, event.target.value)}
                  placeholder={
                    field === "name"
                      ? "Masukkan nama lengkap"
                      : field === "phone"
                        ? "Contoh: 081234567890"
                        : "nama@email.com"
                  }
                  type={field === "email" ? "email" : "text"}
                  value={values[field]}
                />
              )}
              {error && (
                <span className="cashier-field-error" id={`${inputId}-error`}>
                  {error}
                </span>
              )}
            </div>
          );
        })}
        {formError && <p className="cashier-error-banner" role="alert">{formError}</p>}
        <div className="cashier-form-actions">
          <Link
            className="cashier-button cashier-button--secondary"
            href="/kasir/pelanggan"
          >
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
