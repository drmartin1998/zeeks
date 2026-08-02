import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

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
    },
  },
]);

export default eslintConfig;
