"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { OwnerPageHeading, OwnerPrototypeNote } from "../owner-ui";

type CatalogKind = "Layanan" | "Produk";

type CatalogValues = {
  name: string;
  kind: CatalogKind | "";
  price: string;
  duration: string;
  unit: string;
};

type CatalogField = keyof CatalogValues;

type CatalogRecord = {
  id: string;
  name: string;
  kind: CatalogKind;
  price: number;
  duration?: number;
  stock?: number;
  unit?: string;
  isActive: boolean;
};

const blankValues: CatalogValues = {
  name: "",
  kind: "",
  price: "",
  duration: "",
  unit: "",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCatalogRecord(value: unknown): value is CatalogRecord {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    (value.kind !== "Layanan" && value.kind !== "Produk") ||
    typeof value.price !== "number" ||
    typeof value.isActive !== "boolean"
  ) {
    return false;
  }

  if (value.kind === "Layanan") {
    return typeof value.duration === "number";
  }

  return (
    typeof value.stock === "number" &&
    typeof value.unit === "string"
  );
}

function getErrorMessage(value: unknown, fallback: string) {
  return isRecord(value) && typeof value.message === "string"
    ? value.message
    : fallback;
}

export default function OwnerCatalogForm({
  itemId,
}: {
  itemId?: string;
}) {
  const router = useRouter();
  const isEdit = Boolean(itemId);

  const [values, setValues] = useState<CatalogValues>(blankValues);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [errors, setErrors] = useState<
    Partial<Record<CatalogField, string>>
  >({});
  const [itemActive, setItemActive] = useState(true);

  useEffect(() => {
    if (!itemId) return;

    const currentItemId: string = itemId;
    let cancelled = false;

    async function loadItem() {
      setLoading(true);
      setFormError("");

      try {
        const response = await fetch(
          `/api/owner/catalog/${encodeURIComponent(currentItemId)}`,
          { cache: "no-store" },
        );

        const result: unknown = await response.json();

        if (
          !response.ok ||
          !isRecord(result) ||
          !isCatalogRecord(result.item)
        ) {
          throw new Error(
            getErrorMessage(result, "Data katalog tidak dapat dimuat."),
          );
        }

        if (cancelled) return;

        const item = result.item;

        setValues({
          name: item.name,
          kind: item.kind,
          price: String(item.price),
          duration:
            item.kind === "Layanan" ? String(item.duration) : "",
          unit: item.kind === "Produk" ? item.unit ?? "" : "",
        });

        setItemActive(item.isActive);
      } catch (error) {
        if (!cancelled) {
          setFormError(
            error instanceof Error
              ? error.message
              : "Data katalog tidak dapat dimuat.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadItem();

    return () => {
      cancelled = true;
    };
  }, [itemId]);

  function updateField(field: CatalogField, value: string) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));

    setFormError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving || loading) return;

    const nextErrors: Partial<Record<CatalogField, string>> = {};

    if (!values.name.trim()) {
      nextErrors.name = "Nama layanan atau produk wajib diisi.";
    } else if (values.name.trim().length > 100) {
      nextErrors.name = "Nama maksimal 100 karakter.";
    }

    if (values.kind !== "Layanan" && values.kind !== "Produk") {
      nextErrors.kind = "Pilih jenis layanan atau produk.";
    }

    const price = Number(values.price);

    if (
      values.price.trim() === "" ||
      !Number.isSafeInteger(price) ||
      price <= 0 ||
      price > 9_999_999_999
    ) {
      nextErrors.price = "Harga harus berupa bilangan Rupiah positif.";
    }

    let duration: number | undefined;

    if (values.kind === "Layanan") {
      duration = Number(values.duration);

      if (
        values.duration.trim() === "" ||
        !Number.isSafeInteger(duration) ||
        duration < 1 ||
        duration > 1440
      ) {
        nextErrors.duration =
          "Durasi harus berupa bilangan bulat 1–1440 menit.";
      }
    }

    if (values.kind === "Produk") {
      if (!values.unit.trim()) {
        nextErrors.unit = "Satuan produk wajib diisi.";
      } else if (values.unit.trim().length > 20) {
        nextErrors.unit = "Satuan maksimal 20 karakter.";
      }
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;
    if (values.kind !== "Layanan" && values.kind !== "Produk") return;

    const payload = {
      name: values.name.trim(),
      kind: values.kind,
      price,
      ...(values.kind === "Layanan"
        ? { duration }
        : { unit: values.unit.trim() }),
    };

    setSaving(true);
    setFormError("");

    try {
      const endpoint = isEdit
        ? `/api/owner/catalog/${encodeURIComponent(itemId!)}`
        : "/api/owner/catalog";

      const response = await fetch(endpoint, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result: unknown = await response.json();

      if (!response.ok || !isRecord(result) || result.success !== true) {
        throw new Error(
          getErrorMessage(result, "Data katalog gagal disimpan."),
        );
      }

      router.push("/owner/layanan-produk");
      router.refresh();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menyimpan katalog.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="cashier-page owner-page">
      <OwnerPageHeading
        title={
          isEdit
            ? "Ubah Data Layanan & Produk"
            : "Tambah Data Layanan & Produk"
        }
        description="Isi informasi layanan atau produk sesuai jenis yang dipilih."
      />

      <OwnerPrototypeNote>
        Data disimpan langsung ke PostgreSQL. Harga dan durasi layanan
        digunakan pada katalog serta booking pelanggan. Stok produk hanya
        bertambah melalui menu Restock Produk dan tidak diubah melalui
        formulir ini.
      </OwnerPrototypeNote>

      {isEdit && values.kind === "Layanan" && !itemActive && (
        <div className="cashier-error-banner" role="status">
          Layanan ini sedang nonaktif. Penyuntingan nama, harga, atau
          durasi tidak otomatis mengaktifkannya kembali.
        </div>
      )}

      {loading ? (
        <div className="cashier-empty-state owner-empty-state">
          Memuat data katalog...
        </div>
      ) : (
        <form
          className="cashier-form-panel owner-catalog-form"
          onSubmit={submit}
          noValidate
        >
          <div className="cashier-field cashier-field--full">
            <label htmlFor="owner-catalog-name">
              Nama Layanan / Produk
            </label>
            <input
              aria-describedby={
                errors.name ? "owner-catalog-name-error" : undefined
              }
              aria-invalid={Boolean(errors.name)}
              id="owner-catalog-name"
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Masukkan nama layanan atau produk"
              value={values.name}
            />
            {errors.name && (
              <span
                className="cashier-field-error"
                id="owner-catalog-name-error"
              >
                {errors.name}
              </span>
            )}
          </div>

          <div className="cashier-field">
            <label htmlFor="owner-catalog-kind">Jenis</label>
            <select
              aria-describedby={
                errors.kind ? "owner-catalog-kind-error" : undefined
              }
              aria-invalid={Boolean(errors.kind)}
              disabled={isEdit}
              id="owner-catalog-kind"
              onChange={(event) =>
                updateField("kind", event.target.value as CatalogKind | "")
              }
              value={values.kind}
            >
              <option value="">Pilih jenis</option>
              <option value="Layanan">Layanan</option>
              <option value="Produk">Produk</option>
            </select>
            {isEdit && (
              <span className="owner-optional-label">
                Jenis katalog tidak dapat diubah setelah dibuat.
              </span>
            )}
            {errors.kind && (
              <span
                className="cashier-field-error"
                id="owner-catalog-kind-error"
              >
                {errors.kind}
              </span>
            )}
          </div>

          <div className="cashier-field">
            <label htmlFor="owner-catalog-price">Harga (Rp)</label>
            <input
              aria-describedby={
                errors.price ? "owner-catalog-price-error" : undefined
              }
              aria-invalid={Boolean(errors.price)}
              id="owner-catalog-price"
              min="1"
              onChange={(event) => updateField("price", event.target.value)}
              placeholder="Contoh: 50000"
              step="1"
              type="number"
              value={values.price}
            />
            {errors.price && (
              <span
                className="cashier-field-error"
                id="owner-catalog-price-error"
              >
                {errors.price}
              </span>
            )}
          </div>

          {values.kind === "Layanan" && (
            <div className="cashier-field">
              <label htmlFor="owner-catalog-duration">
                Durasi (Menit)
              </label>
              <input
                aria-describedby={
                  errors.duration
                    ? "owner-catalog-duration-error"
                    : undefined
                }
                aria-invalid={Boolean(errors.duration)}
                id="owner-catalog-duration"
                min="1"
                max="1440"
                onChange={(event) =>
                  updateField("duration", event.target.value)
                }
                placeholder="Contoh: 30"
                step="1"
                type="number"
                value={values.duration}
              />
              {errors.duration && (
                <span
                  className="cashier-field-error"
                  id="owner-catalog-duration-error"
                >
                  {errors.duration}
                </span>
              )}
            </div>
          )}

          {values.kind === "Produk" && (
            <div className="cashier-field">
              <label htmlFor="owner-catalog-unit">Satuan Produk</label>
              <input
                aria-describedby={
                  errors.unit ? "owner-catalog-unit-error" : undefined
                }
                aria-invalid={Boolean(errors.unit)}
                id="owner-catalog-unit"
                maxLength={20}
                onChange={(event) =>
                  updateField("unit", event.target.value)
                }
                placeholder="Contoh: pcs atau botol"
                value={values.unit}
              />
              {errors.unit && (
                <span
                  className="cashier-field-error"
                  id="owner-catalog-unit-error"
                >
                  {errors.unit}
                </span>
              )}
            </div>
          )}

          {values.kind === "Produk" && (
            <div className="cashier-field cashier-field--full">
              <label>Stok Produk</label>
              <input disabled value="Dikelola melalui menu Restock Produk" />
              <span className="owner-optional-label">
                Stok saat ini tidak dapat diubah melalui formulir katalog.
              </span>
            </div>
          )}

          {formError && (
            <p className="cashier-error-banner owner-form-error" role="alert">
              {formError}
            </p>
          )}

          <div className="cashier-form-actions owner-form-actions">
            <Link
              className="cashier-button cashier-button--secondary"
              href="/owner/layanan-produk"
            >
              Batal
            </Link>
            <button
              className="cashier-button cashier-button--primary"
              disabled={saving}
              type="submit"
            >
              {saving
                ? "Menyimpan..."
                : isEdit
                  ? "Simpan Perubahan"
                  : "Simpan"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
