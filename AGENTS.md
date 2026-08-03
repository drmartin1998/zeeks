# AGENTS.md — Zeeks Coding Harness

This file defines the mandatory workflow and constraints for **every AI coding agent**
working on this project. It is the single source of truth for agent behavior.
The [Constitution](.specify/memory/constitution.md) is the supreme authority;
this document translates it into actionable agent rules.

# Next.js: ALWAYS read docs before coding
 
Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

---

## Pre-Flight Checklist (MUST run before ANY code)

Before writing a single line of code, verify:

```
☐ 1. Spec-kit flow followed (specify → gherkin-sync → plan → checklist)
☐ 2. .feature file exists at specs/<feature>/features/<slug>.feature
☐ 3. Constitution checked (plan.md includes Constitution Check section)
☐ 4. Port 3000 status checked (never start a duplicate dev server)
☐ 5. tsc --noEmit passes
☐ 6. npm run lint passes (0 errors)
```

---

## Rule 1 — Spec-Kit Flow (NON-NEGOTIABLE)

**Never write code without first creating the specification.** The mandatory flow is:

| Order | Command | Output | Gate |
|-------|---------|--------|------|
| 1 | `/speckit-specify` | `specs/<feature>/spec.md` | User stories with `Given/When/Then` acceptance scenarios |
| 2 | `/speckit-gherkin-sync` (auto hook) | `specs/<feature>/features/<slug>.feature` | At least one `Scenario:` per user story |
| 3 | `/speckit-plan` | `specs/<feature>/plan.md` | Constitution Check passed |
| 4 | `/speckit-checklist` | `specs/<feature>/checklists/requirements.md` | All FRs covered |
| 5 | `/speckit-tasks` | `specs/<feature>/tasks.md` | Tasks grouped by user story with [P] markers |
| 6 | `/speckit-implement` | Code | 🟢 GHERKIN GATE: `.feature` file must exist |

### Step-by-Step Approval

**The agent MUST pause and request explicit user approval after EVERY step before proceeding to the next.** Never chain multiple steps without user confirmation:

1. Run `/speckit-specify` → output the spec → **WAIT for user approval**
2. Run `/speckit-gherkin-sync` → output the `.feature` file → **WAIT for user approval**
3. Run `/speckit-plan` → output the plan → **WAIT for user approval**
4. Run `/speckit-checklist` → output the checklist → **WAIT for user approval**
5. Run `/speckit-tasks` → output the task list → **WAIT for user approval**
6. Run `/speckit-implement` → output the code → verify quality gates

**The agent MUST NOT proceed to step N+1 until the user explicitly approves step N.** If the user says "continue" or "proceed", advance exactly one step and pause again.

### Gherkin-First Policy

- A `.feature` file MUST exist **before** any implementation starts.
- Every user story gets at least one `Scenario:` with `Given`/`When`/`Then`.
- Code MUST satisfy the acceptance criteria expressed in Gherkin scenarios.
- **Hard block**: Step 2 of `/speckit-implement` fails if no `.feature` file.
- Reference: `.clinerules/gherkin-policy.md`

---

## Rule 2 — No Mock Data in Production

Mock/hardcoded data MUST NEVER be used as a fallback on the live site.

- **Allowed**: Test files (`*.test.*`, `__tests__/`), MSW handlers, test setup.
- **Forbidden in production**: `lib/data.ts`, `lib/data/products.ts` imports, `FALLBACK_*` constants, sync in-memory lookups replacing API calls.
- **On API failure**: Show error states (404, empty state, hidden sections) — never substitute mock data.
- Reference: `.clinerules/rules/no-mock-data-in-production.md`

---

## Rule 3 — Constitution Compliance

The [Constitution](.specify/memory/constitution.md) defines 7 core principles. Every `plan.md` MUST include a Constitution Check verifying all 7:

| # | Principle | Key Rule |
|---|-----------|----------|
| I | Server Components First | Data fetching in async RSC; `"use client"` only at leaf nodes |
| II | API Route Security | Square API through Route Handlers; tokens NEVER exposed to browser |
| III | Type-Safe Data Flow | TypeScript strict mode; explicit interfaces in `lib/square/types.ts`; `@/*` imports only |
| IV | Component Architecture | shadcn/ui components; Tailwind utility classes; `cn()` for merging |
| V | Performance & Caching | `next/image`, `next/font`; cache Square responses |
| VI | Gherkin-First Testing (Testing Trophy) | Integration > Unit > E2E > Static; RTL+MSW for integration |
| VII | No Mock Data Fallback | Live Square data only; graceful error states on failure |

**Violations**: Document in plan.md's Complexity Tracking table with justification.

