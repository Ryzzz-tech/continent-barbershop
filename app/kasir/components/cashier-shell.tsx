"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";
import LogoutButton from "@/app/components/logout-button";
import { useCashierPrototype } from "../cashier-context";

const navigationItems = [
  { href: "/kasir", label: "Beranda", key: "home" },
  { href: "/kasir/booking", label: "Catat Booking", key: "booking" },
  { href: "/kasir/transaksi", label: "Catat Transaksi", key: "transaction" },
  { href: "/kasir/pelanggan", label: "Data Pelanggan", key: "customers" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/kasir") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function CashierNavigation({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="cashier-nav" aria-label="Menu Kasir">
      {navigationItems.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className="cashier-nav__link"
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

export default function CashierShell({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { notice, announce, clearNotice } = useCashierPrototype();

  return (
    <div className="cashier-app">
      <header className="cashier-mobile-bar">
        <Link href="/kasir" aria-label="Continent Barbershop, Beranda Kasir">
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
          className="cashier-menu-toggle"
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
          className="cashier-sidebar-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          type="button"
        />
      )}

      <aside
        className={`cashier-sidebar${mobileMenuOpen ? " is-open" : ""}`}
        aria-label="Navigasi Kasir"
      >
        <Link className="cashier-brand" href="/kasir">
          <Image
            alt="Continent Barbershop"
            height={220}
            src="/continent-barbershop-logo.png"
            width={220}
          />
        </Link>
        <Suspense fallback={<nav className="cashier-nav" aria-label="Menu Kasir" />}>
          <CashierNavigation onNavigate={() => setMobileMenuOpen(false)} />
        </Suspense>
        <div className="cashier-sidebar-account">
          <span>Akun Kasir</span>
          <LogoutButton redirectTo="/karyawan/login" onError={announce}>
            Keluar
          </LogoutButton>
        </div>
      </aside>

      <main className="cashier-content">{children}</main>
      {notice && (
        <div className="cashier-toast" role="status">
          <span>{notice}</span>
          <button onClick={clearNotice} type="button">
            Tutup
          </button>
        </div>
      )}
    </div>
  );
}
