import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const session = req.cookies.get("aj_session")?.value;
  const { pathname } = req.nextUrl;
  if (pathname === "/admin" || pathname === "/admin/") {
    return NextResponse.redirect(new URL(session ? "/admin/dashboard" : "/admin/login", req.url));
  }
  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !session) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
  if (pathname.startsWith("/student") && !session) {
    const login = new URL("/login", req.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin", "/admin/:path*", "/student", "/student/:path*"] };
