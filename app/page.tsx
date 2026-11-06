import Link from "next/link";
import BarberChairIllustration from "./components/barber-chair-illustration";
import SiteHeader from "./components/site-header";

export default function Home() {
  return (
    <>
      <SiteHeader variant="home" />

      <main className="home-page">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero__copy">
            <h1 id="hero-title">
              <span>Potong Rambut</span>
              <span>Buat Penampilan</span>
              <span>Lebih Baik</span>
            </h1>
            <p className="hero__description">
              Kami siap memberikan layanan potong rambut dengan kualitas terbaik
              dan harga terjangkau
            </p>
            <a className="booking-button" href="#booking" aria-disabled="true">
              Booking Sekarang
            </a>
            <p className="registration">
              Belum punya akun?{" "}
              <Link href="/register">
                Daftar Sekarang
              </Link>
            </p>
          </div>

          <BarberChairIllustration
            className="hero__visual"
            alt="Kursi barber klasik Continent Barbershop"
          />
        </section>
      </main>
    </>
  );
}
