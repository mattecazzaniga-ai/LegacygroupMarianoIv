import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Aggiorna la sessione di login dell'area admin. Il sito pubblico non usa cookie. */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let response = NextResponse.next({ request });
  if (!url || !key) return response;
  const sb = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await sb.auth.getUser();
  // appena inserito il PIN giusto: se il telefono non ha tenuto i cookie, lo dico invece di tornare muti al PIN
  if (request.nextUrl.searchParams.get("da") === "pin" && (!data.user || !request.cookies.get("lg_pin"))) {
    const msg = "PIN giusto, ma il browser non ha salvato l'accesso. Se hai aperto il link da WhatsApp o Instagram, aprilo in Safari o Chrome; controlla che i cookie non siano bloccati.";
    return NextResponse.redirect(new URL("/admin/login?err=" + encodeURIComponent(msg), request.url), 303);
  }
  return response;
}

export const config = { matcher: ["/admin/:path*"] };
