"use client";

import Link from "next/link";
import { useOwnerPrototype } from "../owner-context";
import { OwnerPageHeading, OwnerPrototypeNote } from "../owner-ui";

export default function OwnerEmployeeList() {
  const { employees, deleteEmployee, announce } = useOwnerPrototype();

  function removeEmployee(id: string, name: string) {
    if (!window.confirm(`Hapus data ${name} dari prototipe?`)) return;
    if (deleteEmployee(id)) {
      announce(`Data ${name} dihapus dari prototipe.`);
    } else {
      announce("Data karyawan tidak ditemukan dan tidak dapat dihapus.");
    }
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
                        onClick={() => removeEmployee(employee.id, employee.name)}
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
    </div>
  );
}
