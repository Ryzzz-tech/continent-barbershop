"use client";

import Link from "next/link";
import { useState } from "react";
import ConfirmDialog from "../../components/confirm-dialog";
import { useAppFeedback } from "../../components/app-feedback";
import { useOwnerPrototype } from "../owner-context";
import { OwnerPageHeading, OwnerPrototypeNote } from "../owner-ui";

export default function OwnerEmployeeList() {
  const { employees, deleteEmployee } = useOwnerPrototype();
  const { showToast } = useAppFeedback();
  const [employeeToDelete, setEmployeeToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  function removeEmployee() {
    if (!employeeToDelete) return false;
    if (deleteEmployee(employeeToDelete.id)) {
      showToast(
        "Data Berhasil Dihapus",
        `Data ${employeeToDelete.name} berhasil dihapus.`,
        "success",
      );
      return true;
    }
    showToast(
      "Penghapusan Gagal",
      "Data karyawan tidak dapat dihapus. Periksa kembali data atau penyimpanan browser.",
      "error",
    );
    return false;
  }

  return (
    <div className="cashier-page owner-page">
      <OwnerPageHeading
        title="Data Kapster & Kasir"
        description="Kelola data kapster dan kasir barbershop."
      >
        <Link className="cashier-button cashier-button--primary" href="/owner/kapster-kasir/tambah">
          + Tambah Data
        </Link>
      </OwnerPageHeading>
      <OwnerPrototypeNote>
        Data karyawan hanya disimpan pada prototipe browser. Password tidak ditampilkan atau disimpan sebagai teks.
      </OwnerPrototypeNote>
      <section className="cashier-panel owner-table-panel">
        <div className="cashier-table-scroll owner-table-scroll">
          <table className="cashier-table owner-table">
            <thead>
              <tr>
                <th scope="col">No.</th>
                <th scope="col">Nama</th>
                <th scope="col">Peran</th>
                <th scope="col">No. HP</th>
                <th scope="col">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee, index) => (
                <tr key={employee.id}>
                  <td>{String(index + 1).padStart(2, "0")}</td>
                  <td>{employee.name}</td>
                  <td>{employee.role}</td>
                  <td>{employee.phone}</td>
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
                        onClick={() =>
                          setEmployeeToDelete({
                            id: employee.id,
                            name: employee.name,
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
        {employees.length === 0 && (
          <div className="cashier-empty-state owner-empty-state">
            <p>Belum ada data kapster atau kasir.</p>
            <Link className="cashier-button cashier-button--primary" href="/owner/kapster-kasir/tambah">
              Tambah Data
            </Link>
          </div>
        )}
      </section>
      {employeeToDelete && (
        <ConfirmDialog
          title="Konfirmasi Penghapusan"
          description={`Apakah Anda yakin ingin menghapus data ${employeeToDelete.name}?`}
          onClose={() => setEmployeeToDelete(null)}
          onConfirm={removeEmployee}
        />
      )}
    </div>
  );
}
