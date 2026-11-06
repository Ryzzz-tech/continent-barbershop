export {
  customerBarbers,
  formatRupiah,
  formatTanggal,
  isBookingDatePast,
  isValidDateValue,
  isValidTimeValue,
} from "../pelanggan/data";

export function getTodayDateValue() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isToday(value: string) {
  return value === getTodayDateValue();
}

export function formatRupiahInput(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return new Intl.NumberFormat("id-ID").format(Number(digits));
}

export function rupiahInputValue(value: string) {
  return Number(value.replace(/\D/g, ""));
}
