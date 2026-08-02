import { describe, it, expect } from "vitest";
import { apiSuccess, apiError, apiNotFound, apiServerError } from "@/lib/api-helpers";

describe("apiSuccess", () => {
  it("should return 200 with JSON data and cache headers", async () => {
    const response = apiSuccess({ products: [] });
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual({ products: [] });

    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=3600, stale-while-revalidate=86400"
    );
  });

  it("should support custom status code", async () => {
    const response = apiSuccess({ created: true }, 201);
    expect(response.status).toBe(201);
  });
});

describe("apiError", () => {
  it("should return error response with status code", async () => {
    const response = apiError("Something went wrong", 502);
    expect(response.status).toBe(502);

    const body = await response.json();
    expect(body).toEqual({ error: "Something went wrong" });
  });
});

describe("apiNotFound", () => {
  it("should return 404 with default message", async () => {
    const response = apiNotFound();
    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body).toEqual({ error: "Resource not found" });
  });

  it("should return 404 with custom message", async () => {
    const response = apiNotFound("Category not found");
    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body).toEqual({ error: "Category not found" });
  });
});

describe("apiServerError", () => {
  it("should return 502 with default message", async () => {
    const response = apiServerError();
    expect(response.status).toBe(502);

    const body = await response.json();
    expect(body).toEqual({
      error: "Service temporarily unavailable. Please try again.",
    });
  });

  it("should return 502 with custom message", async () => {
    const response = apiServerError("Square API timeout");
    expect(response.status).toBe(502);

    const body = await response.json();
    expect(body).toEqual({ error: "Square API timeout" });
  });
});
