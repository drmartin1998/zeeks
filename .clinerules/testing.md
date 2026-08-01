# Testing Rules for Zeeks

When writing or suggesting tests for this project, follow these rules.

## Testing Trophy (Kent C. Dodds)

Investment priority: Integration > Unit > E2E > Static

```
         ╱  E2E (Playwright)       ← few tests, critical paths only
        ╱   Integration (RTL+MSW)  ← MOST tests live here
       ╱    Unit (Vitest)          ← pure logic, utilities
      ╱     Static (TS/ESLint)     ← foundation, every line
```

## Tooling

| Layer | Tool |
|-------|------|
| Static | TypeScript (`tsc --noEmit`), ESLint (`npm run lint`) |
| Unit | Vitest (`vitest`, `vitest run`) |
| Integration | Vitest + @testing-library/react + @testing-library/user-event + MSW |
| E2E | Playwright (`playwright test`) |

## Query Priority (Testing Library)

1. `getByRole` / `getByLabelText` ← ALWAYS FIRST
2. `getByPlaceholderText`
3. `getByText`
4. `getByTestId` ← LAST RESORT

## File Location

- Unit + Integration: `__tests__/` co-located alongside the source module
- E2E: `tests/e2e/`
- Setup: `tests/setup/vitest-setup.ts`

## What to Test (by Feature Type)

| Feature | Unit | Integration | E2E |
|---------|------|-------------|-----|
| Zod schema | Yes | — | — |
| Pure utility | Yes | — | — |
| Data transform | Yes | — | — |
| React Client Component | — | **Yes** | — |
| Route Handler | — | **Yes** | — |
| Server Action | — | **Yes** | — |
| Server Component | — | **Yes** | — |
| Checkout flow | — | — | **Yes** |
| Search journey | — | — | **Yes** |

## NEVER DO

- ❌ Mock child components (`vi.mock("./Child")`) — mock at network (MSW)
- ❌ Shallow rendering (`shallow()`) — always use `render()`
- ❌ Test implementation details (state, props internals, method names)
- ❌ `data-testid` as first query choice
- ❌ Snapshot tests — use explicit assertions
- ❌ 100% coverage target — focus on confidence
- ❌ Test React/Next.js internals — test YOUR code

## Test Naming

- File: `<module-name>.test.ts` or `.test.tsx`
- Describe: module/function/component name
- It: "should <expected behavior> when <condition>"

## Before Writing Any Test

1. Run `tsc --noEmit` — type errors must be zero
2. Run `npm run lint` — lint warnings must be zero
3. Check `tests/SKILL.md` and constitution for detailed guidance
