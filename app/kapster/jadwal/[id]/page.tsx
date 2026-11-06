import { Suspense } from "react";
import KapsterScheduleDetail from "./schedule-detail";

async function ScheduleDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <KapsterScheduleDetail scheduleId={decodeURIComponent(id)} />;
}

export default function KapsterScheduleDetailPage({
  params,
}: PageProps<"/kapster/jadwal/[id]">) {
  return (
    <Suspense fallback={<div className="kapster-page"><h1>Memuat detail jadwal...</h1></div>}>
      <ScheduleDetailContent params={params} />
    </Suspense>
  );
}
