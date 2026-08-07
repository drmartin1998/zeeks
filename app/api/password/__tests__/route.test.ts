import { describe, it, expect, afterEach } from "vitest";

const originalEnv = process.env.SITE_PASSWORD;

describe("POST /api/password", () => {
  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.SITE_PASSWORD;
    } else {
      process.env.SITE_PASSWORD = originalEnv;
    }
  });

  it("should set the site_password cookie with a 24-hour maxAge (86400)", async () => {
    process.env.SITE_PASSWORD = "secret";
    const { POST } = await import("@/app/api/password/route");

    const request = new Request("http://localhost:3000/api/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "secret" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("site_password=");
    // 24 hours = 86400 seconds
    expect(setCookie).toContain("Max-Age=86400");
    expect(setCookie).not.toContain("Max-Age=604800");
  });

  it("should return 401 for an incorrect password", async () => {
    process.env.SITE_PASSWORD = "secret";
    const { POST } = await import("@/app/api/password/route");

    const request = new Request("http://localhost:3000/api/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "wrong" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});