import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { password } = (await request.json()) as { password?: string };

  if (password && password === process.env.SITE_PASSWORD) {
    const response = NextResponse.json({ success: true });
    response.cookies.set("site_password", password, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return response;
  }

  return NextResponse.json({ error: "Invalid password" }, { status: 401 });
}
