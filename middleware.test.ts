import { describe, it, expect } from "vitest";

// Import the pure helper for unit testing. The middleware's Clerk-dependent
// password-gate redirect is verified manually via the quickstart scenarios
// (VS-3 through VS-5), since `clerkMiddleware` requires Clerk configuration.
import { isExemptPath } from "@/middleware";

describe("isExemptPath", () => {
  it("should return true for the password page", () => {
    expect(isExemptPath("/password")).toBe(true);
    expect(isExemptPath("/password/")).toBe(true);
  });

  it("should return true for the password API", () => {
    expect(isExemptPath("/api/password")).toBe(true);
  });

  it("should return true for webhooks", () => {
    expect(isExemptPath("/api/webhooks/clerk")).toBe(true);
  });

  it("should return true for Clerk internal routes", () => {
    expect(isExemptPath("/__clerk/whatever")).toBe(true);
  });

  it("should return true for well-known assets", () => {
    expect(isExemptPath("/.well-known/security.txt")).toBe(true);
  });

  it("should return false for a non-exempt path", () => {
    expect(isExemptPath("/")).toBe(false);
    expect(isExemptPath("/shop/miniatures")).toBe(false);
    expect(isExemptPath("/products/space-marines")).toBe(false);
  });
});