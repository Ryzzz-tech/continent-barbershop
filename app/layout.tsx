import type { Metadata } from "next";
import { Jomhuria, Jomolhari } from "next/font/google";
import "./globals.css";

const jomhuria = Jomhuria({
  variable: "--font-jomhuria",
  subsets: ["latin"],
  weight: "400",
});

const jomolhari = Jomolhari({
  variable: "--font-jomolhari",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Continent Barbershop",
  description:
    "Kami siap memberikan layanan potong rambut dengan kualitas terbaik dan harga terjangkau.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${jomhuria.variable} ${jomolhari.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
