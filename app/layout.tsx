import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Nav from "@/components/Nav";
import { SITE } from "@/lib/config";
import "./globals.css";

const display = localFont({
  src: [
    { path: "./fonts/big-shoulders-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "./fonts/big-shoulders-latin-800-normal.woff2", weight: "800", style: "normal" },
    { path: "./fonts/big-shoulders-latin-900-normal.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
  adjustFontFallback: false,
});
const body = localFont({
  src: [
    { path: "./fonts/figtree-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/figtree-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/figtree-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./fonts/figtree-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "Legacy Group – Mariano Quarto 2026/27", template: "%s · Legacy Group" },
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: { type: "website", locale: "it_IT", siteName: "Legacy Group – Mariano Quarto"},
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: "#0a1b33", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${display.variable} ${body.variable}`}>
      <body>
        <a className="skip" href="#contenuto">
          Vai al contenuto
        </a>
        <Nav />
        <main id="contenuto">{children}</main>
        <footer>
          <div className="wrap">
            <b>Legacy Group</b> · Mariano Quarto · Oristano · Anno scolastico 2026–2027
            <br />
            Organizzato dai rappresentanti di istituto. Sul sito compaiono solo le sigle delle classi, mai i nomi degli studenti.
          </div>
        </footer>
      </body>
    </html>
  );
}
