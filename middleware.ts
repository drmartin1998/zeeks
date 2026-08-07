import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/** Path prefixes that bypass the site password gate. */
const EXEMPT_PREFIXES = [
  "/password",
  "/api/password",
  "/api/webhooks",
  "/__clerk",
  "/.well-known",
];

/**
 * Whether a pathname is exempt from the site password gate.
 *
 * Replaces the deprecated Clerk `createRouteMatcher` with framework-native
 * path matching. A path is exempt if it equals an exempt prefix or starts with
 * one (e.g., `/password`, `/api/webhooks/clerk`).
 */
export function isExemptPath(pathname: string): boolean {
  return EXEMPT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export default clerkMiddleware(async (_auth, req) => {
  const sitePassword = process.env.SITE_PASSWORD;

  if (sitePassword && !isExemptPath(req.nextUrl.pathname)) {
    const cookie = req.cookies.get("site_password");
    if (cookie?.value !== sitePassword) {
      const url = new URL("/password", req.url);
      url.searchParams.set("returnTo", req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};