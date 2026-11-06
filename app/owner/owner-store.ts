import {
  initialOwnerData,
  OWNER_STORAGE_KEY,
  parseOwnerPrototypeData,
} from "./prototype-data";
import type { OwnerPrototypeData } from "./prototype-types";

type OwnerStoreSnapshot = {
  data: OwnerPrototypeData;
  notice: string;
};

const serverSnapshot: OwnerStoreSnapshot = {
  data: initialOwnerData,
  notice: "",
};

let snapshot = serverSnapshot;
let loaded = false;
const listeners = new Set<() => void>();

function loadFromStorage() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const stored = window.localStorage.getItem(OWNER_STORAGE_KEY);
    if (!stored) return;
    const parsed = parseOwnerPrototypeData(JSON.parse(stored) as unknown);
    snapshot = parsed
      ? { data: parsed, notice: "" }
      : { data: initialOwnerData, notice: "Data prototipe tersimpan tidak valid. Data awal digunakan." };
  } catch {
    snapshot = {
      data: initialOwnerData,
      notice: "Data prototipe tidak dapat dibaca dari penyimpanan browser.",
    };
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
  listeners.add(listener);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
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
    snapshot = {
      ...snapshot,
      notice: "Perubahan tidak dapat disimpan ke penyimpanan browser. Data belum diperbarui.",
    };
    notify();
    return false;
  }
  snapshot = { data: nextData, notice: successNotice };
  notify();
  return true;
}

export function setOwnerStoreNotice(notice: string) {
  loadFromStorage();
  snapshot = { ...snapshot, notice };
  notify();
}
