import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ONLY = ["/login", "/register"];
const BUYER_PATHS = ["/cart", "/checkout", "/orders", "/profile", "/dashboard"];
const SELLER_PATHS = ["/seller"];
const ADMIN_PATHS = ["/admin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get("zentra_token")?.value;
  const role = request.cookies.get("zentra_role")?.value;
  const isAuthenticated = !!token;

  // Public-only: redirect authenticated users away from login/register
  if (PUBLIC_ONLY.some((p) => pathname.startsWith(p))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Admin routes
  if (ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Seller routes
  if (SELLER_PATHS.some((p) => pathname.startsWith(p))) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (role !== "SELLER" && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Buyer-protected routes
  if (BUYER_PATHS.some((p) => pathname.startsWith(p))) {
    if (!isAuthenticated) {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/cart",
    "/cart/:path*",
    "/checkout",
    "/checkout/:path*",
    "/orders",
    "/orders/:path*",
    "/profile",
    "/profile/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/seller",
    "/seller/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
