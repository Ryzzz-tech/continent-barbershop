"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  clearBookingDraft,
  getBookingDraftSnapshot,
  getServerBookingDraftSnapshot,
  markBookingDraftPaid,
  saveBookingDraft,
  subscribeToBookingDraft,
  type BookingDraftFields,
} from "./booking-draft-store";

type CustomerPrototypeContextValue = {
  bookingDraft: ReturnType<typeof getBookingDraftSnapshot>["draft"];
  storageError: string | null;
  setBookingDraft: (draft: BookingDraftFields) => boolean;
  markBookingDraftPaid: typeof markBookingDraftPaid;
  clearBookingDraft: () => boolean;
};

const CustomerPrototypeContext =
  createContext<CustomerPrototypeContextValue | null>(null);

export function CustomerPrototypeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const snapshot = useSyncExternalStore(
    subscribeToBookingDraft,
    getBookingDraftSnapshot,
    getServerBookingDraftSnapshot,
  );
  const value: CustomerPrototypeContextValue = {
    bookingDraft: snapshot.draft,
    storageError: snapshot.error,
    setBookingDraft: saveBookingDraft,
    markBookingDraftPaid,
    clearBookingDraft,
  };

  return (
    <CustomerPrototypeContext.Provider value={value}>
      {children}
    </CustomerPrototypeContext.Provider>
  );
}

export function useCustomerPrototype() {
  const value = useContext(CustomerPrototypeContext);
  if (!value) {
    throw new Error(
      "useCustomerPrototype harus digunakan di dalam CustomerPrototypeProvider.",
    );
  }
  return value;
}
