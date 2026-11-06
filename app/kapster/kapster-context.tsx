"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  BookingStatus,
  KapsterBooking,
  KapsterSchedule,
} from "./prototype-types";

const activeBarberId = "K0001";
const prototypeDate = "2026-11-06";

const initialBookings: KapsterBooking[] = [
  {
    id: "BK-2026-0001",
    customerName: "Andi Pratama",
    customerPhone: "0812••••0001",
    customerNote: "",
    serviceId: "regular-haircut",
    date: prototypeDate,
    time: "09:30",
    barberId: activeBarberId,
    status: "waiting",
    statusNote: "",
    isSample: true,
  },
  {
    id: "BK-2026-0002",
    customerName: "Budi Saputra",
    customerPhone: "0812••••0002",
    customerNote: "Data kontak prototipe disamarkan.",
    serviceId: "premium-haircut",
    date: prototypeDate,
    time: "10:30",
    barberId: activeBarberId,
    status: "in-progress",
    statusNote: "",
    isSample: true,
  },
  {
    id: "BK-2026-0003",
    customerName: "Citra Maharani",
    customerPhone: "0812••••0003",
    customerNote: "",
    serviceId: "hair-styling",
    date: prototypeDate,
    time: "11:30",
    barberId: activeBarberId,
    status: "waiting",
    statusNote: "",
    isSample: true,
  },
  {
    id: "BK-2026-0004",
    customerName: "Doni Setiawan",
    customerPhone: "0812••••0004",
    customerNote: "Mohon konfirmasi gaya rambut sebelum pelayanan.",
    serviceId: "full-service",
    date: prototypeDate,
    time: "12:30",
    barberId: activeBarberId,
    status: "completed",
    statusNote: "",
    isSample: true,
  },
  {
    id: "BK-2026-0005",
    customerName: "Eka Putri",
    customerPhone: "0812••••0005",
    customerNote: "",
    serviceId: "creambath",
    date: prototypeDate,
    time: "13:30",
    barberId: activeBarberId,
    status: "completed",
    statusNote: "",
    isSample: true,
  },
  {
    id: "BK-2026-0006",
    customerName: "Farhan Akbar",
    customerPhone: "0812••••0006",
    customerNote: "",
    serviceId: "hair-colour",
    date: prototypeDate,
    time: "14:30",
    barberId: activeBarberId,
    status: "waiting",
    statusNote: "",
    isSample: true,
  },
  {
    id: "BK-2026-0007",
    customerName: "Gita Lestari",
    customerPhone: "0812••••0007",
    customerNote: "Data kontak prototipe disamarkan.",
    serviceId: "highlight",
    date: prototypeDate,
    time: "15:30",
    barberId: activeBarberId,
    status: "completed",
    statusNote: "",
    isSample: true,
  },
  {
    id: "BK-2026-0008",
    customerName: "Hendra Wijaya",
    customerPhone: "0812••••0008",
    customerNote: "",
    serviceId: "home-service",
    date: prototypeDate,
    time: "16:30",
    barberId: activeBarberId,
    status: "completed",
    statusNote: "",
    isSample: true,
  },
];

const initialSchedules: KapsterSchedule[] = [
  { id: "SCH-2026-1102", date: "2026-11-02", startTime: "09:00", endTime: "17:00", status: "available", note: "" },
  { id: "SCH-2026-1103", date: "2026-11-03", startTime: "09:00", endTime: "17:00", status: "available", note: "" },
  { id: "SCH-2026-1104", date: "2026-11-04", startTime: "09:00", endTime: "17:00", status: "unavailable", note: "" },
  { id: "SCH-2026-1105", date: "2026-11-05", startTime: "09:00", endTime: "17:00", status: "available", note: "" },
  { id: "SCH-2026-1106", date: "2026-11-06", startTime: "09:00", endTime: "17:00", status: "available", note: "" },
];

