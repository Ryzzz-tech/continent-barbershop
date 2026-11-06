"use client";

import { customerServices } from "../../../lib/data/services";
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

function isDraft(value: unknown): value is BookingDraft {
  if (!isRecord(value)) return false;
  const draft = value;
  const service =
    typeof draft.serviceId === "string"
      ? customerServices.find((item) => item.id === draft.serviceId)
      : undefined;
  const serviceIdIsValid =
    draft.serviceId === "" || service !== undefined;
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
  const price = service?.price ?? 0;

  return (
    typeof draft.reference === "string" &&
    /^draft-[0-9a-f-]{36}$/i.test(draft.reference) &&
    serviceIdIsValid &&
    barberIdIsValid &&
    dateIsValid &&
    timeIsValid &&
    typeof draft.price === "number" &&
    draft.price === price &&
    typeof draft.total === "number" &&
    draft.total === price
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
    snapshot = { draft: parsed, error: null };
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
  const service = customerServices.find(
    (item) => item.id === fields.serviceId,
  );
  const price = service?.price ?? 0;
  const draft: BookingDraft = {
    ...fields,
    reference: snapshot.draft?.reference ?? createReference(),
    price,
    total: price,
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
