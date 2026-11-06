import ScheduleBoard from "../components/schedule-board";

export default function BarberSchedulePage() {
  return (
    <div className="customer-page">
      <header className="customer-page-heading">
        <h1>JADWAL KAPSTER</h1>
        <p>Lihat informasi kapster untuk tanggal yang Anda pilih.</p>
      </header>
      <ScheduleBoard />
    </div>
  );
}
