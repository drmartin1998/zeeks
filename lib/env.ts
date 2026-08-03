import { z } from "zod";

const envSchema = z.object({
  SQUARE_ACCESS_TOKEN: z
    .string()
    .min(1, "SQUARE_ACCESS_TOKEN is required"),
  SQUARE_LOCATION_ID: z.string().min(1, "SQUARE_LOCATION_ID is required"),
  SQUARE_APPLICATION_ID: z.string().min(1, "SQUARE_APPLICATION_ID is required"),
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
  SQUARE_LOYALTY_PROGRAM_ID: z.string().optional(),
});

function validateEnv() {
  const parsed = envSchema.safeParse({
    SQUARE_ACCESS_TOKEN: process.env.square_access_token,
    SQUARE_LOCATION_ID: process.env.square_location_id,
    SQUARE_APPLICATION_ID: process.env.square_application_id,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    SQUARE_LOYALTY_PROGRAM_ID: process.env.SQUARE_LOYALTY_PROGRAM_ID,
  });

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

export type Env = z.infer<typeof envSchema>;
