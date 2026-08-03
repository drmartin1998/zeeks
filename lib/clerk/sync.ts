import { createClerkClient } from "@clerk/backend";
import type { ClerkProfile } from "@/lib/square/types";

const clerkSecretKey = process.env.CLERK_SECRET_KEY;

let _clerkClient: ReturnType<typeof createClerkClient> | null = null;

function getClerkClient() {
  if (!_clerkClient) {
    if (!clerkSecretKey) {
      throw new Error("CLERK_SECRET_KEY is not configured");
    }
    _clerkClient = createClerkClient({ secretKey: clerkSecretKey });
  }
  return _clerkClient;
}

/**
 * Fetches the Clerk user profile for comparison with Square data.
 */
export async function getClerkProfile(
  userId: string,
): Promise<ClerkProfile> {
  const clerk = getClerkClient();
  const user = await clerk.users.getUser(userId);

  const primaryEmail = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId,
  );
  const primaryPhone = user.phoneNumbers.find(
    (p) => p.id === user.primaryPhoneNumberId,
  );

  return {
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    primaryEmail: primaryEmail?.emailAddress ?? null,
    primaryPhone: primaryPhone?.phoneNumber ?? null,
  };
}

/**
 * Syncs Clerk user profile to match Square data.
 * Only updates fields that differ. Non-blocking for email/phone.
 */
export async function syncClerkFromSquare(
  userId: string,
  givenName: string | undefined,
  familyName: string | undefined,
  emailAddress: string | undefined,
  phoneNumber: string | undefined,
): Promise<string | null> {
  const clerk = getClerkClient();
  const clerkProfile = await getClerkProfile(userId);

  const clerkErrors: string[] = [];

  // Sync name
  const squareGiven = givenName ?? "";
  const squareFamily = familyName ?? "";
  const nameChanged =
    clerkProfile.firstName !== squareGiven ||
    clerkProfile.lastName !== squareFamily;

  if (nameChanged) {
    try {
      await clerk.users.updateUser(userId, {
        firstName: squareGiven,
        lastName: squareFamily,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      clerkErrors.push(`Name sync failed: ${msg}`);
    }
  }

  // Sync email
  const squareEmail = emailAddress?.trim() || null;
  const clerkEmail = clerkProfile.primaryEmail;
  const emailChanged = squareEmail && clerkEmail !== squareEmail;

  if (emailChanged && squareEmail) {
    try {
      const currentUser = await clerk.users.getUser(userId);
      const existingEmail = currentUser.emailAddresses.find(
        (e) => e.emailAddress === squareEmail,
      );

      if (existingEmail) {
        await clerk.users.updateUser(userId, {
          primaryEmailAddressID: existingEmail.id,
        });
      } else {
        // Runtime method exists but isn't in the type declarations for this SDK version
        const usersApi = clerk.users as unknown as {
          createEmailAddress(params: {
            userId: string;
            emailAddress: string;
          }): Promise<{ id: string }>;
        };
        const created = await usersApi.createEmailAddress({
          userId,
          emailAddress: squareEmail,
        });
        await clerk.users.updateUser(userId, {
          primaryEmailAddressID: created.id,
        });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      clerkErrors.push(`Email sync failed: ${msg}`);
    }
  }

  // Sync phone
  const squarePhone = phoneNumber?.trim() || null;
  const clerkPhone = clerkProfile.primaryPhone;
  const phoneChanged = squarePhone && clerkPhone !== squarePhone;

  if (phoneChanged && squarePhone) {
    try {
      const currentUser = await clerk.users.getUser(userId);
      const existingPhone = currentUser.phoneNumbers.find(
        (p) => p.phoneNumber === squarePhone,
      );

      if (existingPhone) {
        await clerk.users.updateUser(userId, {
          primaryPhoneNumberID: existingPhone.id,
        });
      } else {
        const usersApi = clerk.users as unknown as {
          createPhoneNumber(params: {
            userId: string;
            phoneNumber: string;
          }): Promise<{ id: string }>;
        };
        const created = await usersApi.createPhoneNumber({
          userId,
          phoneNumber: squarePhone,
        });
        await clerk.users.updateUser(userId, {
          primaryPhoneNumberID: created.id,
        });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      clerkErrors.push(`Phone sync failed: ${msg}`);
    }
  }

  return clerkErrors.length > 0 ? clerkErrors.join("; ") : null;
}

/**
 * Detects mismatches between Square profile and Clerk profile.
 */
export function detectMismatch(
  squareGiven: string | undefined,
  squareFamily: string | undefined,
  squareEmail: string | undefined,
  squarePhone: string | undefined,
  clerk: ClerkProfile,
): boolean {
  return (
    clerk.firstName !== (squareGiven ?? "") ||
    clerk.lastName !== (squareFamily ?? "") ||
    (!!squareEmail && clerk.primaryEmail !== squareEmail) ||
    (!!squarePhone && clerk.primaryPhone !== squarePhone)
  );
}
