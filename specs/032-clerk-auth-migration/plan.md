# Implementation Plan: Clerk Auth Migration (createRouteMatcher)

**Branch**: `032-clerk-auth-migration` | **Date**: 2026-08-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/032-clerk-auth-migration/spec.md`

## Summary

Remove the deprecated Clerk `createRouteMatcher` usage from the middleware, replacing it with framework-native path matching for the existing site password gate. Keep `clerkMiddleware()` and the `config.matcher` export intact (required for Clerk to work). Add Clerk's `@clerk/eslint-plugin` with the `require-auth-protection` rule to enforce ongoing resource-level auth protection (clarification Q1). The site password gate behavior and all resource-based auth checks remain unchanged.

## Technical Context

**Language/Version**: TypeScript 5 (strict), Next.js 16 (App Router), Clerk `@clerk/nextjs` ^7.6.4

**Primary Dependencies**: `@clerk/nextjs`, `@clerk/eslint-plugin` (new dev dependency), ESLint 9 (flat config)

**Storage**: N/A

**Testing**: Vitest (unit + integration), Playwright (E2E)

**Target Platform**: Vercel (Node.js serverless)

**Project Type**: Next.js web application (App Router)

**Performance Goals**: No change — middleware and auth behavior are unchanged

**Constraints**: The password gate must behave identically (FR-002); no `createRouteMatcher` usage remains (FR-001); `clerkMiddleware()` and `config.matcher` retained (FR-005); protected resources keep their `auth()` checks (FR-006); the lint rule is added (FR-009)

**Scale/Scope**: 1 middleware file; 1 ESLint config; verification of existing resource auth checks

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Server Components First | PASS | Auth checks remain in server components/routes via `auth()`; no client-side auth changes |
| II | API Route Security | PASS | Protected API routes keep their `auth()` checks; middleware is not an auth gate |
| III | Type-Safe Data Flow | PASS | No new data types; middleware/ESLint config are typed (TypeScript) |
| IV | Vercel-Native Performance | PASS | No performance impact; middleware + config.matcher unchanged |
| V | Progressive Enhancement | PASS | No rendering changes; resource-based auth already in place |
| VI | Gherkin-First Testing | PASS | `.feature` file exists with 7 scenarios. Integration/manual verification for the password gate and auth checks |
| VII | Environment-Driven Configuration | PASS | `SITE_PASSWORD` env var unchanged; no new config secrets |

## Project Structure

### Documentation (this feature)

```text
specs/032-clerk-auth-migration/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
├── features/
│   └── clerk-auth-migration.feature
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
middleware.ts                      # MODIFY: replace createRouteMatcher with native path matching for the password gate; keep clerkMiddleware + config.matcher
eslint.config.mjs                 # MODIFY: register @clerk/eslint-plugin with the require-auth-protection rule
package.json                      # MODIFY: add @clerk/eslint-plugin devDependency
```

**Structure Decision**: The migration touches the middleware (path matching) and the ESLint config (lint rule). No new components or data paths. The `clerkMiddleware()` and `config.matcher` are preserved.

## Research (Phase 0)

Resolved in [research.md](./research.md). Key decisions:
- **Native path matching**: replace `createRouteMatcher([...])` with a manual check against `req.nextUrl.pathname` for the exempt routes list (password, api/password, api/webhooks, __clerk, .well-known).
- **Lint rule config**: add `@clerk/eslint-plugin` and configure `require-auth-protection` with `protected`/`public` globs matching the app's folder structure (all pages protected except sign-in/sign-up).
- **No middleware auth gate**: the middleware's `createRouteMatcher` was only the password gate, not Clerk auth; Clerk auth is already resource-based.

## Complexity Tracking

No constitution violations. All seven principles pass without exception.