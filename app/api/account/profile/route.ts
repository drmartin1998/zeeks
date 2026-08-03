import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCustomer, updateCustomer } from "@/lib/square/customers";
import { getSquareCustomerId } from "@/lib/webhooks/clerk";
import { getClerkProfile, syncClerkFromSquare, detectMismatch } from "@/lib/clerk/sync";
import { withRetry } from "@/lib/utils";
import { UpdateProfileInputSchema } from "@/lib/square/types";
import type { ProfileResponse } from "@/lib/square/types";

export async function GET(): Promise<NextResponse<ProfileResponse | { error: string }>> {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const squareCustomerId = await getSquareCustomerId(userId);
  if (!squareCustomerId) {
    return NextResponse.json(
      { error: "Account not yet synced with Square" },
      { status: 404 },
    );
  }

  try {
    const squareProfile = await withRetry(
      () => getCustomer(squareCustomerId),
      { maxRetries: 2, baseDelayMs: 1000 },
    );

    let clerkProfile = null;
    let clerkError: string | null = null;
    let mismatchDetected = false;

    try {
      clerkProfile = await getClerkProfile(userId);
      mismatchDetected = detectMismatch(
        squareProfile.givenName,
        squareProfile.familyName,
        squareProfile.emailAddress,
        squareProfile.phoneNumber,
        clerkProfile,
      );

      // Silently sync Clerk on mismatch (background, non-blocking)
      if (mismatchDetected) {
        syncClerkFromSquare(
          userId,
          squareProfile.givenName,
          squareProfile.familyName,
          squareProfile.emailAddress,
          squareProfile.phoneNumber,
        ).catch((err) => {
          console.error(
            `Background Clerk sync failed for user ${userId}:`,
            err instanceof Error ? err.message : err,
          );
        });
      }
    } catch (error) {
      clerkError = "Clerk profile temporarily unavailable";
      console.error(
        `Clerk profile fetch failed for user ${userId}:`,
        error instanceof Error ? error.message : error,
      );
    }

    return NextResponse.json({
      squareProfile,
      clerkProfile,
      clerkError,
      mismatchDetected,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error(`Failed to load profile for user ${userId}: ${msg}`);
    return NextResponse.json(
      { error: "Unable to load profile. Please try again." },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: Request,
): Promise<NextResponse<{ success: boolean; squareError?: string | null; clerkError?: string | null; passwordError?: string | null } | { error: string }>> {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const squareCustomerId = await getSquareCustomerId(userId);
  if (!squareCustomerId) {
    return NextResponse.json(
      { error: "Account not yet synced with Square" },
      { status: 404 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = UpdateProfileInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const input = parsed.data;

  // Determine which sections need updating
  const hasPersonalChanges =
    input.givenName !== undefined ||
    input.familyName !== undefined ||
    input.emailAddress !== undefined ||
    input.phoneNumber !== undefined;

  const hasAddressChanges =
    input.address !== undefined &&
    (input.address.addressLine1 !== undefined ||
      input.address.locality !== undefined ||
      input.address.administrativeDistrictLevel1 !== undefined ||
      input.address.postalCode !== undefined);

  let squareError: string | null = null;
  let clerkError: string | null = null;

  // Write personal info + address to Square (single call)
  if (hasPersonalChanges || hasAddressChanges) {
    const squareUpdates: {
      givenName?: string;
      familyName?: string;
      emailAddress?: string;
      phoneNumber?: string;
      address?: {
        addressLine1?: string;
        locality?: string;
        administrativeDistrictLevel1?: string;
        postalCode?: string;
      };
    } = {};

    if (hasPersonalChanges) {
      if (input.givenName !== undefined) squareUpdates.givenName = input.givenName;
      if (input.familyName !== undefined) squareUpdates.familyName = input.familyName;
      if (input.emailAddress !== undefined) squareUpdates.emailAddress = input.emailAddress;
      if (input.phoneNumber !== undefined) squareUpdates.phoneNumber = input.phoneNumber;
    }

    if (hasAddressChanges && input.address) {
      squareUpdates.address = {};
      if (input.address.addressLine1 !== undefined) squareUpdates.address.addressLine1 = input.address.addressLine1;
      if (input.address.locality !== undefined) squareUpdates.address.locality = input.address.locality;
      if (input.address.administrativeDistrictLevel1 !== undefined) squareUpdates.address.administrativeDistrictLevel1 = input.address.administrativeDistrictLevel1;
      if (input.address.postalCode !== undefined) squareUpdates.address.postalCode = input.address.postalCode;
    }

    try {
      await withRetry(
        () => updateCustomer(squareCustomerId, squareUpdates),
        { maxRetries: 2, baseDelayMs: 1000 },
      );
    } catch (error) {
      squareError =
        error instanceof Error ? error.message : "Square update failed";
    }
  }

  // Sync personal info to Clerk (only if Square write succeeded)
  if (hasPersonalChanges && !squareError) {
    try {
      const syncError = await withRetry(
        () =>
          syncClerkFromSquare(
            userId,
            input.givenName,
            input.familyName,
            input.emailAddress,
            input.phoneNumber,
          ),
        { maxRetries: 3, baseDelayMs: 1000 },
      );

      if (syncError) {
        clerkError = syncError;
      }
    } catch (error) {
      clerkError =
        error instanceof Error ? error.message : "Clerk sync failed";
    }
  }

  return NextResponse.json({
    success: !squareError,
    squareError,
    clerkError,
  });
}
