import type { CustomerService } from "../../lib/data/services";
import {
  initialOwnerData,
  LEGACY_OWNER_STORAGE_KEY,
  OWNER_STORAGE_KEY,
  parseOwnerPrototypeData,
} from "./prototype-data";
import type { OwnerPrototypeData } from "./prototype-types";

type OwnerStoreSnapshot = {
  data: OwnerPrototypeData;
  notice: string;
  services: CustomerService[];
};

function getServices(data: OwnerPrototypeData) {
  return data.catalog
    .filter((item) => item.kind === "Layanan")
    .map(({ id, name, price, description }) => ({
      id,
      name,
      price: price ?? 0,
      ...(description ? { description } : {}),
    }));
}

function createSnapshot(
  data: OwnerPrototypeData,
  notice: string,
): OwnerStoreSnapshot {
  return { data, notice, services: getServices(data) };
}

const serverSnapshot = createSnapshot(initialOwnerData, "");
let snapshot = serverSnapshot;
let loaded = false;
const listeners = new Set<() => void>();

function loadFromStorage() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const stored = window.localStorage.getItem(OWNER_STORAGE_KEY);
    if (stored) {
      const parsed = parseOwnerPrototypeData(JSON.parse(stored) as unknown);
      snapshot = parsed
        ? createSnapshot(parsed, "")
        : createSnapshot(
            initialOwnerData,
            "Data prototipe tersimpan tidak valid. Data awal digunakan.",
          );
      return;
    }

    const legacyStored = window.localStorage.getItem(LEGACY_OWNER_STORAGE_KEY);
    if (!legacyStored) return;
    const legacyData = parseOwnerPrototypeData(
      JSON.parse(legacyStored) as unknown,
    );
    if (!legacyData) {
      snapshot = createSnapshot(
        initialOwnerData,
        "Data prototipe tersimpan tidak valid. Data awal digunakan.",
      );
      return;
    }

    const migratedData: OwnerPrototypeData = {
      ...legacyData,
      catalog: [
        ...initialOwnerData.catalog.filter((item) => item.kind === "Layanan"),
        ...legacyData.catalog.filter((item) => item.kind === "Produk"),
      ],
    };
    window.localStorage.setItem(OWNER_STORAGE_KEY, JSON.stringify(migratedData));
    snapshot = createSnapshot(migratedData, "");
  } catch {
    snapshot = createSnapshot(
      initialOwnerData,
      "Data prototipe tidak dapat dibaca atau disimpan pada penyimpanan browser.",
    );
  }
}

function notify() {
  listeners.forEach((listener) => listener());
}

function onStorage(event: StorageEvent) {
  if (event.key !== OWNER_STORAGE_KEY && event.key !== null) return;
  loaded = false;
  loadFromStorage();
  notify();
}

export function subscribeOwnerStore(listener: () => void) {
  const isFirstListener = listeners.size === 0;
  listeners.add(listener);
  if (isFirstListener && typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

export function getOwnerStoreSnapshot() {
  loadFromStorage();
  return snapshot;
}

export function getOwnerServerSnapshot() {
  return serverSnapshot;
}

export function getCustomerServicesSnapshot() {
  loadFromStorage();
  return snapshot.services;
}

export function getServerCustomerServicesSnapshot() {
  return serverSnapshot.services;
}

export function getCustomerServices() {
  return getCustomerServicesSnapshot();
}

export function updateOwnerStore(
  update: (data: OwnerPrototypeData) => OwnerPrototypeData | null,
  successNotice: string,
) {
  loadFromStorage();
  const nextData = update(snapshot.data);
  if (!nextData) return false;
  try {
    window.localStorage.setItem(OWNER_STORAGE_KEY, JSON.stringify(nextData));
  } catch {
    snapshot = createSnapshot(
      snapshot.data,
      "Perubahan tidak dapat disimpan ke penyimpanan browser. Data belum diperbarui.",
    );
    notify();
    return false;
  }
  snapshot = createSnapshot(nextData, successNotice);
  notify();
  return true;
}

export function setOwnerStoreNotice(notice: string) {
  loadFromStorage();
  snapshot = createSnapshot(snapshot.data, notice);
  notify();
}
