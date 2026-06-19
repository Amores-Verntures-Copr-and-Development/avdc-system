import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const allowedOrigins = [
  "http://localhost:3060",
  "http://localhost:3100",
  "http://192.168.0.28:3100/",
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
    ];

    if (!publicApiRoutes.includes(pathname) && !token) {
      return withCors(
        request,
        NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
      );
    }

    return withCors(request, NextResponse.next());
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/"],
};
