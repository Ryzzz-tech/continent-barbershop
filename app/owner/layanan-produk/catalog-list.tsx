"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ConfirmDialog from "../../components/confirm-dialog";
import { useAppFeedback } from "../../components/app-feedback";
import { formatRupiah } from "../../pelanggan/data";
import { OwnerPageHeading, OwnerPrototypeNote } from "../owner-ui";

type CatalogKind = "Layanan" | "Produk";

type CatalogItem = {
  id: string;
  name: string;
  kind: CatalogKind;
  price: number;
  duration?: number;
  stock?: number;
  unit?: string;
  isActive: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCatalogItem(value: unknown): value is CatalogItem {
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
    return (
      typeof value.duration === "number" &&
      Number.isSafeInteger(value.duration)
    );
  }

  return (
    typeof value.stock === "number" &&
    Number.isSafeInteger(value.stock) &&
    typeof value.unit === "string"
  );
}

function getErrorMessage(value: unknown, fallback: string) {
  return isRecord(value) && typeof value.message === "string"
    ? value.message
    : fallback;
}

export default function OwnerCatalogList() {
  const { showToast } = useAppFeedback();

  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    name: string;
    kind: CatalogKind;
    isActive: boolean;
  } | null>(null);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/owner/catalog", {
        cache: "no-store",
      });

      const result: unknown = await response.json();

      if (
        !response.ok ||
        !isRecord(result) ||
        !Array.isArray(result.catalog) ||
        !result.catalog.every(isCatalogItem)
      ) {
        throw new Error(
          getErrorMessage(result, "Data katalog tidak dapat dimuat."),
        );
      }

      setCatalog(result.catalog);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Data katalog tidak dapat dimuat.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadCatalog);
  }, [loadCatalog]);

  async function removeItem(): Promise<boolean> {
    if (!itemToDelete) return false;

    try {
      const response = await fetch(
        `/api/owner/catalog/${encodeURIComponent(itemToDelete.id)}`,
        { method: "DELETE" },
      );

      const result: unknown = await response.json();

      if (!response.ok || !isRecord(result) || result.success !== true) {
        throw new Error(
          getErrorMessage(result, "Data katalog tidak dapat diproses."),
        );
      }

      showToast(
        "Pengelolaan Katalog Berhasil",
        getErrorMessage(
          result,
          `${itemToDelete.kind} berhasil diproses.`,
        ),
        "success",
      );

      await loadCatalog();
      return true;
    } catch (deleteError) {
      showToast(
        itemToDelete.kind === "Layanan"
          ? "Penonaktifan Gagal"
          : "Penghapusan Gagal",
        deleteError instanceof Error
          ? deleteError.message
          : "Data katalog tidak dapat diproses.",
        "error",
      );

      return false;
    }
  }

  return (
    <div className="cashier-page owner-page">
      <OwnerPageHeading
        title="Data Layanan & Produk"
        description="Kelola daftar layanan dan produk barbershop."
      >
        <Link
          className="cashier-button cashier-button--primary"
          href="/owner/layanan-produk/tambah"
        >
          + Tambah Data
        </Link>
      </OwnerPageHeading>

      <OwnerPrototypeNote>
        Data katalog diambil langsung dari PostgreSQL. Layanan aktif
        digunakan pada halaman Pelanggan dan formulir booking. Penambahan
        stok produk dilakukan melalui menu Restock Produk.
      </OwnerPrototypeNote>

      {error && (
        <div className="cashier-error-banner" role="alert">
          {error}
          <button
            className="cashier-text-link"
            onClick={() => void loadCatalog()}
            type="button"
          >
            Coba lagi
          </button>
        </div>
      )}

      <section className="cashier-panel owner-table-panel">
        <div className="cashier-table-scroll owner-table-scroll">
          <table className="cashier-table owner-table">
            <thead>
              <tr>
                <th scope="col">No.</th>
                <th scope="col">ID</th>
                <th scope="col">Nama</th>
                <th scope="col">Jenis</th>
                <th scope="col">Harga</th>
                <th scope="col">Durasi / Stok</th>
                <th scope="col">Status</th>
                <th scope="col">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8}>Memuat data katalog...</td>
                </tr>
              ) : (
                catalog.map((item, index) => (
                  <tr key={item.id}>
                    <td>{String(index + 1).padStart(2, "0")}</td>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>{item.kind}</td>
                    <td>{formatRupiah(item.price)}</td>
                    <td>
                      {item.kind === "Layanan"
                        ? `${item.duration} menit`
                        : `${item.stock} ${item.unit}`}
                    </td>
                    <td>
                      {item.kind === "Layanan"
                        ? item.isActive
                          ? "Aktif"
                          : "Nonaktif"
                        : "—"}
                    </td>
                    <td>
                      <div className="owner-row-actions">
                        <Link
                          className="cashier-row-action"
                          href={`/owner/layanan-produk/${encodeURIComponent(item.id)}/ubah`}
                        >
                          Ubah
                        </Link>

                        {item.kind === "Layanan" ? (
                          <button
                            className="cashier-row-action cashier-row-action--danger"
                            disabled={!item.isActive}
                            onClick={() =>
                              setItemToDelete({
                                id: item.id,
                                name: item.name,
                                kind: item.kind,
                                isActive: item.isActive,
                              })
                            }
                            type="button"
                          >
                            {item.isActive ? "Nonaktifkan" : "Nonaktif"}
                          </button>
                        ) : (
                          <button
                            className="cashier-row-action cashier-row-action--danger"
                            onClick={() =>
                              setItemToDelete({
                                id: item.id,
                                name: item.name,
                                kind: item.kind,
                                isActive: item.isActive,
                              })
                            }
                            type="button"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && catalog.length === 0 && !error && (
          <div className="cashier-empty-state owner-empty-state">
            <p>Belum ada layanan atau produk dalam katalog.</p>
            <Link
              className="cashier-button cashier-button--primary"
              href="/owner/layanan-produk/tambah"
            >
              Tambah Data
            </Link>
          </div>
        )}
      </section>

      {itemToDelete && (
        <ConfirmDialog
          title={
            itemToDelete.kind === "Layanan"
              ? "Konfirmasi Penonaktifan Layanan"
              : "Konfirmasi Penghapusan Produk"
          }
          description={
            itemToDelete.kind === "Layanan"
              ? `Apakah Anda yakin ingin menonaktifkan layanan "${itemToDelete.name}"?`
              : `Apakah Anda yakin ingin menghapus produk "${itemToDelete.name}"?`
          }
          detail={
            itemToDelete.kind === "Layanan"
              ? "Layanan tidak akan muncul pada katalog pelanggan dan pilihan booking baru. Riwayat booking serta transaksi tetap dipertahankan."
              : "Produk hanya dapat dihapus jika stok nol dan belum memiliki riwayat restock atau transaksi."
          }
          confirmLabel={
            itemToDelete.kind === "Layanan"
              ? "Ya, Nonaktifkan"
              : "Ya, Hapus Produk"
          }
          onClose={() => setItemToDelete(null)}
          onConfirm={removeItem}
        />
      )}
    </div>
  );
}
