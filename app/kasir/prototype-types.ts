export type CashierCustomer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  note: string;
};

export type CashierBooking = {
  id: string;
  customerName: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  barberId: string;
  isSample: boolean;
  isToday?: boolean;
}

export type CashierTransaction = CashierBooking & {
  total: number;
  paidAmount: number;
};

export type CashierBookingDraft = CashierBooking & {
  saved: boolean;
};
