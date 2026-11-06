import ServiceBrowser from "../components/service-browser";

export default function ServicesPage() {
  return (
    <div className="customer-page">
      <header className="customer-page-heading">
        <h1>LAYANAN KAMI</h1>
        <p>
          Pilih layanan perawatan yang sesuai dengan kebutuhan dan gaya Anda.
        </p>
      </header>
      <ServiceBrowser />
    </div>
  );
}
