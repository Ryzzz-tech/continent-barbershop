"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatTanggal } from "../../pelanggan/data";
import type { KapsterBooking } from "../prototype-types";
import {
  bookingStatuses,
  getBookingStatusClass,
  getBookingStatusLabel,
  KapsterPageHeading,
} from "../kapster-ui";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isBooking(value: unknown): value is KapsterBooking {
  return isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.customerName === "string" &&
    typeof value.customerPhone === "string" &&
    typeof value.customerNote === "string" &&
    typeof value.serviceId === "string" &&
    typeof value.serviceName === "string" &&
    typeof value.price === "number" &&
    typeof value.date === "string" &&
    typeof value.time === "string" &&
    typeof value.barberId === "string" &&
    typeof value.status === "string" &&
    typeof value.statusNote === "string";
}

export default function KapsterBookingList() {
  const [bookings, setBookings] = useState<KapsterBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadBookings = useCallback(async () => {
    try {
      const response = await fetch("/api/booking", { cache: "no-store" });
      const result: unknown = await response.json();
      if (!response.ok || !isRecord(result) || !Array.isArray(result.bookings) || !result.bookings.every(isBooking)) {
        throw new Error(
          isRecord(result) && typeof result.message === "string"
            ? result.message
            : "Daftar booking tidak dapat dimuat.",
        );
      }
      setBookings(result.bookings);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Daftar booking tidak dapat dimuat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void Promise.resolve().then(loadBookings); }, [loadBookings]);

  const filteredBookings = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("id-ID");
    return bookings
      .filter((booking) => {
        const matchesQuery =
          !normalizedQuery ||
          booking.customerName.toLocaleLowerCase("id-ID").includes(normalizedQuery) ||
          booking.id.toLocaleLowerCase("id-ID").includes(normalizedQuery) ||
          booking.serviceName.toLocaleLowerCase("id-ID").includes(normalizedQuery);
        const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
        return matchesQuery && matchesStatus;
      })
      .sort((left, right) =>
        `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`),
      );
  }, [bookings, query, statusFilter]);

  return (
    <div className="cashier-page kapster-page">
      <KapsterPageHeading
        title="Daftar Booking"
        description="Kelola daftar booking pelanggan dan pantau status pelayanan."
      />
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
        {loading && <div className="kapster-empty-state" aria-busy="true"><p>Memuat booking...</p></div>}
        {!loading && error && (
          <div className="kapster-empty-state" role="alert">
            <h2>Booking tidak dapat dimuat</h2>
            <p>{error}</p>
            <button className="kapster-row-action" onClick={() => { setLoading(true); setError(""); void loadBookings(); }} type="button">Coba lagi</button>
          </div>
        )}
        {!loading && !error && (
          <>
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
                  {filteredBookings.map((booking, index) => (
                    <tr key={booking.id}>
                      <td>{String(index + 1).padStart(2, "0")}</td>
                      <td className="kapster-booking-id">{booking.id}</td>
                      <td>{booking.customerName}</td>
                      <td>{booking.serviceName}</td>
                      <td>{formatTanggal(booking.date)}<small className="kapster-table-subtext">{booking.time} WIB</small></td>
                      <td>
                        <span className={`kapster-status kapster-status--${getBookingStatusClass(booking.status)}`}>
                          {getBookingStatusLabel(booking.status)}
                        </span>
                      </td>
                      <td>
                        <Link className="kapster-row-action" href={`/kapster/booking/${encodeURIComponent(booking.id)}`}>
                          Lihat Detail
                        </Link>
                      </td>
                    </tr>
                  ))}
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
          </>
        )}
      </section>
    </div>
  );
}
