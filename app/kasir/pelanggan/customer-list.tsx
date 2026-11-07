"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ConfirmDialog from "../../components/confirm-dialog";
import { useAppFeedback } from "../../components/app-feedback";
import { useCashierPrototype } from "../cashier-context";
import { CashierPageHeading, CashierPrototypeNote } from "../cashier-ui";

export default function CashierCustomerList() {
  const { customers, deleteCustomer } = useCashierPrototype();
  const { showToast } = useAppFeedback();
  const [query, setQuery] = useState("");
  const [customerToDelete, setCustomerToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("id-ID");
    if (!normalizedQuery) return customers;
    return customers.filter((customer) =>
      customer.name.toLocaleLowerCase("id-ID").includes(normalizedQuery),
    );
  }, [customers, query]);

  function removeCustomer() {
    if (!customerToDelete) return false;
    if (deleteCustomer(customerToDelete.id)) {
      showToast(
        "Data Berhasil Dihapus",
        `Data pelanggan ${customerToDelete.name} berhasil dihapus.`,
        "success",
      );
      return true;
    }
    showToast(
      "Penghapusan Gagal",
      "Data pelanggan tidak ditemukan dan tidak dapat dihapus.",
      "error",
    );
    return false;
  }

  return (
    <div className="cashier-page">
      <CashierPageHeading
        title="Data Pelanggan"
        description="Kelola data pelanggan dalam state prototipe aplikasi."
      >
        <Link className="cashier-button cashier-button--primary" href="/kasir/pelanggan/tambah">
          <span aria-hidden="true">＋</span> Tambah Data Pelanggan
        </Link>
      </CashierPageHeading>
      <CashierPrototypeNote>
        Daftar ini hanya tersimpan sementara selama sesi aplikasi dan tidak
        berasal dari PostgreSQL.
      </CashierPrototypeNote>

      <section className="cashier-panel cashier-table-panel">
        <label className="cashier-search">
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="Cari nama pelanggan"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama pelanggan..."
            type="search"
            value={query}
          />
        </label>
        <div className="cashier-table-scroll">
          <table className="cashier-table">
            <thead>
              <tr>
                <th scope="col">Nama</th>
                <th scope="col">No HP</th>
                <th scope="col">Email</th>
                <th scope="col">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.name}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.email}</td>
                  <td>
                    <div className="cashier-row-actions">
                      <Link
                        className="cashier-row-action"
                        href={`/kasir/pelanggan/${encodeURIComponent(customer.id)}`}
                      >
                        Ubah
                      </Link>
                      <button
                        className="cashier-row-action cashier-row-action--danger"
                        onClick={() =>
                          setCustomerToDelete({
                            id: customer.id,
                            name: customer.name,
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
        {filteredCustomers.length === 0 && (
          <div className="cashier-table-empty">
            <span className="cashier-empty-icon" aria-hidden="true">♙</span>
            <h2>{query ? "Pelanggan tidak ditemukan" : "Belum ada data pelanggan"}</h2>
            <p>
              {query
                ? "Coba kata kunci nama yang berbeda."
                : "Tambahkan data pelanggan untuk mengelolanya dalam prototipe."}
            </p>
            {!query && (
              <Link className="cashier-button cashier-button--secondary" href="/kasir/pelanggan/tambah">
                Tambah Data Pelanggan
              </Link>
            )}
          </div>
        )}
      </section>
      {customerToDelete && (
        <ConfirmDialog
          title="Konfirmasi Penghapusan"
          description={`Apakah Anda yakin ingin menghapus data pelanggan "${customerToDelete.name}"?`}
          onClose={() => setCustomerToDelete(null)}
          onConfirm={removeCustomer}
        />
      )}
    </div>
  );
}
