"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { customerServices } from "../../../lib/data/services";
import { formatTanggal } from "../../pelanggan/data";
import { useKapsterPrototype } from "../kapster-context";
import {
  bookingStatuses,
  getBookingStatusLabel,
  KapsterPageHeading,
  KapsterPrototypeNote,
} from "../kapster-ui";

export default function KapsterBookingList() {
  const { bookings, activeBarberId } = useKapsterPrototype();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const filteredBookings = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("id-ID");
    return bookings
      .filter((booking) => booking.barberId === activeBarberId)
      .filter((booking) => {
        const service = customerServices.find(
          (item) => item.id === booking.serviceId,
        );
        const matchesQuery =
          !normalizedQuery ||
          booking.customerName.toLocaleLowerCase("id-ID").includes(normalizedQuery) ||
          booking.id.toLocaleLowerCase("id-ID").includes(normalizedQuery) ||
          (service?.name.toLocaleLowerCase("id-ID").includes(normalizedQuery) ?? false);
        const matchesStatus =
          statusFilter === "all" || booking.status === statusFilter;
        return matchesQuery && matchesStatus;
      })
      .sort((left, right) =>
        `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`),
      );
  }, [activeBarberId, bookings, query, statusFilter]);

  return (
    <div className="cashier-page kapster-page">
      <KapsterPageHeading
        title="Daftar Booking"
        description="Kelola daftar booking pelanggan dan pantau status pelayanan."
      />
      <KapsterPrototypeNote>
        Daftar hanya menampilkan booking prototipe yang ditugaskan kepada
        Kapster Rizky Pratama (K0001).
      </KapsterPrototypeNote>
      <section className="cashier-panel cashier-table-panel kapster-panel kapster-table-panel">
        <div className="kapster-toolbar">
          <label className="cashier-search kapster-search">
            <span aria-hidden="true">⌕</span>
            <input
              aria-label="Cari pelanggan atau ID booking"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama pelanggan atau ID booking..."
              type="search"
              value={query}
            />
          </label>
          <label className="kapster-filter">
            <span>Status</span>
            <select
              aria-label="Filter status booking"
              onChange={(event) => setStatusFilter(event.target.value)}
              value={statusFilter}
            >
              <option value="all">Semua</option>
              {bookingStatuses.map((status) => (
                <option key={status.id} value={status.id}>{status.label}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="kapster-table-scroll">
          <table className="cashier-table kapster-table">
            <thead>
              <tr>
                <th scope="col">No.</th>
                <th scope="col">ID Booking</th>
                <th scope="col">Nama Pelanggan</th>
                <th scope="col">Layanan</th>
                <th scope="col">Tanggal &amp; Waktu</th>
                <th scope="col">Status</th>
                <th scope="col">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking, index) => {
                const service = customerServices.find(
                  (item) => item.id === booking.serviceId,
                );
                return (
                  <tr key={booking.id}>
                    <td>{String(index + 1).padStart(2, "0")}</td>
                    <td className="kapster-booking-id">{booking.id}</td>
                    <td>
                      {booking.customerName}
                      {booking.isSample && <small className="kapster-sample-tag">Prototipe</small>}
                    </td>
                    <td>{service?.name ?? "Layanan tidak tersedia"}</td>
                    <td>{formatTanggal(booking.date)}<small className="kapster-table-subtext">{booking.time} WIB</small></td>
                    <td>
                      <span className={`kapster-status kapster-status--${booking.status}`}>
                        {getBookingStatusLabel(booking.status)}
                      </span>
                    </td>
                    <td>
                      <Link
                        className="kapster-row-action"
                        href={`/kapster/booking/${encodeURIComponent(booking.id)}`}
                      >
                        Lihat Detail
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredBookings.length === 0 && (
          <div className="kapster-empty-state">
            <h2>{query || statusFilter !== "all" ? "Booking tidak ditemukan" : "Belum ada booking"}</h2>
            <p>
              {query || statusFilter !== "all"
                ? "Ubah kata pencarian atau filter status untuk melihat hasil lain."
                : "Booking yang ditugaskan kepada Anda akan tampil di sini."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
