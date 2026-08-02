import { createClerkClient } from "@clerk/backend";

const clerkSecretKey = process.env.CLERK_SECRET_KEY;

/**
 * Clerk Backend SDK client for server-side user operations.
 * Initialized lazily — only created once per process.
 */
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

/** Key used in Clerk's privateMetadata to store the Square customer ID. */
export const SQUARE_CUSTOMER_ID_KEY = "squareCustomerId";

/**
 * Reads the Square customer ID from a Clerk user's private metadata.
 * Returns the ID string if present, or null if not set.
 */
export async function getSquareCustomerId(
  userId: string,
): Promise<string | null> {
  const clerkClient = getClerkClient();
  const user = await clerkClient.users.getUser(userId);
  const metadata = user.privateMetadata as Record<string, unknown>;
  return (metadata[SQUARE_CUSTOMER_ID_KEY] as string) ?? null;
}

/**
 * Saves a Square customer ID to a Clerk user's private metadata.
 * Uses deep-merge semantics (PATCH) so other metadata keys are preserved.
 */
export async function setSquareCustomerId(
  userId: string,
  squareCustomerId: string,
): Promise<void> {
  const clerkClient = getClerkClient();
  await clerkClient.users.updateUserMetadata(userId, {
    privateMetadata: {
      [SQUARE_CUSTOMER_ID_KEY]: squareCustomerId,
    },
  });
}