---

## Rule 4 — Testing (Testing Trophy)

Investment priority: **Integration > Unit > E2E > Static**

| Layer | Tool | What to test |
|-------|------|-------------|
| Static | `tsc --noEmit`, `npm run lint` | Every line (foundation) |
| Unit | Vitest | Pure logic, Zod schemas, utilities, data transforms |
| Integration | RTL + user-event + MSW | Client Components, Route Handlers, Server Actions |
| E2E | Playwright | Critical user journeys only (checkout, search) |

### Query Priority (always use in this order)
1. `getByRole` / `getByLabelText`
2. `getByPlaceholderText`
3. `getByText`
4. `getByTestId` ← LAST RESORT

### NEVER
- Mock child components (`vi.mock("./Child")`) — mock at network (MSW)
- Shallow rendering — always `render()`
- Test implementation details (state, props internals)
- `data-testid` as first query choice
- Snapshot tests

Reference: `.clinerules/testing.md`, `tests/SKILL.md`

---

## Rule 5 — Dev Server

- **ALWAYS use `vercel dev`** — never `npm run dev` or `next dev`.
- Check `lsof -ti:3000` before starting. If running, **reuse it**.
- Never kill the user's dev server process.

Reference: `.clinerules/dev-server.md`

---

## Rule 6 — Branching, Commits & Merges

- NEVER commit directly to `main`.
- Branch naming: `<###>-<short-name>` (e.g., `003-subcategory-filtering`).
- Branch from up-to-date `main` (`git pull --rebase origin main` first).
- PR required with at least one review before merge to `main`.
- Delete feature branch after merge.

---

## Rule 7 — Quality Gates (before considering work "done")

Run these commands and verify zero failures:

```bash
tsc --noEmit          # TypeScript — must pass
npm run lint          # ESLint — 0 errors
npm test              # Vitest — all suites pass
npm run test:e2e      # Playwright — critical paths pass
```

---

## Rule 7 - Bug Fixes

- Whenever a task is explicitly identified as a bug, regression, or unhandled exception, immediately halt execution.
- Delegate the task context to the specialized `.opencode/agents/bug-agent` workflow profile.
- Do not attempt code remediation inside the standard feature-authoring loop.

---

## Quick Reference: Common Mistakes This Agent Makes

| Mistake | Correction |
|---------|-----------|
| Writing code without a spec | Run `/speckit-specify` first |
| Skipping the `.feature` file | Run `/speckit-gherkin-sync` before implement |
| Racing through all spec-kit steps without pausing | Pause after EACH step; wait for user approval before proceeding |
| Using `??` for mock data fallback | Remove fallback; show error state instead |
| Importing from `@/lib/data` in production | Only test files may import mock data modules |
| Starting `vercel dev` without checking port 3000 | Run `lsof -ti:3000` first |
| Using relative imports (`../`) | Always use `@/*` path alias |
| Mocking child components in tests | Mock at network boundary with MSW |

---

## Appendix A — Gherkin-First Policy (FULL TEXT)

Source: `.clinerules/gherkin-policy.md`

All feature work in this project follows a **Gherkin-first** development policy.
This is enforced by the spec-kit Gherkin extension (.specify/extensions/gherkin/)
and the speckit-implement workflow rule.

### The Policy

1. **Before any implementation**, a declarative Gherkin `.feature` file MUST exist
   at `specs/<feature>/features/<feature-slug>.feature`
2. The `.feature` file is auto-generated by `/speckit-gherkin-sync` (runs as a
   hook after `/speckit-specify` and before `/speckit-implement`)
3. Every user story from the spec MUST have at least one corresponding `Scenario:`
   with `Given`, `When`, and `Then` steps
4. Implementation code MUST satisfy the acceptance criteria expressed in the
   Gherkin scenarios
5. When updating an existing feature, the `.feature` file MUST be updated first
   (or verified as current) before modifying any implementation code

### Why

- Acceptance criteria are captured in a standard, executable format
- Implementation is validated against declarative scenarios
- Traceability from user story → acceptance criteria → test → code
- Living documentation that grows with the project

### Enforcement

- The `before_implement` hook auto-runs `/speckit-gherkin-sync`
- Step 2 of `/speckit-implement` (GHERKIN GATE) is a hard block if no
  `.feature` file exists
- Every implementation task must reference the relevant `@US{N}` scenario

---

## Appendix B — Testing Rules (FULL TEXT)

Source: `.clinerules/testing.md`

When writing or suggesting tests for this project, follow these rules.

### Testing Trophy (Kent C. Dodds)

Investment priority: Integration > Unit > E2E > Static

