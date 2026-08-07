# Tasks: Sanity CMS Hero

**Input**: Design documents from `/specs/034-sanity-cms-hero/`

**Prerequisites**: plan.md ✅, spec.md ✅, checklists/ ✅

**Tests**: Following the Testing Trophy (Kent C. Dodds), the image URL helper is a unit test; the `Home`/`HeroSection` rendering is an integration test (RTL + MSW).

**Organization**: Tasks grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish quality baseline and verify existing Sanity infrastructure

- [x] T001 Verify the feature branch `034-sanity-cms-hero` and expected files exist (`spec.md`, `plan.md`, `checklists/requirements.md`, `features/sanity-cms-hero.feature`)
- [x] T002 Run `tsc --noEmit` — record baseline errors (note pre-existing test-file errors only)
- [x] T003 [P] Run `npm run lint` — record baseline (note pre-existing errors, if any)
- [x] T004 [P] Run `npm test` — record baseline failing suites (confirm no regressions)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the shared Sanity data-fetching + image-URL infrastructure that both user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Add `HOME_HERO_QUERY` to `lib/sanity/queries.ts` — fetch the first `heroBlock` from the home page document (slug `/`), including `_key`, `eyebrow`, `heading`, `subheading`, `image`, `primaryCta`, `secondaryCta`. Use `defineQuery`.
- [x] T006 Add a pure image URL helper (e.g. `lib/sanity/image.ts`) that converts a Sanity image asset `_ref` into a Sanity CDN URL using `@sanity/image-url` configured with the shared client. Handle a null/undefined asset by returning `null`.

**Checkpoint**: Foundation ready — `HOME_HERO_QUERY` and the image URL helper exist and are unit-tested.

---

## Phase 3: US1 — Render the hero from Sanity

**Purpose**: Make the home page hero fully driven by Sanity content.

- [x] T007 Refactor `components/hero-section.tsx` to be a prop-driven presentational component accepting `eyebrow`, `heading`, `subheading`, `imageUrl`, `primaryCta`, `secondaryCta`. Remove the hardcoded hero copy and the static `/images/hero-bg.png` reference.
- [x] T008 Wire `app/page.tsx` to fetch the hero via `sanityFetch({ query: HOME_HERO_QUERY })` server-side, resolve the image URL with the helper, and pass the block to `<HeroSection />`. Render the section only when content exists (or pass `null`).
- [x] T009 Integration test (RTL + MSW): `Home`/`HeroSection` renders the Sanity fixture — eyebrow, heading, subheading, background image URL, and both CTA labels/hrefs (US1 scenarios 1 & 2).

**Checkpoint**: The hero renders entirely from Sanity. Content updates will reflect on revalidation.

---

## Phase 4: US2 — Graceful fallback when hero content is missing

**Purpose**: Ensure the hero degrades gracefully when content is missing without substituting mock data.

- [x] T010 Ensure `HeroSection` renders a neutral/empty hero (no error, no broken image, no mock copy) when `heroBlock` or its image is missing.
- [x] T011 Ensure an unset CTA (no label or href) is omitted rather than rendered as a dead link.
- [x] T012 Integration test (RTL + MSW): missing `heroBlock`, missing image, and unset CTA states (US2 scenarios 1, 2, 3).

---

## Phase 5: Verification & Quality Gates

**Purpose**: Confirm the feature satisfies all scenarios and passes quality gates.

- [x] T013 Re-run `tsc --noEmit` — zero errors.
- [x] T014 Re-run `npm run lint` — zero errors.
- [x] T015 Re-run `npm test` — all new tests pass; no new regressions.
- [x] T016 Update `checklists/requirements.md` notes and mark all tasks complete in this file.