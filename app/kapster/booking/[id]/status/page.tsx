import { Suspense } from "react";
import KapsterBookingStatusForm from "./status-form";

async function BookingStatusContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <KapsterBookingStatusForm bookingId={decodeURIComponent(id)} />;
}

export default function KapsterBookingStatusPage({
  params,
}: PageProps<"/kapster/booking/[id]/status">) {
  return (
    <Suspense fallback={<div className="kapster-page"><h1>Memuat formulir status...</h1></div>}>
      <BookingStatusContent params={params} />
    </Suspense>
  );
}