```
         ╱  E2E (Playwright)       ← few tests, critical paths only
        ╱   Integration (RTL+MSW)  ← MOST tests live here
       ╱    Unit (Vitest)          ← pure logic, utilities
      ╱     Static (TS/ESLint)     ← foundation, every line
```

### Tooling

| Layer | Tool |
|-------|------|
| Static | TypeScript (`tsc --noEmit`), ESLint (`npm run lint`) |
| Unit | Vitest (`vitest`, `vitest run`) |
| Integration | Vitest + @testing-library/react + @testing-library/user-event + MSW |
| E2E | Playwright (`playwright test`) |

### Query Priority (Testing Library)

1. `getByRole` / `getByLabelText` ← ALWAYS FIRST
2. `getByPlaceholderText`
3. `getByText`
4. `getByTestId` ← LAST RESORT

### File Location

- Unit + Integration: `__tests__/` co-located alongside the source module
- E2E: `tests/e2e/`
- Setup: `tests/setup/vitest-setup.ts`

### What to Test (by Feature Type)

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

### NEVER DO

- Mock child components (`vi.mock("./Child")`) — mock at network (MSW)
- Shallow rendering (`shallow()`) — always use `render()`
- Test implementation details (state, props internals, method names)
- `data-testid` as first query choice
- Snapshot tests — use explicit assertions
- 100% coverage target — focus on confidence
- Test React/Next.js internals — test YOUR code

### Test Naming

- File: `<module-name>.test.ts` or `.test.tsx`
- Describe: module/function/component name
- It: "should <expected behavior> when <condition>"

### Before Writing Any Test

1. Run `tsc --noEmit` — type errors must be zero
2. Run `npm run lint` — lint warnings must be zero
3. Check `tests/SKILL.md` and constitution for detailed guidance

---

## Appendix C — Dev Server Rules (FULL TEXT)

Source: `.clinerules/dev-server.md`

The user frequently runs the dev server (`vercel dev` on port 3000) while
an AI agent is working. Starting a second dev server causes port conflicts.

### Rule

**BEFORE running `vercel dev` or any command that starts the local server:**

1. Check if port 3000 is already in use:
   ```bash
   lsof -ti:3000 || ss -tlnp 'sport = :3000' 2>/dev/null || true
   ```
2. If the port is in use, **DO NOT start another dev server**. Instead:
   - Run `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` to
     verify the server is responsive.
   - If responsive, use the existing server. Do not kill it — the user may
     be actively using it.
   - If not responsive (e.g., stale process), ask the user before killing it.
3. If port 3000 is free, start the dev server with `vercel dev`.
   - **ALWAYS use `vercel dev` instead of `npm run dev` or `next dev`.**
   - `vercel dev` pulls environment variables from Vercel and mirrors the
     production environment, including Square API credentials and
     `VERCEL_URL`.

### For E2E Tests

Playwright tests use `process.env.VERCEL_URL` for CI or fall back to
`http://localhost:3000` locally. When running E2E tests locally:
- Use the existing dev server if already running
- Only start `vercel dev` if port 3000 is free

---

## Appendix D — No Mock Data in Production (FULL TEXT)

Source: `.clinerules/rules/no-mock-data-in-production.md`

Mock/hardcoded data MUST NEVER be used as a fallback on the live running site.
Mock data is ONLY permitted in test files (`*.test.*`, `__tests__/`) and test
utilities (MSW handlers, test setup).

### What Counts as Mock Data

- Hardcoded product arrays (e.g., `const PRODUCTS = [...]`)
- Hardcoded category lists (e.g., `const CATEGORIES = [...]`)
- Hardcoded navigation items that mirror real Square-managed entities
- Any `FALLBACK_*` constants that duplicate production data structures
- Synchronous in-memory lookups that replace API calls

### What Does NOT Count as Mock Data

- Application constants that are not data (e.g., filter option labels, sort choices)
- Static navigation links that are NOT Square-managed (e.g., "About Us", "Locations")
- UI configuration (e.g., color tokens, layout values)
- `STATIC_NAV_CATEGORIES` — these are informational page links, not catalog data

### Enforcement

1. **Production code paths** (pages, server components, data-fetching functions)
   MUST pull data from Square or other live APIs. No hardcoded fallback.

2. **On API failure**: show appropriate error states (404, error page, empty state
   with a message) — never silently substitute mock data.

3. **Test files only**: `lib/data.ts`, `lib/data/products.ts`, and similar
   mock-data modules may be imported EXCLUSIVELY by test files
   (`**/*.test.*`, `**/__tests__/**`). Any non-test import is a violation.

4. **Before merging**: CI must verify no production code imports mock data modules.
