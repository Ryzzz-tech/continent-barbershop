import { Suspense } from "react";
import KapsterBookingDetail from "./booking-detail";

async function BookingDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <KapsterBookingDetail bookingId={decodeURIComponent(id)} />;
}

export default function KapsterBookingDetailPage({
  params,
}: PageProps<"/kapster/booking/[id]">) {
  return (
    <Suspense fallback={<div className="kapster-page"><h1>Memuat detail booking...</h1></div>}>
      <BookingDetailContent params={params} />
    </Suspense>
  );
}
