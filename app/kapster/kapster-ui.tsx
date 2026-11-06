import type { ReactNode } from "react";
import type { BookingStatus, KapsterSchedule } from "./prototype-types";

export const bookingStatuses: {
  id: BookingStatus;
  label: string;
  description: string;
}[] = [
  {
    id: "waiting",
    label: "Menunggu",
    description: "Pelanggan sudah datang, menunggu giliran.",
  },
  {
    id: "in-progress",
    label: "Diproses",
    description: "Pelayanan sedang berlangsung.",
  },
  {
    id: "completed",
    label: "Selesai",
    description: "Pelayanan telah selesai.",
  },
  {
    id: "cancelled",
    label: "Dibatalkan",
    description: "Booking dibatalkan.",
  },
];

export function getBookingStatusLabel(status: BookingStatus) {
  return bookingStatuses.find((item) => item.id === status)?.label ?? status;
}

export function getScheduleStatusLabel(status: KapsterSchedule["status"]) {
  return status === "available" ? "Tersedia" : "Tidak Tersedia";
}

export function KapsterPageHeading({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <header className="cashier-page-heading kapster-page-heading">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children}
    </header>
  );
}

export function KapsterPrototypeNote({ children }: { children: ReactNode }) {
  return <p className="cashier-prototype-note kapster-prototype-note">{children}</p>;
}

export function formatDayName(dateValue: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return "—";
  const [year, month, day] = dateValue.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(
    new Date(year, month - 1, day),
  );
}
