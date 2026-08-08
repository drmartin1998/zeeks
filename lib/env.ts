import { z } from "zod";

const envSchema = z.object({
  SQUARE_ACCESS_TOKEN: z
    .string()
    .min(1, "SQUARE_ACCESS_TOKEN is required"),
  SQUARE_LOCATION_ID: z.string().min(1, "SQUARE_LOCATION_ID is required"),
  SQUARE_APPLICATION_ID: z.string().min(1, "SQUARE_APPLICATION_ID is required"),
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
  SQUARE_LOYALTY_PROGRAM_ID: z.string().optional(),
  /**
   * Square API environment: "sandbox" or "production".
   * Defaults to "sandbox" in development; must be explicitly "production"
   * to hit the live Square API (Constitution VII).
   */
  SQUARE_ENVIRONMENT: z
    .enum(["sandbox", "production"])
    .default(
      process.env.NODE_ENV === "production" ? "production" : "sandbox"
    ),
  /** Resend API key for transactional email (order confirmations). */
  RESEND_API_KEY: z.string().optional(),
  /** Square webhook notification URL (must match the registered URL). */
  SQUARE_WEBHOOK_URL: z.string().optional(),
  /** Square webhook signature key for event verification. */
  SQUARE_WEBHOOK_SIGNATURE_KEY: z.string().optional(),
});

const envSchemaResult = envSchema.safeParse({
  SQUARE_ACCESS_TOKEN:
    process.env.square_access_token || process.env.SQUARE_ACCESS_TOKEN,
  SQUARE_LOCATION_ID:
    process.env.square_location_id || process.env.SQUARE_LOCATION_ID,
  SQUARE_APPLICATION_ID:
    process.env.square_application_id || process.env.SQUARE_APPLICATION_ID,
  CLERK_SECRET_KEY:
    process.env.CLERK_SECRET_KEY,
  SQUARE_LOYALTY_PROGRAM_ID:
    process.env.SQUARE_LOYALTY_PROGRAM_ID,
  SQUARE_ENVIRONMENT:
    process.env.SQUARE_ENVIRONMENT || process.env.square_environment,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  SQUARE_WEBHOOK_URL: process.env.SQUARE_WEBHOOK_URL,
  SQUARE_WEBHOOK_SIGNATURE_KEY: process.env.SQUARE_WEBHOOK_SIGNATURE_KEY,
});

function validateEnv() {
  const parsed = envSchemaResult;

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Square environment validation failed:\n${issues}\n\n` +
        "Ensure SQUARE_ACCESS_TOKEN, SQUARE_LOCATION_ID, SQUARE_APPLICATION_ID, and CLERK_SECRET_KEY are set in .env.local.\n" +
        "Run `vercel env pull` to fetch them from Vercel if needed."
    );
  }

  return parsed.data;
}

export const env = validateEnv();

/** True when running against the Square sandbox environment. */
export const isSandbox = env.SQUARE_ENVIRONMENT === "sandbox";

export type Env = z.infer<typeof envSchema>;
