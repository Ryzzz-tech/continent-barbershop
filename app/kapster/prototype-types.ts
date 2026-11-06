export type BookingStatus =
  | "waiting"
  | "in-progress"
  | "completed"
  | "cancelled";

export type KapsterBooking = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerNote: string;
  serviceId: string;
  date: string;
  time: string;
  barberId: string;
  status: BookingStatus;
  statusNote: string;
  isSample: boolean;
};

export type KapsterSchedule = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "available" | "unavailable";
  note: string;
};
