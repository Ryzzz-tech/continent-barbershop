"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import ConfirmDialog from "../../components/confirm-dialog";
import { useAppFeedback } from "../../components/app-feedback";
import { CashierPageHeading, CashierPrototypeNote } from "../cashier-ui";

type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  registeredAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCustomer(value: unknown): value is Customer {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.phone === "string" &&
    typeof value.email === "string" &&
    typeof value.address === "string" &&
    typeof value.registeredAt === "string"
  );
}

function responseMessage(value: unknown, fallback: string) {
  return isRecord(value) && typeof value.message === "string"
    ? value.message
    : fallback;
}

export default function CashierCustomerList() {
  const { showToast } = useAppFeedback();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [customerToDelete, setCustomerToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/kasir/pelanggan", {
        cache: "no-store",
      });
      const result: unknown = await response.json();

      if (
        !response.ok ||
        !isRecord(result) ||
        !Array.isArray(result.customers) ||
        !result.customers.every(isCustomer)
      ) {
        throw new Error(
          responseMessage(result, "Data pelanggan tidak dapat dimuat."),
        );
      }

      setCustomers(result.customers);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Data pelanggan tidak dapat dimuat.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadCustomers);
  }, [loadCustomers]);

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("id-ID");

    if (!normalizedQuery) return customers;

    return customers.filter((customer) =>
      customer.name.toLocaleLowerCase("id-ID").includes(normalizedQuery),
    );
  }, [customers, query]);

  async function removeCustomer() {
    if (!customerToDelete) return false;

    try {
      const response = await fetch(
        `/api/kasir/pelanggan/${encodeURIComponent(customerToDelete.id)}`,
        { method: "DELETE" },
      );
      const result: unknown = await response.json();

      if (!response.ok || !isRecord(result) || result.success !== true) {
        throw new Error(
          responseMessage(result, "Data pelanggan tidak dapat dihapus."),
        );
      }

      setCustomers((current) =>
        current.filter((customer) => customer.id !== customerToDelete.id),
      );

      showToast(
        "Data Berhasil Dihapus",
        `Data pelanggan ${customerToDelete.name} berhasil dihapus dari database.`,
        "success",
      );

      return true;
    } catch (deleteError) {
      showToast(
        "Penghapusan Gagal",
        deleteError instanceof Error
          ? deleteError.message
          : "Data pelanggan tidak dapat dihapus.",
        "error",
      );

      return false;
    }
  }

  return (
    <div className="cashier-page">
      <CashierPageHeading
        title="Data Pelanggan"
        description="Kelola data pelanggan yang tersimpan di PostgreSQL."
      >
        <Link
          className="cashier-button cashier-button--primary"
          href="/kasir/pelanggan/tambah"
        >
          <span aria-hidden="true">+</span> Tambah Data Pelanggan
        </Link>
      </CashierPageHeading>

      <CashierPrototypeNote>
        Daftar pelanggan diambil langsung dari database PostgreSQL.
      </CashierPrototypeNote>

      {error && (
        <div className="cashier-error-banner" role="alert">
          {error}
          <button
            className="cashier-text-link"
            onClick={() => void loadCustomers()}
            type="button"
          >
            Coba lagi
          </button>
        </div>
      )}

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
              {loading ? (
                <tr>
                  <td colSpan={4}>Memuat data pelanggan...</td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredCustomers.length === 0 && !error && (
          <div className="cashier-table-empty">
            <span className="cashier-empty-icon" aria-hidden="true">
              ♙
            </span>
            <h2>
              {query
                ? "Pelanggan tidak ditemukan"
                : "Belum ada data pelanggan"}
            </h2>
            <p>
              {query
                ? "Coba kata kunci nama yang berbeda."
                : "Tambahkan data pelanggan untuk mengelolanya."}
            </p>
            {!query && (
              <Link
                className="cashier-button cashier-button--secondary"
                href="/kasir/pelanggan/tambah"
              >
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
          detail="Pelanggan yang memiliki akun, booking, atau transaksi tidak dapat dihapus."
          onClose={() => setCustomerToDelete(null)}
          onConfirm={removeCustomer}
        />
      )}
    </div>
  );
}
