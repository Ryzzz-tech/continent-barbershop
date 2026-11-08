import CashierBookingDetail from "./booking-detail";

export default async function CashierBookingDetailPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return <CashierBookingDetail bookingId={id ?? ""} />;
}
