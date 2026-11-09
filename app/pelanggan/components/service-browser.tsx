"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatRupiah } from "../data";

type Service = { id: string; name: string; price: number; duration: number; description: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isService(value: unknown): value is Service {
  return isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.price === "number" &&
    typeof value.duration === "number" && typeof value.description === "string";
}

export default function ServiceBrowser() {
  const [query, setQuery] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadServices = useCallback(async () => {
    try {
      const response = await fetch("/api/booking/options", { cache: "no-store" });
      const result: unknown = await response.json();
      if (!response.ok || !isRecord(result) || !Array.isArray(result.services) || !result.services.every(isService)) {
        throw new Error(
          isRecord(result) && typeof result.message === "string"
            ? result.message
            : "Katalog layanan tidak dapat dimuat.",
        );
      }
      setServices(result.services);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Katalog layanan tidak dapat dimuat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void Promise.resolve().then(loadServices); }, [loadServices]);
  const filteredServices = useMemo(
    () => services.filter((service) =>
      service.name.toLocaleLowerCase("id-ID").includes(query.trim().toLocaleLowerCase("id-ID")),
    ),
    [query, services],
  );

  return (
    <>
      <label className="customer-search">
        <span aria-hidden="true">&#x2315;</span>
        <input aria-label="Cari Layanan" onChange={(event) => setQuery(event.target.value)} placeholder="Cari Layanan..." type="search" value={query} />
      </label>

      {loading && <div className="customer-empty-state" aria-busy="true"><p>Memuat layanan...</p></div>}
      {!loading && error && (
        <div className="customer-empty-state" role="alert">
          <h2>Katalog tidak dapat dimuat</h2><p>{error}</p>
          <button className="customer-outline-button" onClick={() => { setLoading(true); setError(""); void loadServices(); }} type="button">Coba lagi</button>
        </div>
      )}
      {!loading && !error && filteredServices.length > 0 ? (
        <div className="service-card-grid">
          {filteredServices.map((service) => (
            <article className="service-card" key={service.id}>
              <div className="service-card__icon" aria-hidden="true">&#x2702;</div>
              <h2>{service.name}</h2>
              <p className="service-card__price">{formatRupiah(service.price)}</p>
              <p className="service-card__description">{service.description.trim() || "Deskripsi layanan belum tersedia."}</p>
<p className="service-card__duration">Durasi: {service.duration} menit</p>
              <Link className="customer-primary-button" href={`/pelanggan/booking/buat?layanan=${encodeURIComponent(service.id)}`}>Pilih Layanan</Link>
            </article>
          ))}
        </div>
      ) : !loading && !error ? (
        <div className="customer-empty-state">
          <h2>{services.length ? "Layanan tidak ditemukan" : "Katalog layanan kosong"}</h2>
          <p>{services.length ? "Coba gunakan kata kunci lain." : "Belum ada layanan aktif saat ini."}</p>
        </div>
      ) : null}
    </>
  );
}
