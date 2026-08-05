import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { password } = (await request.json()) as { password?: string };
    const sitePassword = process.env.SITE_PASSWORD;

    if (password && sitePassword && password === sitePassword) {
      const response = NextResponse.json({ success: true });
      response.cookies.set("site_password", password, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      return response;
    }

    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
