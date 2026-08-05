import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const exemptFromPassword = createRouteMatcher([
  "/password(.*)",
  "/api/password(.*)",
  "/api/webhooks(.*)",
  "/__clerk(.*)",
  "/.well-known(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const sitePassword = process.env.SITE_PASSWORD;

  if (sitePassword && !exemptFromPassword(req)) {
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
