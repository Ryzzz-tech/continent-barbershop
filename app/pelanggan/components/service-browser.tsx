"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCustomerServices } from "../../components/use-customer-services";
import { formatRupiah } from "../data";
import { useCustomerPrototype } from "./customer-context";

export default function ServiceBrowser() {
  const [query, setQuery] = useState("");
  const { setBookingDraft, bookingDraft } = useCustomerPrototype();
  const customerServices = useCustomerServices();
  const filteredServices = useMemo(
    () =>
      customerServices.filter((service) =>
        service.name.toLocaleLowerCase("id-ID").includes(query.trim().toLocaleLowerCase("id-ID")),
      ),
    [customerServices, query],
  );

  return (
    <>
      <label className="customer-search">
        <span aria-hidden="true">⌕</span>
        <input
          aria-label="Cari Layanan"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari Layanan..."
          type="search"
          value={query}
        />
      </label>

      <p className="customer-info-banner">
        Dapatkan potongan gratis dengan ikutan jadi member. Syarat program dan
        perhitungan potongan belum tersedia; harga katalog belum dikurangi
        potongan.
      </p>

      {bookingDraft?.serviceId && (
        <p className="customer-prototype-note" role="status">
          Pilihan layanan terakhir tersimpan sementara di prototipe.
        </p>
      )}

      {filteredServices.length > 0 ? (
        <div className="service-card-grid">
          {filteredServices.map((service) => (
            <article className="service-card" key={service.id}>
              <div className="service-card__icon" aria-hidden="true">✂</div>
              <h2>{service.name}</h2>
              <p className="service-card__price">{formatRupiah(service.price)}</p>
              {service.description?.trim() && (
                <p className="service-card__description">
                  {service.description.trim()}
                </p>
              )}
              <Link
                className="customer-primary-button"
                href={`/pelanggan/booking/buat?layanan=${encodeURIComponent(service.id)}`}
                onClick={() =>
                  setBookingDraft({
                    serviceId: service.id,
                    barberId: bookingDraft?.barberId ?? "",
                    date: bookingDraft?.date ?? "",
                    time: bookingDraft?.time ?? "",
                  })
                }
              >
                Pilih Layanan
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="customer-empty-state">
          <h2>Layanan tidak ditemukan</h2>
          <p>Coba gunakan kata kunci lain.</p>
        </div>
      )}
    </>
  );
}
