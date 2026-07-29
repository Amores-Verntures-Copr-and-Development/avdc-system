import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const allowedOrigins = [
  "http://localhost:3060",
  "http://localhost:3100",
  "http://192.168.0.28:3100",
  "http://100.106.185.109:3100",
  "http://100.88.166.17:3100",
  "http://192.168.0.240:3010",
];

function withCors(request: NextRequest, response: NextResponse) {
  const origin = request.headers.get("origin");

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }

  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );

  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("avdc_accessToken")?.value;
  const customerToken = request.cookies.get("avdc_customerAccessToken")?.value;
  if (pathname.startsWith("/api")) {
    if (request.method === "OPTIONS") {
      return withCors(request, new NextResponse(null, { status: 204 }));
    }
    const publicApiRoutes = [
      "/api/auth/login",
      "/api/auth/users",
      "/api/loyverse/connect",
      "/api/loyverse/callback",
      "/api/loyverse/webhook",
      "/api/overview",
      "/api/auth/customers/register/st-martins",
      "/api/auth/customers/verify-email",
      "/api/auth/customers/resend-verification",
      "/api/auth/customers/forgot-password",
      "/api/auth/customers/verify-password-reset",
      "/api/auth/customers/reset-password",
      "/api/auth/customers/login",
      "/api/products/st-martins-cafe",
      "api/auth/customers/me",
    ];
    if (!publicApiRoutes.includes(pathname) && !token && !customerToken) {
      return withCors(
        request,
        NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
      );
    }

    return withCors(request, NextResponse.next());
  }
  const publicApiRoutes = [
    "/api/auth/login",
    "/api/auth/users",
    "/api/auth/customers/register/st-martins",
  ];
  if (publicApiRoutes.includes(pathname)) {
    return NextResponse.next();
  }

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
    "/pos",
    "/account",
    "/isr",
    "/orders",
  ];
  const isProtectedPage = protectedPages.some((route) =>
    pathname.startsWith(route),
  );
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
    "/api/:path*",
    "/",
    "/login",
    "/dashboard/:path*",
    "/categories/:path*",
    "/customers/:path*",
    "/employees/:path*",
    "/inventory/:path*",
    "/procurement-history/:path*",
    "/products/:path*",
    "/purchase-orders/:path*",
    "/requisitions/:path*",
    "/sales/:path*",
    "/stock-room/:path*",
    "/stores/:path*",
    "/suppliers/:path*",
    "/users/:path*",
    "/store-selection/:path*",
    "/pos/:path*",
    "/account/:path*",
    "/isr/:path*",
    "/orders/:path*",
  ],
};
