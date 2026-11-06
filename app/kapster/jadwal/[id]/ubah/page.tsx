import { Suspense } from "react";
import KapsterScheduleForm from "../../schedule-form";

async function EditScheduleContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <KapsterScheduleForm scheduleId={decodeURIComponent(id)} />;
}

export default function EditKapsterSchedulePage({
  params,
}: PageProps<"/kapster/jadwal/[id]/ubah">) {
  return (
    <Suspense fallback={<div className="kapster-page"><h1>Memuat formulir jadwal...</h1></div>}>
      <EditScheduleContent params={params} />
    </Suspense>
  );
}
