"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAppFeedback } from "../../components/app-feedback";
import { CashierPageHeading, CashierPrototypeNote } from "../cashier-ui";

type CustomerValues = {
  name: string;
  phone: string;
  email: string;
  address: string;
};

type CustomerField = keyof CustomerValues;

const fieldLabels: Record<CustomerField, string> = {
  name: "Nama Pelanggan",
  phone: "No HP",
  email: "Email",
  address: "Alamat",
};

const emptyValues: CustomerValues = {
  name: "",
  phone: "",
  email: "",
  address: "",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCustomer(value: unknown): value is CustomerValues & { id: string } {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.phone === "string" &&
    typeof value.email === "string" &&
    typeof value.address === "string"
  );
}

function responseMessage(value: unknown, fallback: string) {
  return isRecord(value) && typeof value.message === "string"
    ? value.message
    : fallback;
}

export default function CashierCustomerForm({
  customerId,
}: {
  customerId?: string;
}) {
  const router = useRouter();
  const { showToast } = useAppFeedback();

  const isEdit = Boolean(customerId);

  const [values, setValues] = useState<CustomerValues>(emptyValues);
  const [errors, setErrors] = useState<
    Partial<Record<CustomerField, string>>
  >({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const loadCustomer = useCallback(async () => {
    if (!customerId) return;

    setLoading(true);
    setFormError("");

    try {
      const response = await fetch(
        `/api/kasir/pelanggan/${encodeURIComponent(customerId ?? "")}`,
        { cache: "no-store" },
      );

      const result: unknown = await response.json();

      if (
        !response.ok ||
        !isRecord(result) ||
        !isCustomer(result.customer)
      ) {
        throw new Error(
          responseMessage(result, "Data pelanggan tidak ditemukan."),
        );
      }

      setValues({
        name: result.customer.name,
        phone: result.customer.phone,
        email: result.customer.email,
        address: result.customer.address,
      });
    } catch (loadError) {
      setFormError(
        loadError instanceof Error
          ? loadError.message
          : "Data pelanggan tidak dapat dimuat.",
      );
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (!customerId) return;

    let active = true;

    async function load() {
      setLoading(true);
      setFormError("");

      try {
        const response = await fetch(
          `/api/kasir/pelanggan/${encodeURIComponent(customerId ?? "")}`,
          { cache: "no-store" },
        );

        const result: unknown = await response.json();

        if (
          !response.ok ||
          !isRecord(result) ||
          !isCustomer(result.customer)
        ) {
          throw new Error(
            responseMessage(result, "Data pelanggan tidak ditemukan."),
          );
        }

        if (active) {
          setValues({
            name: result.customer.name,
            phone: result.customer.phone,
            email: result.customer.email,
            address: result.customer.address,
          });
        }
      } catch (loadError) {
        if (active) {
          setFormError(
            loadError instanceof Error
              ? loadError.message
              : "Data pelanggan tidak dapat dimuat.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [customerId]);

  function updateField(field: CustomerField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Partial<Record<CustomerField, string>> = {};

    if (!values.name.trim()) {
      nextErrors.name = "Nama pelanggan wajib diisi.";
    } else if (values.name.trim().length > 100) {
      nextErrors.name = "Nama pelanggan maksimal 100 karakter.";
    }

    const normalizedPhone = values.phone.replace(/[\s()-]/g, "");

    if (!normalizedPhone) {
      nextErrors.phone = "Nomor HP wajib diisi.";
    } else if (!/^(?:\+?62|0)8\d{8,11}$/.test(normalizedPhone)) {
      nextErrors.phone = "Masukkan nomor HP Indonesia yang valid.";
    }

    const normalizedEmail = values.email.trim().toLowerCase();

    if (!normalizedEmail) {
      nextErrors.email = "Email wajib diisi.";
    } else if (
      normalizedEmail.length > 100 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      nextErrors.email = "Masukkan alamat email yang valid.";
    }

    if (!values.address.trim()) {
      nextErrors.address = "Alamat pelanggan wajib diisi.";
    } else if (values.address.trim().length > 500) {
      nextErrors.address = "Alamat maksimal 500 karakter.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setFormError("");

    try {
      const response = await fetch(
        typeof customerId === "string" && customerId.length > 0
          ? `/api/kasir/pelanggan/${encodeURIComponent(customerId ?? "")}`
          : "/api/kasir/pelanggan",
        {
          method: customerId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: values.name.trim(),
            phone: normalizedPhone,
            email: normalizedEmail,
            address: values.address.trim(),
          }),
        },
      );

      const result: unknown = await response.json();

      if (
        !response.ok ||
        !isRecord(result) ||
        result.success !== true ||
        !isCustomer(result.customer)
      ) {
        throw new Error(
          responseMessage(result, "Data pelanggan gagal disimpan."),
        );
      }

      const savedCustomer = result.customer;

      showToast(
        customerId ? "Data Pelanggan Diperbarui" : "Pelanggan Berhasil Ditambahkan",
        `${savedCustomer.name} berhasil disimpan ke PostgreSQL.`,
        "success",
      );

      router.push("/kasir/pelanggan");
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Data pelanggan gagal disimpan.";

      setFormError(message);

      showToast("Penyimpanan Gagal", message, "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="cashier-page">
        <CashierPageHeading
          title="Ubah Data Pelanggan"
          description="Mengambil data pelanggan dari database."
        />
        <div className="cashier-empty-state" aria-busy="true">
          <p>Memuat data pelanggan...</p>
        </div>
      </div>
    );
  }

  if (isEdit && formError && !values.name) {
    return (
      <div className="cashier-page">
        <CashierPageHeading title="Ubah Data Pelanggan" />
        <div className="cashier-empty-state" role="alert">
          <h2>Data pelanggan tidak dapat dimuat</h2>
          <p>{formError}</p>
          <button
            className="cashier-button cashier-button--secondary"
            onClick={() => void loadCustomer()}
            type="button"
          >
            Coba lagi
          </button>
          <Link
            className="cashier-button cashier-button--primary"
            href="/kasir/pelanggan"
          >
            Kembali ke Data Pelanggan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cashier-page">
      <CashierPageHeading
        title={isEdit ? "Ubah Data Pelanggan" : "Tambah Data Pelanggan"}
        description={
          isEdit
            ? "Perbarui informasi pelanggan yang tersimpan di database."
            : "Lengkapi informasi pelanggan untuk disimpan ke database."
        }
      />

      <CashierPrototypeNote>
        Data pelanggan akan disimpan langsung ke PostgreSQL. Nomor HP dan
        email harus unik.
      </CashierPrototypeNote>

      <form
        className="cashier-form-panel cashier-customer-form"
        onSubmit={submit}
        noValidate
      >
        {(Object.keys(fieldLabels) as CustomerField[]).map((field) => {
          const error = errors[field];
          const inputId = `customer-${field}`;

          return (
            <div className="cashier-field" key={field}>
              <label htmlFor={inputId}>{fieldLabels[field]}</label>

              {field === "address" ? (
                <textarea
                  aria-invalid={Boolean(error)}
                  aria-describedby={
                    error ? `${inputId}-error` : undefined
                  }
                  id={inputId}
                  onChange={(event) =>
                    updateField(field, event.target.value)
                  }
                  placeholder="Masukkan alamat lengkap pelanggan"
                  rows={4}
                  value={values.address}
                />
              ) : (
                <input
                  aria-invalid={Boolean(error)}
                  aria-describedby={
                    error ? `${inputId}-error` : undefined
                  }
                  autoComplete={
                    field === "name"
                      ? "name"
                      : field === "phone"
                        ? "tel"
                        : "email"
                  }
                  id={inputId}
                  onChange={(event) =>
                    updateField(field, event.target.value)
                  }
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
                <span
                  className="cashier-field-error"
                  id={`${inputId}-error`}
                >
                  {error}
                </span>
              )}
            </div>
          );
        })}

        {formError && (
          <p className="cashier-error-banner" role="alert">
            {formError}
          </p>
        )}

        <div className="cashier-form-actions">
          <Link
            className="cashier-button cashier-button--secondary"
            href="/kasir/pelanggan"
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
    </div>
  );
}
