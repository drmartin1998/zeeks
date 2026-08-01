import { z } from "zod";

const envSchema = z.object({
  SQUARE_ACCESS_TOKEN: z
    .string()
    .min(1, "SQUARE_ACCESS_TOKEN is required")
    .startsWith(
      "EAAA",
      "SQUARE_ACCESS_TOKEN should be a sandbox access token (starts with EAAA)"
    ),
  SQUARE_LOCATION_ID: z.string().min(1, "SQUARE_LOCATION_ID is required"),
  SQUARE_APPLICATION_ID: z.string().min(1, "SQUARE_APPLICATION_ID is required"),
  SQUARE_ENVIRONMENT: z
    .enum(["sandbox", "production"])
    .default("sandbox"),
});

function validateEnv() {
  const parsed = envSchema.safeParse({
    SQUARE_ACCESS_TOKEN: process.env.square_access_token,
    SQUARE_LOCATION_ID: process.env.square_location_id,
    SQUARE_APPLICATION_ID: process.env.square_application_id,
    SQUARE_ENVIRONMENT: process.env.SQUARE_ENVIRONMENT,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Square environment validation failed:\n${issues}\n\n` +
        "Ensure SQUARE_ACCESS_TOKEN, SQUARE_LOCATION_ID, and SQUARE_APPLICATION_ID are set in .env.local.\n" +
        "Run `vercel env pull` to fetch them from Vercel if needed."
    );
  }

  return parsed.data;
}

export const env = validateEnv();

export type Env = z.infer<typeof envSchema>;
