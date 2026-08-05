import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SITE_PASSWORD = process.env.SITE_PASSWORD;
const PASSWORD_PAGE = "/password";
const PUBLIC_FILE = /\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)$/;

function isPasswordValid(request: NextRequest): boolean {
  if (!SITE_PASSWORD) return true;
  const cookie = request.cookies.get("site_password");
  return cookie?.value === SITE_PASSWORD;
}

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;

  if (PUBLIC_FILE.test(pathname)) return NextResponse.next();
  if (pathname.startsWith("/password") || pathname.startsWith("/api/password")) return NextResponse.next();
  if (pathname.startsWith("/_next") || pathname.startsWith("/__clerk")) return NextResponse.next();

  if (SITE_PASSWORD && !isPasswordValid(request)) {
    return NextResponse.redirect(new URL(PASSWORD_PAGE, request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
