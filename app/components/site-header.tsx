import Image from "next/image";
import Link from "next/link";

type SiteHeaderProps = {
  variant: "home" | "account" | "employee";
  activePage?: "login" | "register";
};

export default function SiteHeader({
  variant,
  activePage,
}: SiteHeaderProps) {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link
          className="brand"
          href="/"
          aria-label="Continent Barbershop, Beranda"
        >
          <Image
            src="/continent-barbershop-logo.png"
            alt="Continent Barbershop"
            width={256}
            height={256}
            priority
          />
        </Link>

        <nav className="main-navigation" aria-label="Navigasi utama">
          {variant === "home" ? (
            <>
              <Link className="navigation-slot navigation-slot--home" href="/" aria-current="page">
                Beranda
              </Link>
              <Link className="navigation-slot navigation-slot--login" href="/login">
                Login Pelanggan
              </Link>
              <Link className="navigation-slot navigation-slot--third" href="/karyawan/login">
                Login sebagai Karyawan
              </Link>
            </>
          ) : variant === "employee" ? (
            <>
              <Link className="navigation-slot navigation-slot--home" href="/">
                Beranda
              </Link>
              <span className="navigation-slot navigation-slot--login" aria-hidden="true" />
              <Link
                className="navigation-slot navigation-slot--third"
                href="/karyawan/login"
                aria-current="page"
              >
                Login sebagai Karyawan
              </Link>
            </>
          ) : (
            <>
              <Link className="navigation-slot navigation-slot--home" href="/">
                Beranda
              </Link>
              <Link
                className="navigation-slot navigation-slot--login"
                href="/login"
                aria-current={activePage === "login" ? "page" : undefined}
              >
                Login
              </Link>
              <Link
                className="navigation-slot navigation-slot--third"
                href="/register"
                aria-current={activePage === "register" ? "page" : undefined}
              >
                Registrasi
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
