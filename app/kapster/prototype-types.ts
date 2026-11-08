export type BookingStatus =
  | "Menunggu"
  | "Dikonfirmasi"
  | "Diproses"
  | "Selesai"
  | "Dibatalkan";

export type KapsterBooking = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerNote: string;
  serviceId: string;
  serviceName: string;
  price: number;
  date: string;
  time: string;
  barberId: string;
  status: BookingStatus;
  statusNote: string;
};

export type KapsterSchedule = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "available" | "unavailable";
  note: string;
};
