# AGENTS.md — Zeeks Coding Harness

This file defines the mandatory workflow and constraints for **every AI coding agent**
working on this project. It is the single source of truth for agent behavior.
The [Constitution](.specify/memory/constitution.md) is the supreme authority;
this document translates it into actionable agent rules.

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
| 5 | `/speckit-implement` | Code | 🟢 GHERKIN GATE: `.feature` file must exist |

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

## Quick Reference: Common Mistakes This Agent Makes

| Mistake | Correction |
|---------|-----------|
| Writing code without a spec | Run `/speckit-specify` first |
| Skipping the `.feature` file | Run `/speckit-gherkin-sync` before implement |
| Using `??` for mock data fallback | Remove fallback; show error state instead |
| Importing from `@/lib/data` in production | Only test files may import mock data modules |
| Starting `vercel dev` without checking port 3000 | Run `lsof -ti:3000` first |
| Using relative imports (`../`) | Always use `@/*` path alias |
| Mocking child components in tests | Mock at network boundary with MSW |
