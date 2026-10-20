import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Next 14 uses middleware.ts, not proxy.ts. Protect every canonical admin
 * route at the edge; public token pages and the intake/API endpoints remain public.
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const publicPaths = ["/login", "/admin/login", "/q/", "/i/", "/c/", "/portal/", "/api/", "/inquire", "/quote/", "/invoice/", "/contract/"];
  if (publicPaths.some(p => path === p || (p.endsWith("/") && path.startsWith(p)))) return NextResponse.next();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(list) {
        list.forEach(({name,value}) => request.cookies.set(name,value));
        response = NextResponse.next({request});
        list.forEach(({name,value,options}) => response.cookies.set(name,value,options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", path + request.nextUrl.search);
    return NextResponse.redirect(url);
  }
  const {data:member,error} = await supabase.from("cs_admin_members").select("auth_user_id").eq("auth_user_id",user.id).maybeSingle();
  if (error || !member) {
    const url = new URL("/login",request.url);
    url.searchParams.set("error","This account is not authorized for Castaneda Strings admin.");
    return NextResponse.redirect(url);
  }
  return response;
}
export const config = { matcher: ["/dashboard/:path*", "/inquiries/:path*", "/quotes/:path*", "/invoices/:path*", "/contracts/:path*", "/clients/:path*", "/communications/:path*", "/settings/:path*", "/admin/:path*"] };
