import { NextResponse } from "next/server";
import type { ErrorResponse } from "@/lib/square/types";

/**
 * Returns a 200 JSON success response with Cache-Control headers.
 */
export function apiSuccess<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control":
        "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

/**
 * Returns a JSON error response with the given status code.
 */
export function apiError(
  message: string,
  status: number
): NextResponse<ErrorResponse> {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Returns a 404 JSON error response.
 */
export function apiNotFound(
  message = "Resource not found"
): NextResponse<ErrorResponse> {
  return apiError(message, 404);
}

/**
 * Returns a 502 JSON error response for Square SDK failures.
 */
export function apiServerError(
  message = "Service temporarily unavailable. Please try again."
): NextResponse<ErrorResponse> {
  return apiError(message, 502);
}
