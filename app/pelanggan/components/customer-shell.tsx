"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Suspense,
  useState,
  type ReactNode,
} from "react";
import { CustomerPrototypeProvider } from "./customer-context";

const navigationItems = [
  { href: "/pelanggan", label: "Beranda", key: "home" },
  { href: "/pelanggan/layanan", label: "Layanan", key: "services" },
  {
    href: "/pelanggan/jadwal-kapster",
    label: "Jadwal Kapster",
    key: "schedule",
  },
  { href: "/pelanggan/booking", label: "Booking Saya", key: "bookings" },
  {
    href: "/pelanggan/riwayat-transaksi",
    label: "Riwayat Transaksi",
    key: "transactions",
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/pelanggan") return pathname === href;
  if (
    href === "/pelanggan/booking" &&
    pathname === "/pelanggan/pembayaran"
  ) {
    return true;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function CustomerSidebar({
  onNavigate,
  onSignOut,
}: {
  onNavigate?: () => void;
  onSignOut: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="customer-sidebar" aria-label="Navigasi pelanggan">
      <Link
        aria-label="Continent Barbershop, Beranda pelanggan"
        className="customer-sidebar__brand"
        href="/pelanggan"
        onClick={onNavigate}
      >
        <Image
          alt="Continent Barbershop"
          height={312}
          src="/continent-barbershop-logo.png"
          width={312}
        />
      </Link>

      <nav className="customer-sidebar__nav" aria-label="Menu pelanggan">
        {navigationItems.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className="customer-sidebar__link"
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

      <div className="customer-sidebar__account">
        <span>Akun Saya</span>
        <button onClick={onSignOut} type="button">
          Keluar
        </button>
      </div>
    </aside>
  );
}

export default function CustomerShell({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");

  function showPrototypeNotice() {
    setNotice("Fitur akun belum terhubung pada prototipe frontend.");
    setMobileMenuOpen(false);
  }

  return (
    <CustomerPrototypeProvider>
      <div className="customer-app">
        <div className="customer-mobile-bar">
          <Link href="/pelanggan" aria-label="Continent Barbershop, Beranda pelanggan">
            <Image
              alt="Continent Barbershop"
              height={64}
              src="/continent-barbershop-logo.png"
              width={64}
            />
          </Link>
          <button
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
            className="customer-menu-toggle"
            onClick={() => setMobileMenuOpen((open) => !open)}
            type="button"
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        {mobileMenuOpen && (
          <button
            aria-label="Tutup menu"
            className="customer-sidebar-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            type="button"
          />
        )}
        <div
          className={`customer-sidebar-wrap${mobileMenuOpen ? " is-open" : ""}`}
        >
          <Suspense
            fallback={<aside className="customer-sidebar" aria-hidden="true" />}
          >
            <CustomerSidebar
              onNavigate={() => setMobileMenuOpen(false)}
              onSignOut={showPrototypeNotice}
            />
          </Suspense>
        </div>

        <main className="customer-content">{children}</main>
        {notice && (
          <div className="customer-toast" role="status">
            <span>{notice}</span>
            <button onClick={() => setNotice("")} type="button">
              Tutup
            </button>
          </div>
        )}
      </div>
    </CustomerPrototypeProvider>
  );
}
