import BookingForm from "../../components/booking-form";
import { Suspense } from "react";

type BookingFormPageProps = {
  searchParams: Promise<{ layanan?: string }>;
};

async function BookingFormContent({
  searchParams,
}: BookingFormPageProps) {
  const { layanan } = await searchParams;
  return <BookingForm initialServiceId={layanan ?? ""} key={layanan ?? ""} />;
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
