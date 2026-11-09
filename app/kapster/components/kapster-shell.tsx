"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import LogoutButton from "@/app/components/logout-button";

const navigationItems = [
  { href: "/kapster", label: "Beranda", key: "home" },
  { href: "/kapster/booking", label: "Daftar Booking", key: "bookings" },
  { href: "/kapster/jadwal", label: "Jadwal & Ketersediaan", key: "schedule" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/kapster") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function KapsterNavigation({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="cashier-nav kapster-nav" aria-label="Menu Kapster">
      {navigationItems.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className="cashier-nav__link kapster-nav__link"
            href={item.href}
            key={item.key}
            onClick={onNavigate}
          >
            {item.label}
            {active && <span aria-hidden="true" />}
          </Link>
        );
      })}
    </nav>
  );
}

export default function KapsterShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");

  return (
    <div className="cashier-app kapster-app">
      <header className="cashier-mobile-bar kapster-mobile-bar">
        <Link href="/kapster" aria-label="Continent Barbershop, Beranda Kapster">
          <Image
            alt="Continent Barbershop"
            height={54}
            src="/continent-barbershop-logo.png"
            width={54}
          />
        </Link>
        <button
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
          className="cashier-menu-toggle kapster-menu-toggle"
          onClick={() => setMobileMenuOpen((open) => !open)}
          type="button"
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      {mobileMenuOpen && (
        <button
          aria-label="Tutup menu"
          className="cashier-sidebar-backdrop kapster-sidebar-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          type="button"
        />
      )}

      <aside
        className={`cashier-sidebar kapster-sidebar${mobileMenuOpen ? " is-open" : ""}`}
        aria-label="Navigasi Kapster"
      >
        <Link className="cashier-brand kapster-brand" href="/kapster">
          <Image
            alt="Continent Barbershop"
            height={220}
            src="/continent-barbershop-logo.png"
            width={220}
          />
        </Link>
        <Suspense fallback={<nav className="cashier-nav kapster-nav" aria-label="Menu Kapster" />}>
          <KapsterNavigation onNavigate={() => setMobileMenuOpen(false)} />
        </Suspense>
        <div className="cashier-sidebar-account kapster-sidebar-account">
          <span>Akun Saya</span>
          <LogoutButton redirectTo="/karyawan/login" onError={setNotice}>
            Keluar
          </LogoutButton>
        </div>
      </aside>

      <main className="cashier-content kapster-content">{children}</main>
      {notice && (
        <div className="cashier-toast kapster-toast" role="status">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} type="button">
            Tutup
          </button>
        </div>
      )}
    </div>
  );
}