type KapsterPrototypeContextValue = {
  bookings: KapsterBooking[];
  schedules: KapsterSchedule[];
  activeBarberId: string;
  notice: string;
  getBooking: (id: string) => KapsterBooking | undefined;
  updateBookingStatus: (id: string, status: BookingStatus, note: string) => boolean;
  getSchedule: (id: string) => KapsterSchedule | undefined;
  getScheduleConflict: (schedule: KapsterSchedule) => "overlap" | "active-booking" | null;
  saveSchedule: (schedule: KapsterSchedule) => boolean;
  deleteSchedule: (id: string) => boolean;
  announce: (message: string) => void;
  clearNotice: () => void;
};

const KapsterPrototypeContext =
  createContext<KapsterPrototypeContextValue | null>(null);

function isActiveBooking(booking: KapsterBooking) {
  return booking.status === "waiting" || booking.status === "in-progress";
}

function timeFallsInSchedule(time: string, startTime: string, endTime: string) {
  return time >= startTime && time < endTime;
}

export function KapsterPrototypeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [bookings, setBookings] = useState(initialBookings);
  const [schedules, setSchedules] = useState(initialSchedules);
  const [notice, setNotice] = useState("");

  const getBooking = useCallback(
    (id: string) =>
      bookings.find(
        (booking) => booking.id === id && booking.barberId === activeBarberId,
      ),
    [bookings],
  );

  const updateBookingStatus = useCallback(
    (id: string, status: BookingStatus, note: string) => {
      if (!bookings.some(
        (booking) => booking.id === id && booking.barberId === activeBarberId,
      )) return false;
      setBookings((current) =>
        current.map((booking) =>
          booking.id === id && booking.barberId === activeBarberId
            ? { ...booking, status, statusNote: note }
            : booking,
        ),
      );
      return true;
    },
    [bookings],
  );

  const getSchedule = useCallback(
    (id: string) => schedules.find((schedule) => schedule.id === id),
    [schedules],
  );

  const getScheduleConflict = useCallback(
    (schedule: KapsterSchedule) => {
      const overlap = schedules.some(
        (current) =>
          current.id !== schedule.id &&
          current.date === schedule.date &&
          schedule.startTime < current.endTime &&
          current.startTime < schedule.endTime,
      );
      if (overlap) return "overlap" as const;

      if (schedule.status === "unavailable") {
        const conflictsWithBooking = bookings.some(
          (booking) =>
            booking.barberId === activeBarberId &&
            booking.date === schedule.date &&
            isActiveBooking(booking) &&
            timeFallsInSchedule(booking.time, schedule.startTime, schedule.endTime),
        );
        if (conflictsWithBooking) return "active-booking" as const;
      }
      return null;
    },
    [bookings, schedules],
  );

  const saveSchedule = useCallback(
    (schedule: KapsterSchedule) => {
      if (getScheduleConflict(schedule)) return false;
      const exists = schedules.some((item) => item.id === schedule.id);
      setSchedules((current) =>
        exists
          ? current.map((item) => item.id === schedule.id ? schedule : item)
          : [schedule, ...current],
      );
      return true;
    },
    [getScheduleConflict, schedules],
  );

  const deleteSchedule = useCallback(
    (id: string) => {
      if (!schedules.some((schedule) => schedule.id === id)) return false;
      setSchedules((current) => current.filter((schedule) => schedule.id !== id));
      return true;
    },
    [schedules],
  );

  const value = useMemo(
    () => ({
      bookings,
      schedules,
      activeBarberId,
      notice,
      getBooking,
      updateBookingStatus,
      getSchedule,
      getScheduleConflict,
      saveSchedule,
      deleteSchedule,
      announce: setNotice,
      clearNotice: () => setNotice(""),
    }),
    [
      bookings,
      deleteSchedule,
      getBooking,
      getSchedule,
      getScheduleConflict,
      notice,
      saveSchedule,
      schedules,
      updateBookingStatus,
    ],
  );

  return (
    <KapsterPrototypeContext.Provider value={value}>
      {children}
    </KapsterPrototypeContext.Provider>
  );
}

export function useKapsterPrototype() {
  const context = useContext(KapsterPrototypeContext);
  if (!context) {
    throw new Error(
      "useKapsterPrototype must be used within KapsterPrototypeProvider.",
    );
  }
  return context;
}
