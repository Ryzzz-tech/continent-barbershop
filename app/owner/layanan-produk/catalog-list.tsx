"use client";

import Link from "next/link";
import { useState } from "react";
import ConfirmDialog from "../../components/confirm-dialog";
import { useAppFeedback } from "../../components/app-feedback";
import { formatRupiah } from "../../pelanggan/data";
import { useOwnerPrototype } from "../owner-context";
import { OwnerPageHeading, OwnerPrototypeNote } from "../owner-ui";

export default function OwnerCatalogList() {
  const { catalog, deleteCatalogItem } = useOwnerPrototype();
  const { showToast } = useAppFeedback();
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    name: string;
    kind: string;
  } | null>(null);

  function removeItem() {
    if (!itemToDelete) return false;
    if (deleteCatalogItem(itemToDelete.id)) {
      showToast(
        "Data Berhasil Dihapus",
        `${itemToDelete.kind} ${itemToDelete.name} berhasil dihapus.`,
        "success",
      );
      return true;
    }
    showToast(
      "Penghapusan Gagal",
      "Data katalog tidak dapat dihapus. Periksa kembali data atau penyimpanan browser.",
      "error",
    );
    return false;
  }

  return (
    <div className="cashier-page owner-page">
      <OwnerPageHeading
        title="Data Layanan & Produk"
        description="Kelola daftar layanan dan produk barbershop."
      >
        <Link className="cashier-button cashier-button--primary" href="/owner/layanan-produk/tambah">
          + Tambah Data
        </Link>
      </OwnerPageHeading>
      <OwnerPrototypeNote>
        Katalog layanan yang dikelola di sini juga digunakan pada halaman Pelanggan.
        Produk dikelola terpisah dari layanan.
      </OwnerPrototypeNote>
      <section className="cashier-panel owner-table-panel">
        <div className="cashier-table-scroll owner-table-scroll">
          <table className="cashier-table owner-table">
            <thead>
              <tr>
                <th scope="col">No.</th>
                <th scope="col">Nama</th>
                <th scope="col">Jenis</th>
                <th scope="col">Harga</th>
                <th scope="col">Stok</th>
                <th scope="col">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {catalog.map((item, index) => (
                <tr key={item.id}>
                  <td>{String(index + 1).padStart(2, "0")}</td>
                  <td>{item.name}</td>
                  <td>{item.kind}</td>
                  <td>{item.price === null ? "Belum ditentukan" : formatRupiah(item.price)}</td>
                  <td>{item.kind === "Produk" ? item.stock ?? 0 : "—"}</td>
                  <td>
                    <div className="owner-row-actions">
                      <Link
                        className="cashier-row-action"
                        href={`/owner/layanan-produk/${encodeURIComponent(item.id)}/ubah`}
                      >
                        Ubah
                      </Link>
                      <button
                        className="cashier-row-action cashier-row-action--danger"
                        onClick={() =>
                          setItemToDelete({
                            id: item.id,
                            name: item.name,
                            kind: item.kind,
                          })
                        }
                        type="button"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {catalog.length === 0 && (
          <div className="cashier-empty-state owner-empty-state">
            <p>Belum ada layanan atau produk dalam katalog.</p>
            <Link className="cashier-button cashier-button--primary" href="/owner/layanan-produk/tambah">
              Tambah Data
            </Link>
          </div>
        )}
      </section>
      {itemToDelete && (
        <ConfirmDialog
          title="Konfirmasi Penghapusan"
          description={`Apakah Anda yakin ingin menghapus ${itemToDelete.kind.toLocaleLowerCase("id-ID")} "${itemToDelete.name}"?`}
          detail={
            itemToDelete.kind === "Produk"
              ? "Data produk dan riwayat restock terkait tidak dapat dikembalikan."
              : undefined
          }
          onClose={() => setItemToDelete(null)}
          onConfirm={removeItem}
        />
      )}
    </div>
  );
}
