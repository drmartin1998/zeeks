# Tasks: About Us Page

**Feature**: 026-about-us-page | **Branch**: `026-about-us-page`
**Generated**: 2026-08-04 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Implementation Strategy

This is a single-file static page feature with one associated footer fix. All three user stories modify the same file (`app/about/page.tsx`), so tasks within those phases are sequential. The footer fix in `components/footer.tsx` is independent and can be parallelized with the page file.

**MVP Scope**: Phase 3 (US1) alone delivers a working About page with the store's story and branded header — sufficient for visitors to learn about the store.

---

## Phase 1: Setup

No setup tasks — no new dependencies, no project initialization needed.

---

## Phase 2: Foundational

No foundational tasks — this is a standalone static page with no shared infrastructure.

---

## Phase 3: User Story 1 — Learn About the Store (Priority: P1)

**Goal**: Create the About page at `/about` with a branded hero header and the store's founding narrative.

**Independent Test**: Navigate to `/about`, verify the page returns HTTP 200, displays "Our Story" headline and the founding story paragraph in the branded layout.

- [x] T001 [US1] Create `app/about/page.tsx` as a Server Component with the page structure wrapper (`<div>` → `<main>` → content → `<Footer />`), matching the home page layout pattern in `app/page.tsx`
- [x] T002 [US1] Add hero header section to `app/about/page.tsx` following the `CategoryHero` pattern from `components/product-listing/category-hero.tsx`: dark background (`bg-neutral-900`), breadcrumbs (Home → About Us), headline "Our Story" in `font-heading text-status-sale`, subheadline "About us" below
- [x] T003 [US1] Add the founding story paragraph to `app/about/page.tsx`: "Zeek's Comics and Games opened late summer of 2015. For the past 10 Years we have been an innovative, engaging and growing community of nerdy customers, fans and family." in the light-background content area below the hero

---

## Phase 4: User Story 2 — Find Store Information (Priority: P2)

**Goal**: Display product specialties and store address in a scannable format, visually distinct from the narrative.

**Independent Test**: View the About page, verify "New Comics", "Miniature War Gaming", and the full address text are present and visually separated from the story content.

- [x] T004 [US2] Add specialties section to `app/about/page.tsx` with a section heading (e.g., "What We Offer") and the specialties paragraph: "At Zeek's we specialize in New Comics, Miniature War Gaming, Role-playing Games, Card Games and more! We strive to offer you customer service, selection and flexibility for all of your hobby and nerdy related needs."
- [x] T005 [US2] Add store address section to `app/about/page.tsx` with a section heading (e.g., "Visit Us") and the address: "30 Cherry Tree Shopping Center, Suite A4, Washington, IL 61571", styled to be visually distinct from narrative text (e.g., bordered card or muted background)

---

## Phase 5: User Story 3 — Navigate from About Page (Priority: P3)

**Goal**: Add a CTA to the shop page and fix the dead footer "About Us" link.

**Independent Test**: Verify a CTA button links to `/shop` and the footer "About Us" link has `href="/about"`.

- [x] T006 [US3] Add CTA section to `app/about/page.tsx` at the end of the content: a primary button labeled "Browse Our Products" linking to `/shop`, using the existing `<Button>` component from `@/components/ui/button`
- [x] T007 [P] [US3] Fix footer "About Us" link in `components/footer.tsx`: add a URL mapping object (`FOOTER_URLS`) that maps link labels to hrefs, update the Link rendering (line 57) to resolve `href` from the mapping, and set "About Us" → `"/about"`. All other links remain `"#"`.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Goal**: Quality gates — type checking, linting, and visual verification.

- [x] T008 Verify `tsc --noEmit` passes with zero errors
- [x] T009 Verify `npm run lint` passes with zero errors
- [x] T010 Verify the page renders correctly on mobile (375px), tablet (768px), and desktop (1440px) — no horizontal scroll, content is readable
- [x] T011 Verify accessibility: proper heading hierarchy (h1 → h2 → h3), keyboard-navigable links, sufficient color contrast

---

## Dependencies

```
Phase 3 (US1): No dependencies — can start immediately
Phase 4 (US2): Depends on Phase 3 (same file, extends page structure)
Phase 5 (US3): Depends on Phase 4 (same file, adds CTA at bottom)
                T007: Independent — can run parallel with T001–T006 (different file)
Phase 6:       Depends on Phases 3–5 complete
```

## Parallel Execution

Only one parallel opportunity exists:

| Tasks | Reason |
|-------|--------|
| T007 parallel with T001–T006 | `components/footer.tsx` is a different file from `app/about/page.tsx` |

All `app/about/page.tsx` tasks (T001–T006) are sequential because they build on the same file in content order (hero → story → specialties → address → CTA).

## Suggested MVP Scope

**MVP**: Complete Phase 3 (US1) only. Delivers a working `/about` page with the store's founding story and branded header. The footer fix (T007) can also be included in MVP since it's a one-line change in a different file.

## Task Summary

| Phase | Story | Task Count | Files |
|-------|-------|-----------|-------|
| 3 | US1 (P1) | 3 | `app/about/page.tsx` |
| 4 | US2 (P2) | 2 | `app/about/page.tsx` |
| 5 | US3 (P3) | 2 | `app/about/page.tsx`, `components/footer.tsx` |
| 6 | Polish | 4 | N/A (verification) |
| **Total** | | **11** | |
