import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const allowedOrigin = "http://localhost:3060";

function withCors(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
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
      return withCors(new NextResponse(null, { status: 204 }));
    }

    const publicApiRoutes = [
      "/api/auth/login",
      "/api/auth/users",
      "/api/loyverse/connect",
      "/api/loyverse/callback",
      "/api/loyverse/webhook",
    ];

    if (!publicApiRoutes.includes(pathname) && !token) {
      return withCors(
        NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
      );
    }

    return withCors(NextResponse.next());
  }

  // your page redirects below...
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/"],
};
