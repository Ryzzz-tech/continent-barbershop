"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ConfirmDialog from "../../components/confirm-dialog";
import { useAppFeedback } from "../../components/app-feedback";
import { OwnerPageHeading } from "../owner-ui";

type Employee = {
  id: string;
  name: string;
  role: "Kapster" | "Kasir";
  phone: string;
  username: string;
  hasPassword: boolean;
  isActive: boolean;
  profileStatus: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isEmployee(value: unknown): value is Employee {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    (value.role === "Kapster" || value.role === "Kasir") &&
    typeof value.phone === "string" &&
    typeof value.username === "string" &&
    typeof value.hasPassword === "boolean" &&
    typeof value.isActive === "boolean" &&
    typeof value.profileStatus === "string"
  );
}

function getErrorMessage(value: unknown, fallback: string) {
  return isRecord(value) && typeof value.message === "string"
    ? value.message
    : fallback;
}

export default function OwnerEmployeeList() {
  const { showToast } = useAppFeedback();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [employeeToDelete, setEmployeeToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/owner/employees", {
        cache: "no-store",
      });

      const result: unknown = await response.json();

      if (
        !response.ok ||
        !isRecord(result) ||
        !Array.isArray(result.employees) ||
        !result.employees.every(isEmployee)
      ) {
        throw new Error(
          getErrorMessage(result, "Data karyawan tidak dapat dimuat."),
        );
      }

      setEmployees(result.employees);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Data karyawan tidak dapat dimuat.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadEmployees);
  }, [loadEmployees]);

  async function removeEmployee() {
    if (!employeeToDelete) return false;

    try {
      const response = await fetch(
        `/api/owner/employees/${encodeURIComponent(employeeToDelete.id)}`,
        { method: "DELETE" },
      );

      const result: unknown = await response.json();

      if (!response.ok || !isRecord(result) || result.success !== true) {
        throw new Error(
          getErrorMessage(result, "Data karyawan tidak dapat dinonaktifkan."),
        );
      }

      showToast(
        "Pengelolaan Karyawan Berhasil",
        `${employeeToDelete.name}: ${getErrorMessage(result, "Perubahan berhasil disimpan.")}`,
        "success",
      );

      await loadEmployees();
      return true;
    } catch (deleteError) {
      showToast(
        "Penghapusan Gagal",
        deleteError instanceof Error
          ? deleteError.message
          : "Data karyawan tidak dapat diproses.",
        "error",
      );

      return false;
    }
  }

  return (
    <div className="cashier-page owner-page">
      <OwnerPageHeading
        title="Data Kapster & Kasir"
        description="Kelola profil, akun login, dan status karyawan barbershop."
      >
        <Link
          className="cashier-button cashier-button--primary"
          href="/owner/kapster-kasir/tambah"
        >
          + Tambah Data
        </Link>
      </OwnerPageHeading>



      {error && (
        <div className="cashier-error-banner" role="alert">
          {error}
          <button
            className="cashier-text-link"
            onClick={() => void loadEmployees()}
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
                <th scope="col">Nama</th>
                <th scope="col">Peran</th>
                <th scope="col">No. HP</th>
                <th scope="col">Status Akun</th>
                <th scope="col">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>Memuat data karyawan...</td>
                </tr>
              ) : (
                employees.map((employee, index) => {
                  const accountStatus = employee.hasPassword ? (employee.isActive ? "Aktif" : "Nonaktif") : employee.profileStatus === "Nonaktif" ? "Nonaktif" : "Belum Ada Akun";

                  return (
                    <tr key={employee.id}>
                      <td>{String(index + 1).padStart(2, "0")}</td>
                      <td>{employee.name}</td>
                      <td>{employee.role}</td>
                      <td>{employee.phone}</td>
                      <td>{accountStatus}</td>
                      <td>
                        <div className="owner-row-actions">
                          <Link
                            className="cashier-row-action"
                            href={`/owner/kapster-kasir/${encodeURIComponent(employee.id)}/ubah`}
                          >
                            Ubah
                          </Link>

                          <button
                            className="cashier-row-action cashier-row-action--danger"
                            disabled={(!employee.isActive && employee.hasPassword) || (employee.role === "Kasir" && !employee.hasPassword)}
                            onClick={() =>
                              setEmployeeToDelete({
                                id: employee.id,
                                name: employee.name,
                              })
                            }
                            type="button"
                          >
                            Nonaktifkan
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && employees.length === 0 && !error && (
          <div className="cashier-empty-state owner-empty-state">
            <p>Belum ada data kapster atau kasir.</p>
            <Link
              className="cashier-button cashier-button--primary"
              href="/owner/kapster-kasir/tambah"
            >
              Tambah Data
            </Link>
          </div>
        )}
      </section>

      {employeeToDelete && (
        <ConfirmDialog
          title="Konfirmasi Penonaktifan"
          description={`Apakah Anda yakin ingin menonaktifkan akses ${employeeToDelete.name}?`}
          detail="Data karyawan dan riwayat terkait akan dipertahankan. Akun yang dinonaktifkan tidak dapat digunakan untuk login."
          confirmLabel="Ya, Nonaktifkan"
          onClose={() => setEmployeeToDelete(null)}
          onConfirm={removeEmployee}
        />
      )}
    </div>
  );
}
