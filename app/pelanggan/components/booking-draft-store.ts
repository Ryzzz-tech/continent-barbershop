"use client";

import { getCustomerServices } from "../../owner/owner-store";
import { customerBarbers, isValidDateValue, isValidTimeValue } from "../data";

const STORAGE_KEY = "continent-barbershop.booking-draft.v1";

export type BookingDraftFields = {
  serviceId: string;
  barberId: string;
  date: string;
  time: string;
};

export type BookingDraft = BookingDraftFields & {
  reference: string;
  price: number;
  total: number;
  paymentStatus: "unpaid" | "paid";
};

type StoredBookingDraft = Omit<BookingDraft, "paymentStatus"> & {
  paymentStatus?: BookingDraft["paymentStatus"];
};

export type BookingDraftSnapshot = {
  draft: BookingDraft | null;
  error: string | null;
};

const emptySnapshot: BookingDraftSnapshot = { draft: null, error: null };
let snapshot = emptySnapshot;
let hydrated = false;
const listeners = new Set<() => void>();

function isStorageException(error: unknown): error is DOMException {
  return error instanceof DOMException;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDraft(value: unknown): value is StoredBookingDraft {
  if (!isRecord(value)) return false;
  const draft = value;
  const serviceIdIsValid = typeof draft.serviceId === "string";
  const barberIdIsValid =
    draft.barberId === "" ||
    (typeof draft.barberId === "string" &&
      customerBarbers.some((barber) => barber.id === draft.barberId));
  const dateIsValid =
    draft.date === "" ||
    (typeof draft.date === "string" && isValidDateValue(draft.date));
  const timeIsValid =
    draft.time === "" ||
    (typeof draft.time === "string" && isValidTimeValue(draft.time));
  return (
    typeof draft.reference === "string" &&
    /^draft-[0-9a-f-]{36}$/i.test(draft.reference) &&
    serviceIdIsValid &&
    barberIdIsValid &&
    dateIsValid &&
    timeIsValid &&
    Number.isSafeInteger(draft.price) &&
    Number(draft.price) >= 0 &&
    Number.isSafeInteger(draft.total) &&
    draft.total === draft.price &&
    (draft.paymentStatus === undefined ||
      draft.paymentStatus === "unpaid" ||
      draft.paymentStatus === "paid")
  );
}

function notify() {
  for (const listener of listeners) listener();
}

function hydrateSnapshot() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;

  let serialized: string | null;
  try {
    serialized = window.sessionStorage.getItem(STORAGE_KEY);
  } catch (error) {
    if (!isStorageException(error)) throw error;
    snapshot = {
      draft: null,
      error: "Draft tidak dapat dibaca dari penyimpanan sesi browser.",
    };
    return;
  }

  if (!serialized) return;

  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    parsed = null;
  }

  if (isDraft(parsed)) {
    snapshot = {
      draft: { ...parsed, paymentStatus: parsed.paymentStatus ?? "unpaid" },
      error: null,
    };
    return;
  }

  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
    snapshot = { draft: null, error: null };
  } catch (error) {
    if (!isStorageException(error)) throw error;
    snapshot = {
      draft: null,
      error: "Draft tersimpan tidak valid dan tidak dapat dihapus.",
    };
  }
}

export function getBookingDraftSnapshot() {
  hydrateSnapshot();
  return snapshot;
}

export function getServerBookingDraftSnapshot() {
  return emptySnapshot;
}

export function subscribeToBookingDraft(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function createReference() {
  return `draft-${crypto.randomUUID()}`;
}

export function saveBookingDraft(fields: BookingDraftFields) {
  hydrateSnapshot();
  const service = getCustomerServices().find(
    (item) => item.id === fields.serviceId,
  );
  if (fields.serviceId && !service) {
    snapshot = {
      ...snapshot,
      error: "Layanan tidak tersedia lagi pada katalog.",
    };
    notify();
    return false;
  }
  const price = service?.price ?? 0;
  const draft: BookingDraft = {
    ...fields,
    reference: snapshot.draft?.reference ?? createReference(),
    price,
    total: price,
    paymentStatus:
      snapshot.draft &&
      snapshot.draft.serviceId === fields.serviceId &&
      snapshot.draft.barberId === fields.barberId &&
      snapshot.draft.date === fields.date &&
      snapshot.draft.time === fields.time
        ? snapshot.draft.paymentStatus
        : "unpaid",
  };

  if (!isDraft(draft)) {
    snapshot = {
      ...snapshot,
      error: "Pilihan draft tidak valid dan belum dapat disimpan.",
    };
    notify();
    return false;
  }

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    snapshot = { draft, error: null };
    notify();
    return true;
  } catch (error) {
    if (!isStorageException(error)) throw error;
    snapshot = {
      draft,
      error: "Draft hanya tersimpan sementara di halaman ini; penyimpanan sesi gagal.",
    };
    notify();
    return false;
  }
}

export function markBookingDraftPaid():
  | "paid"
  | "already-paid"
  | "missing"
  | "storage-error" {
  hydrateSnapshot();
  if (!snapshot.draft) return "missing";
  if (snapshot.draft.paymentStatus === "paid") return "already-paid";
  if (typeof window === "undefined") return "storage-error";

  const draft = { ...snapshot.draft, paymentStatus: "paid" as const };
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch (error) {
    if (!isStorageException(error)) throw error;
    snapshot = {
      ...snapshot,
      error: "Status pembayaran tidak dapat disimpan ke penyimpanan sesi browser.",
    };
    notify();
    return "storage-error";
  }

  snapshot = { draft, error: null };
  notify();
  return "paid";
}

export function clearBookingDraft() {
  hydrateSnapshot();
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
    snapshot = emptySnapshot;
    notify();
    return true;
  } catch (error) {
    if (!isStorageException(error)) throw error;
    snapshot = {
      ...snapshot,
      error: "Draft tidak dapat dihapus dari penyimpanan sesi browser.",
    };
    notify();
    return false;
  }
}
