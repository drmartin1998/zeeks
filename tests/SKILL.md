---
name: tests
description: >
  Write and run tests following Kent C. Dodds' Testing Trophy. Static analysis
  (TypeScript/ESLint) as base, integration tests (React Testing Library + MSW)
  as the largest investment, unit tests for pure logic, and E2E (Playwright)
  for critical user journeys. Test behavior, not implementation details.
---

# Testing

Write tests following the **Testing Trophy** by Kent C. Dodds. The size of each
layer in the trophy represents the relative investment you should make.

## The Testing Trophy (Zeeks Edition)

```
         ╱  E2E (Playwright)        ← few tests, critical paths
        ╱   Integration (RTL+MSW)   ← MOST tests live here
       ╱    Unit (Vitest)           ← pure logic, utilities
      ╱     Static (TS/ESLint)      ← foundation, every line covered
```

## When to Use

- User asks to "write tests", "add tests", "test this"
- User mentions "unit test", "integration test", "e2e test"
- During `/speckit-implement` when implementing user stories
- After creating a new component, route handler, or utility

## Testing Trophy Layers

### 1. Static Analysis (BASE — Already Configured)

No additional commands needed — these run on every build and commit:

| Tool | Command | What it catches |
|------|---------|-----------------|
| TypeScript | `tsc --noEmit` | Type errors, null safety, missing props |
| ESLint | `npm run lint` | Accessibility, hooks rules, unused imports |
| Prettier | `npx prettier --check .` | Formatting consistency |

**GATE**: `tsc --noEmit` and `npm run lint` MUST pass before any test run.

### 2. Unit Tests (Vitest)

Test pure logic with NO React rendering and NO network calls.

**What to unit test:**
- Zod schemas (`lib/env.ts`, API route validators)
- Data transform functions (sorting, filtering, price formatting)
- Utility functions (`lib/utils.ts` helpers)
- Pure hooks logic (extracted from components)

**What NOT to unit test:**
- Component rendering (use integration tests)
- API route handlers (use integration tests)
- React hooks with side effects (use integration tests)

**File location:** `__tests__/` co-located alongside the module.

### 3. Integration Tests (React Testing Library + MSW)

Test how units work together. These give the highest confidence-to-effort ratio.

**What to integration test:**
- Route Handlers with mocked Square API (MSW intercepts `fetch`)
- Client Components rendered with `@testing-library/react`
- User interactions via `@testing-library/user-event`
- Server Actions called from forms

**Testing Library query priority:**
1. `getByRole` — always first choice (accessible, semantic)
2. `getByLabelText` — for form fields
3. `getByPlaceholderText` — fallback for inputs
4. `getByText` — for non-interactive text
5. `getByTestId` — LAST RESORT only

### 4. E2E Tests (Playwright)

Test critical user journeys against a real browser. Fewest tests, highest
value per test.

**What to E2E test:**
- Happy-path checkout flow (browse → add to cart → checkout)
- Search and filter functionality
- Authentication flow (if added)
- Mobile responsiveness on key pages

**File location:** `tests/e2e/`.

## Setup & Configuration

### Install dependencies

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event msw jsdom @vitejs/plugin-react \
  @playwright/test
```

### vitest.config.ts

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup/vitest-setup.ts"],
    globals: true,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname) },
  },
});
```

### tests/setup/vitest-setup.ts

```ts
import "@testing-library/jest-dom/vitest";
```

### package.json scripts (add to existing)

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### playwright.config.ts

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 5"] } },
  ],
});
```

## Integration Test Examples

### Component test
```tsx
// components/__tests__/pagination.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Pagination } from "../product-listing/pagination";

describe("Pagination", () => {
  it("calls onPageChange with clicked page number", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />
    );
    await user.click(screen.getByRole("button", { name: "Page 3" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
```

### Route Handler test
```ts
// app/api/__tests__/products.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const server = setupServer(
  http.get("https://connect.squareup.com/v2/catalog/list", () =>
    HttpResponse.json({ objects: [] })
  )
);
beforeAll(() => server.listen());
afterAll(() => server.close());

describe("GET /api/products", () => {
  it("returns products from Square catalog", async () => {
    const res = await fetch("http://localhost:3000/api/products");
    expect(res.status).toBe(200);
    expect(await res.json()).toHaveProperty("products");
  });
});
```

### E2E test
```ts
// tests/e2e/product-listing.spec.ts
import { test, expect } from "@playwright/test";

test("browse board games category", async ({ page }) => {
  await page.goto("/shop/board-games");
  await expect(page.getByRole("heading", { name: "Board Games" }))
    .toBeVisible();
});
```

## Anti-Patterns (NEVER DO)

- Testing implementation details — don't test state, props internals,
  or component method names. Test what the USER sees and does.
- Mocking child components — `vi.mock("./Child")` hides real bugs.
  Mock at the NETWORK boundary (MSW) instead.
- Shallow rendering — use `render()`, never `shallow()`.
- Testing `useEffect` directly — test the behavior it produces.
- `data-testid` as first choice — only when roles/text/labels don't work.
- Snapshot tests — brittle, low signal. Use explicit assertions.
- 100% code coverage target — aim for confidence, not a number.
- Testing the framework — don't test that React renders. Test YOUR code.

## Test Naming Conventions

- Test file: `<module-name>.test.ts` or `<module-name>.test.tsx`
- Describe block: The module/function/component name
- It block: "should <expected behavior> when <condition>"

## Test Coverage by Feature Type

| Feature type | Static | Unit | Integration | E2E |
|-------------|--------|------|-------------|-----|
| Zod schema / validation | Yes | Yes | — | — |
| Pure utility function | Yes | Yes | — | — |
| Data transform (sort/filter) | Yes | Yes | — | — |
| React Client Component | Yes | — | **Yes** | — |
| Route Handler (API) | Yes | — | **Yes** | — |
| Server Action | Yes | — | **Yes** | — |
| Server Component (async) | Yes | — | **Yes** | — |
| Checkout flow | Yes | — | — | **Yes** |
| Search + filter journey | Yes | — | — | **Yes** |