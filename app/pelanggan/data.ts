export { customerServices } from "../../lib/data/services";
export type { CustomerService } from "../../lib/data/services";

export const customerBarbers = [
  { id: "K0001", name: "Rizky Pratama" },
  { id: "K0002", name: "Andi Saputra" },
  { id: "K0003", name: "Fikri Hidayat" },
];

export function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPaymentMethod(value: string) {
  return value.replace(/\s*\(simulasi\)\s*$/i, "").trim();
}

export function isValidDateValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return (
    date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day)
  );
}

export function isValidTimeValue(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return false;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

export function formatTanggal(value: string) {
  if (!isValidDateValue(value)) return "Belum dipilih";

  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export function isBookingDatePast(value: string) {
  if (!isValidDateValue(value)) return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day) < today;
}
