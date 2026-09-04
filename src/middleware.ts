import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE_NAME = "leadflow_auth_token";
const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "leadflow_jwt_secret_change_in_production_998877"
);

// Public auth routes accessible without authentication
const PUBLIC_AUTH_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

// Public API endpoints
const PUBLIC_API_PATHS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Skip static assets, internal Next.js routes, and icons
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/static") ||
    pathname.includes(".") // file extensions like .ico, .svg, .png, etc.
  ) {
    return NextResponse.next();
  }

  const isPublicAuthPage = PUBLIC_AUTH_PATHS.some((path) =>
    pathname === path || pathname.startsWith(`${path}/`)
  );
  const isPublicApiRoute = PUBLIC_API_PATHS.some((path) =>
    pathname === path || pathname.startsWith(`${path}/`)
  );

  // 2. Extract and verify token
  const tokenCookie = req.cookies.get(AUTH_COOKIE_NAME);
  let isAuthenticated = false;

  if (tokenCookie?.value) {
    try {
      await jwtVerify(tokenCookie.value, JWT_SECRET);
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  }

  // Handle Chrome Extension CORS preflight and requests
  const origin = req.headers.get("origin") || "";
  const isExtension = origin.startsWith("chrome-extension://");

  if (pathname.startsWith("/api/")) {
    if (req.method === "OPTIONS") {
      const preflight = new NextResponse(null, { status: 204 });
      if (isExtension) {
        preflight.headers.set("Access-Control-Allow-Origin", origin);
        preflight.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
        preflight.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        preflight.headers.set("Access-Control-Allow-Credentials", "true");
        preflight.headers.set("Access-Control-Max-Age", "86400");
      }
      return preflight;
    }
  }

  // 3. Handle public API routes - allow through
  if (isPublicApiRoute) {
    const res = NextResponse.next();
    if (isExtension) {
      res.headers.set("Access-Control-Allow-Origin", origin);
      res.headers.set("Access-Control-Allow-Credentials", "true");
    }
    return res;
  }

  // 4. Authenticated user attempting to visit login/signup/forgot-password
  if (isAuthenticated && isPublicAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 5. Unauthenticated user attempting to visit protected pages
  if (!isAuthenticated && !isPublicAuthPage) {
    // For protected API routes, let route handlers return structured 401 JSON
    if (pathname.startsWith("/api/")) {
      const apiRes = NextResponse.next();
      if (isExtension) {
        apiRes.headers.set("Access-Control-Allow-Origin", origin);
        apiRes.headers.set("Access-Control-Allow-Credentials", "true");
      }
      return apiRes;
    }

    // For dashboard pages, redirect to /login
    const redirectUrl = new URL("/login", req.url);
    if (pathname !== "/") {
      redirectUrl.searchParams.set("redirect", pathname);
    }

    const response = NextResponse.redirect(redirectUrl);
    // Clear invalid/expired cookie if present
    if (tokenCookie) {
      response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: "",
        maxAge: 0,
        path: "/",
      });
    }
    return response;
  }

  const finalRes = NextResponse.next();
  if (pathname.startsWith("/api/") && isExtension) {
    finalRes.headers.set("Access-Control-Allow-Origin", origin);
    finalRes.headers.set("Access-Control-Allow-Credentials", "true");
  }
  return finalRes;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
