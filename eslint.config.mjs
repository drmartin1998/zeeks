import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import clerkNext from "@clerk/eslint-plugin/next";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Block production imports of mock data modules (Constitution VII, FR-002/FR-003)
  // Note: @/lib/data/categories is allowed — it fetches from Square SDK
  {
    plugins: { "@clerk/next": clerkNext },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/data$", "@/lib/data/products"],
              message:
                "Mock data imports are forbidden in production. Use @/lib/square/catalog or fetch() to Route Handlers instead.",
            },
          ],
        },
      ],
      // Enforce auth protection on the genuinely protected folders. This app
      // is a public storefront, so only account/cart/checkout are protected.
      // The rule is set to warn (not error) because the app uses the `auth()`
      // destructuring pattern, which this experimental rule does not recognize
      // as equivalent to `await auth.protect()`; scoping to protected folders
      // avoids false positives on the many public pages.
      "@clerk/next/require-auth-protection": [
        "warn",
        {
          protected: ["app/account/**", "app/cart/**", "app/checkout/**"],
        },
      ],
    },
  },
]);

export default eslintConfig;
