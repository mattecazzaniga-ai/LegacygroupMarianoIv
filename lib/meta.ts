import type { Metadata } from "next";

/** Titolo, descrizione e anteprima social coerenti per ogni pagina. */
export function meta(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", locale: "it_IT", siteName: "Legacy Group – Mariano Quarto", title: `${title} · Legacy Group`, description, url: path },
    twitter: { card: "summary_large_image", title: `${title} · Legacy Group`, description },
  };
}
