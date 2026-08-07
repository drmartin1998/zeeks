# Implementation Plan: Password Gate Redesign

**Branch**: `033-password-gate-redesign` | **Date**: 2026-08-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/033-password-gate-redesign/spec.md`

## Summary

Redesign the site-wide password gate page to match the new Figma `password-gate` layout (dark purple background with a central glow and ember accents, Zeeks logo header, "SOMETHING EPIC IS COMING" headline, password form with an "UNLOCK EARLY ACCESS" button, and a footer with launch info and social links). Preserve the existing password validation and `returnTo` redirect logic. Change the `site_password` cookie expiration from 7 days to **24 hours**.

## Technical Context

**Language/Version**: TypeScript 5 (strict), React 19, Next.js 16 (App Router)

**Primary Dependencies**: Tailwind CSS 4, Lucide React (for social icons), shadcn/ui (`Input`, `Button`)

**Storage**: N/A — the password gate uses the `SITE_PASSWORD` env var and a `site_password` cookie

**Testing**: Vitest (unit + integration via RTL), Playwright (E2E)

**Target Platform**: Vercel (Node.js serverless)

**Project Type**: Next.js web application (App Router)

**Performance Goals**: No change — the password page is a single lightweight page

**Constraints**: Preserve the password validation and `returnTo` redirect (FR-002/003/004); cookie expires in 24 hours (FR-005); no gate when `SITE_PASSWORD` unset (FR-006); responsive (FR-007); match the Figma layout (FR-001)

**Scale/Scope**: 1 page (`app/password/page.tsx`), 1 API route (`app/api/password/route.ts`), possibly a small dedicated component; 1 cookie maxAge change

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Server Components First | PASS | The password page is a client leaf node (needs form state/hooks); the API route is a Route Handler; no server component change |
| II | API Route Security | PASS | Password validation stays server-side in `app/api/password/route.ts`; `SITE_PASSWORD` stays server-only |
| III | Type-Safe Data Flow | PASS | No new data types; existing password form logic retained |
| IV | Vercel-Native Performance | PASS | Single lightweight page; no performance impact |
| V | Progressive Enhancement | PASS | The password form is a native `<form>` that submits to the API; works without JS |
| VI | Gherkin-First Testing | PASS | `.feature` file exists with 7 scenarios. Component test for the new page; cookie-expiration test |
| VII | Environment-Driven Configuration | PASS | `SITE_PASSWORD` env var unchanged |

## Project Structure

### Documentation (this feature)

```text
specs/033-password-gate-redesign/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
├── features/
│   └── password-gate-redesign.feature
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
app/password/
└── page.tsx                       # MODIFY: redesign per Figma layout (dark theme, logo, headline, form, footer)
app/api/password/
└── route.ts                       # MODIFY: change cookie maxAge from 7 days to 24 hours (60*60*24)
components/auth/
└── password-gate-form.tsx         # NEW: extract the password form into a reusable client component (optional, if it cleans up the page)
```

**Structure Decision**: Next.js App Router. The password page (`app/password/page.tsx`) is redesigned inline (or with a small extracted form component) to match the Figma layout. The API route's cookie `maxAge` is changed to 24 hours. Social/launch content is static markup.

## Research (Phase 0)

Resolved in [research.md](./research.md). Key decisions:
- **Design tokens**: map the Figma colors to Tailwind utilities (dark bg `#120E29`-ish, purple glow, orange button `#E8950E`, white headline).
- **Cookie expiration**: change `maxAge: 60*60*24*7` → `maxAge: 60*60*24` (24 hours) in `app/api/password/route.ts`.
- **Form structure**: keep the existing `PasswordForm` submit logic; restructure the JSX to the new dark layout.

## Complexity Tracking

No constitution violations. All seven principles pass without exception.