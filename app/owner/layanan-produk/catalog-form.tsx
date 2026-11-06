"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useOwnerPrototype } from "../owner-context";
import type { OwnerCatalogItem, OwnerCatalogKind } from "../prototype-types";
import { OwnerPageHeading, OwnerPrototypeNote } from "../owner-ui";

type CatalogValues = {
  name: string;
  kind: OwnerCatalogKind | "";
  price: string;
  stock: string;
};

type CatalogField = keyof CatalogValues;

const blankValues: CatalogValues = { name: "", kind: "", price: "", stock: "" };

export default function OwnerCatalogForm({ itemId }: { itemId?: string }) {
  const router = useRouter();
  const { catalog, addCatalogItem, updateCatalogItem, announce } = useOwnerPrototype();
  const item = itemId ? catalog.find((entry) => entry.id === itemId) : undefined;
  const [values, setValues] = useState<CatalogValues>(() => item
    ? {
        name: item.name,
        kind: item.kind,
        price: item.price === null ? "" : String(item.price),
        stock: item.kind === "Produk" ? String(item.stock ?? 0) : "",
      }
    : blankValues);
  const [errors, setErrors] = useState<Partial<Record<CatalogField, string>>>({});
  const [formError, setFormError] = useState("");
  const isEdit = Boolean(itemId);

  if (isEdit && !item) {
    return (
      <div className="cashier-page owner-page">
        <OwnerPageHeading title="Form Data Layanan & Produk" />
        <div className="cashier-empty-state owner-empty-state">
          <h2>Data tidak ditemukan</h2>
          <p>Data mungkin sudah dihapus atau sesi prototipe telah dimulai ulang.</p>
          <Link className="cashier-button cashier-button--primary" href="/owner/layanan-produk">
            Kembali ke Data Layanan & Produk
          </Link>
        </div>
      </div>
    );
  }

  function updateField(field: CatalogField, value: string) {
    setValues((current) => ({
      ...current,
      [field]: value,
      ...(field === "kind" && value === "Layanan" ? { stock: "" } : {}),
    }));
    setErrors((current) => ({ ...current, [field]: undefined, ...(field === "kind" ? { stock: undefined } : {}) }));
    setFormError("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Partial<Record<CatalogField, string>> = {};
    if (!values.name.trim()) nextErrors.name = "Nama layanan atau produk wajib diisi.";
    if (values.kind !== "Layanan" && values.kind !== "Produk") {
      nextErrors.kind = "Pilih jenis layanan atau produk.";
    }
    const price = Number(values.price);
    if (!values.price || !Number.isSafeInteger(price) || price <= 0) {
      nextErrors.price = "Harga harus berupa angka Rupiah positif.";
    }
    let stock: number | undefined;
    if (values.kind === "Produk") {
      stock = Number(values.stock);
      if (values.stock === "" || !Number.isSafeInteger(stock) || stock < 0) {
        nextErrors.stock = "Stok wajib berupa bilangan bulat nol atau lebih.";
      }
    }
    const duplicateName = catalog.some((entry) =>
      entry.id !== itemId &&
      entry.name.trim().toLocaleLowerCase("id-ID") === values.name.trim().toLocaleLowerCase("id-ID"),
    );
    if (values.name.trim() && duplicateName) {
      nextErrors.name = "Nama layanan atau produk sudah digunakan.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (values.kind !== "Layanan" && values.kind !== "Produk") return;

    const savedItem: OwnerCatalogItem = {
      id: itemId ?? `owner-catalog-${crypto.randomUUID()}`,
      name: values.name.trim(),
      kind: values.kind,
      price,
      ...(values.kind === "Produk" ? { stock } : {}),
    };
    const saved = itemId
      ? updateCatalogItem(savedItem)
      : addCatalogItem(savedItem);
    if (!saved) {
      setFormError("Data tidak dapat disimpan. Periksa kemungkinan nama duplikat.");
      return;
    }
    announce(
      itemId
        ? "Perubahan katalog disimpan pada prototipe browser."
        : `${savedItem.kind} ditambahkan ke katalog prototipe.`,
    );
    router.push("/owner/layanan-produk");
  }

  return (
    <div className="cashier-page owner-page">
      <OwnerPageHeading
        title="Form Data Layanan & Produk"
        description="Isi data berikut untuk menambah atau mengubah layanan & produk."
      />
      <OwnerPrototypeNote>
        Harga dan stok di halaman ini adalah data prototipe Owner, belum mengubah katalog Pelanggan atau sistem penjualan.
      </OwnerPrototypeNote>
      <form className="cashier-form-panel owner-catalog-form" onSubmit={submit} noValidate>
        <div className="cashier-field cashier-field--full">
          <label htmlFor="owner-catalog-name">Nama Layanan / Produk</label>
          <input
            aria-describedby={errors.name ? "owner-catalog-name-error" : undefined}
            aria-invalid={Boolean(errors.name)}
            id="owner-catalog-name"
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Masukkan nama layanan atau produk"
            value={values.name}
          />
          {errors.name && <span className="cashier-field-error" id="owner-catalog-name-error">{errors.name}</span>}
        </div>
        <div className="cashier-field">
          <label htmlFor="owner-catalog-kind">Jenis</label>
          <select
            aria-describedby={errors.kind ? "owner-catalog-kind-error" : undefined}
            aria-invalid={Boolean(errors.kind)}
            id="owner-catalog-kind"
            onChange={(event) => updateField("kind", event.target.value)}
            value={values.kind}
          >
            <option value="">Pilih jenis</option>
            <option value="Layanan">Layanan</option>
            <option value="Produk">Produk</option>
          </select>
          {errors.kind && <span className="cashier-field-error" id="owner-catalog-kind-error">{errors.kind}</span>}
        </div>
        <div className="cashier-field">
          <label htmlFor="owner-catalog-price">Harga (Rp)</label>
          <input
            aria-describedby={errors.price ? "owner-catalog-price-error" : undefined}
            aria-invalid={Boolean(errors.price)}
            id="owner-catalog-price"
            min="1"
            onChange={(event) => updateField("price", event.target.value)}
            placeholder="Contoh: 50000"
            step="1"
            type="number"
            value={values.price}
          />
          {errors.price && <span className="cashier-field-error" id="owner-catalog-price-error">{errors.price}</span>}
        </div>
        {values.kind === "Produk" && (
          <div className="cashier-field">
            <label htmlFor="owner-catalog-stock">Stok</label>
            <input
              aria-describedby={errors.stock ? "owner-catalog-stock-error" : undefined}
              aria-invalid={Boolean(errors.stock)}
              id="owner-catalog-stock"
              min="0"
              onChange={(event) => updateField("stock", event.target.value)}
              placeholder="Contoh: 0"
              step="1"
              type="number"
              value={values.stock}
            />
            {errors.stock && <span className="cashier-field-error" id="owner-catalog-stock-error">{errors.stock}</span>}
          </div>
        )}
        {formError && <p className="cashier-error-banner owner-form-error" role="alert">{formError}</p>}
        <div className="cashier-form-actions owner-form-actions">
          <Link className="cashier-button cashier-button--secondary" href="/owner/layanan-produk">
            Batal
          </Link>
          <button className="cashier-button cashier-button--primary" type="submit">
            {isEdit ? "Simpan Perubahan" : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}
