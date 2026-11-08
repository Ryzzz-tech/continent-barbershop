"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";
import LogoutButton from "@/app/components/logout-button";
import { useAppFeedback } from "@/app/components/app-feedback";

const navigationItems = [
  { href: "/owner", label: "Beranda" },
  { href: "/owner/laporan-transaksi", label: "Laporan Transaksi" },
  { href: "/owner/restock-produk", label: "Restock Produk" },
  { href: "/owner/kapster-kasir", label: "Kapster & Kasir" },
  { href: "/owner/layanan-produk", label: "Layanan & Produk" },
];

function OwnerNavigation({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="cashier-nav" aria-label="Menu Owner">
      {navigationItems.map((item) => {
        const active = item.href === "/owner"
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className="cashier-nav__link"
            href={item.href}
            key={item.href}
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

export default function OwnerShell({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { showToast } = useAppFeedback();

  return (
    <div className="cashier-app owner-app">
      <header className="cashier-mobile-bar">
        <Link href="/owner" aria-label="Continent Barbershop, Beranda Owner">
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
        aria-label="Navigasi Owner"
      >
        <Link className="cashier-brand" href="/owner">
          <Image
            alt="Continent Barbershop"
            height={220}
            src="/continent-barbershop-logo.png"
            width={220}
          />
        </Link>
        <Suspense fallback={<nav className="cashier-nav" aria-label="Menu Owner" />}>
          <OwnerNavigation onNavigate={() => setMobileMenuOpen(false)} />
        </Suspense>
        <div className="cashier-sidebar-account">
          <span>Akun Owner</span>
          <LogoutButton onError={(message) => showToast("Logout Gagal", message, "error")}>
            Logout
          </LogoutButton>
        </div>
      </aside>

      <main className="cashier-content">{children}</main>
    </div>
  );
}
