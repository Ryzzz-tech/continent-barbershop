"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  CashierBooking,
  CashierBookingDraft,
  CashierCustomer,
  CashierTransaction,
} from "./prototype-types";
import { getTodayDateValue } from "./utils";

const sampleBookings: CashierBooking[] = [
  {
    id: "prototype-fajar",
    customerName: "Fajar Ramadhan",
    serviceId: "",
    serviceName: "Haircut",
    date: "",
    time: "09:00",
    barberId: "K0001",
    isSample: true,
  },
  {
    id: "prototype-dimas",
    customerName: "Dimas Prakoso",
    serviceId: "",
    serviceName: "Haircut",
    date: "",
    time: "11:00",
    barberId: "K0002",
    isSample: true,
  },
];

type CashierPrototypeContextValue = {
  bookings: CashierBooking[];
  customers: CashierCustomer[];
  transactions: CashierTransaction[];
  bookingDraft: CashierBookingDraft | null;
  transactionDraft: CashierTransaction | null;
  notice: string;
  setBookingDraft: (draft: CashierBookingDraft | null) => void;
  saveBooking: (draft: CashierBookingDraft) => boolean;
  setTransactionDraft: (transaction: CashierTransaction) => boolean;
  addCustomer: (customer: CashierCustomer) => void;
  updateCustomer: (customer: CashierCustomer) => boolean;
  deleteCustomer: (customerId: string) => boolean;
  announce: (message: string) => void;
  clearNotice: () => void;
};

const CashierPrototypeContext =
  createContext<CashierPrototypeContextValue | null>(null);

export function CashierPrototypeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [bookings, setBookings] = useState(sampleBookings);
  const [customers, setCustomers] = useState<CashierCustomer[]>([]);
  const [transactions, setTransactions] = useState<CashierTransaction[]>([]);
  const [bookingDraft, setBookingDraft] = useState<CashierBookingDraft | null>(
    null,
  );
  const [transactionDraft, setTransactionDraft] =
    useState<CashierTransaction | null>(null);
  const [notice, setNotice] = useState("");
  const savedBookingIds = useRef(new Set<string>());
  const savedTransactionIds = useRef(new Set<string>());

  const saveBooking = useCallback((draft: CashierBookingDraft) => {
    if (savedBookingIds.current.has(draft.id)) return false;
    savedBookingIds.current.add(draft.id);
    setBookings((current) => [
      {
        id: draft.id,
        customerName: draft.customerName,
        serviceId: draft.serviceId,
        serviceName: draft.serviceName,
        date: draft.date,
        time: draft.time,
        barberId: draft.barberId,
        isSample: false,
        isToday: draft.date === getTodayDateValue(),
      },
      ...current,
    ]);
    setBookingDraft({ ...draft, saved: true });
    return true;
  }, []);

  const recordTransaction = useCallback(
    (transaction: CashierTransaction) => {
      if (savedTransactionIds.current.has(transaction.id)) return false;
      savedTransactionIds.current.add(transaction.id);
      setTransactions((current) => [transaction, ...current]);
      setTransactionDraft(transaction);
      return true;
    },
    [],
  );

  const addCustomer = useCallback((customer: CashierCustomer) => {
    setCustomers((current) => [customer, ...current]);
  }, []);

  const updateCustomer = useCallback(
    (customer: CashierCustomer) => {
      if (!customers.some((item) => item.id === customer.id)) return false;
      setCustomers((current) =>
        current.map((item) =>
          item.id === customer.id ? customer : item,
        ),
      );
      return true;
    },
    [customers],
  );

  const deleteCustomer = useCallback(
    (customerId: string) => {
      if (!customers.some((item) => item.id === customerId)) return false;
      setCustomers((current) =>
        current.filter((item) => item.id !== customerId),
      );
      return true;
    },
    [customers],
  );

  const value = useMemo(
    () => ({
      bookings,
      customers,
      transactions,
      bookingDraft,
      transactionDraft,
      notice,
      setBookingDraft,
      saveBooking,
      setTransactionDraft: recordTransaction,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      announce: setNotice,
      clearNotice: () => setNotice(""),
    }),
    [
      addCustomer,
      bookingDraft,
      bookings,
      customers,
      deleteCustomer,
      notice,
      recordTransaction,
      saveBooking,
      transactionDraft,
      transactions,
      updateCustomer,
    ],
  );

  return (
    <CashierPrototypeContext.Provider value={value}>
      {children}
    </CashierPrototypeContext.Provider>
  );
}

export function useCashierPrototype() {
  const context = useContext(CashierPrototypeContext);
  if (!context) {
    throw new Error(
      "useCashierPrototype must be used within CashierPrototypeProvider.",
    );
  }
  return context;
}
