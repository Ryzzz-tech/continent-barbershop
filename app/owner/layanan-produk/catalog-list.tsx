"use client";

import Link from "next/link";
import { formatRupiah } from "../../pelanggan/data";
import { useOwnerPrototype } from "../owner-context";
import { OwnerPageHeading, OwnerPrototypeNote } from "../owner-ui";

export default function OwnerCatalogList() {
  const { catalog, deleteCatalogItem, announce } = useOwnerPrototype();

  function removeItem(id: string, name: string) {
    if (!window.confirm(`Hapus ${name} dari katalog prototipe?`)) return;
    if (deleteCatalogItem(id)) {
      announce(`${name} dihapus dari katalog prototipe.`);
    } else {
      announce("Data katalog tidak ditemukan dan tidak dapat dihapus.");
    }
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
        Perubahan katalog disimpan di prototipe Owner. Katalog publik Pelanggan belum terhubung ke penyimpanan Owner.
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
                        onClick={() => removeItem(item.id, item.name)}
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
    </div>
  );
}
