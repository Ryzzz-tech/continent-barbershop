import BookingForm from "../../components/booking-form";
import { Suspense } from "react";

type BookingFormPageProps = {
  searchParams: Promise<{ layanan?: string; booking?: string }>;
};

async function BookingFormContent({
  searchParams,
}: BookingFormPageProps) {
  const { layanan, booking } = await searchParams;
  return (
    <BookingForm
      bookingId={booking}
      initialServiceId={layanan ?? ""}
      key={`${layanan ?? ""}:${booking ?? ""}`}
    />
  );
}

export default function BookingFormPage(props: BookingFormPageProps) {
  return (
    <Suspense
      fallback={
        <div className="customer-page" aria-busy="true">
          <p>Menyiapkan formulir booking...</p>
        </div>
      }
    >
      <BookingFormContent {...props} />
    </Suspense>
  );
}
