import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("avdc_accessToken")?.value;

  // ✅ Public API routes that don't require authentication
  const publicApiRoutes = ["/api/auth/login", "/api/auth/users"];
  if (publicApiRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // ✅ Block other API routes if no token
  if (pathname.startsWith("/api") && !token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // ✅ Define protected pages (EXCLUDING login)
  const protectedPages = [
    "/categories",
    "/customers",
    "/dashboard",
    "/employees",
    "/inventory",
    "/procurement-history",
    "/products",
    "/purchase-orders",
    "/requisitions",
    "/sales",
    "/stock-room",
    "/stores",
    "/suppliers",
    "/users",
    "/store-selection",
  ];

  const isProtectedPage = protectedPages.some((route) =>
    pathname.startsWith(route)
  );

  // ✅ Handle root path - redirect to dashboard if logged in, otherwise to login
  if (pathname === "/") {
    if (token) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    } else {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  // ✅ Redirect to login if accessing protected page without token
  if (isProtectedPage && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // ✅ Redirect to dashboard if accessing login page with token
  if (pathname === "/login" && token) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/categories/:path*",
    "/customers/:path*",
    "/dashboard/:path*",
    "/employees/:path*",
    "/inventory/:path*",
    "/procurement-history/:path*",
    "/products/:path*",
    "/purchase-orders/:path*",
    "/requisitions/:path*",
    "/sales/:path*",
    "/stock-room/:path*",
    "/stores/:path*",
    "/users/:path*",
    "/suppliers/:path*",
    "/api/:path*",
  ],
};
