# Tasks: Gaming-Themed Error Page

**Input**: Design documents from `specs/011-error-page/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Status**: ✅ All tasks completed (feature redesigned to match Figma)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1)

---

## Phase 1: Setup

**Purpose**: Create shared error page component with Figma assets

- [x] T001 Download battlefield illustration from Figma (node 123:1828) to `public/images/error-illustration.png`
- [x] T002 [P] Create `components/error-page.tsx` — gaming-themed shared component with battlefield illustration, "FAILED SAVING THROW" badge overlay, "CRITICAL MISS!" heading (Outfit Black 56px, #7B4FA2), thematic subheading, "Regroup at Homepage" primary button, and "Visit our homepage" link. Only prop: `showNav`.

---

## Phase 2: User Story 1 - Friendly Error Display (Priority: P1) 🎯 MVP

**Goal**: All errors and 404s display the branded gaming-themed error page with battlefield illustration and "CRITICAL MISS!" messaging.

**Independent Test**: Navigate to a nonexistent URL → verify branded 404 page with battlefield illustration, "CRITICAL MISS!" heading, and gaming-themed copy.

### Implementation

- [x] T003 [P] [US1] Create `app/not-found.tsx` — Server Component. Fetches nav categories via `getNavCategories()`, renders NavBar + ErrorPage + Footer.
- [x] T004 [P] [US1] Create `app/error.tsx` — Client Component (`"use client"`). Logs error to console via useEffect, renders ErrorPage.
- [x] T005 [P] [US1] Create `app/global-error.tsx` — Client Component. Standalone HTML/BODY with inline error UI (no nav/footer imports). Shows "Try Again" button.

**Checkpoint**: All three error files created. Error page renders gaming-themed content for 404, runtime errors, and root errors.

---

## Phase 3: Polish

- [x] T006 Run `tsc --noEmit` — PASSED (0 errors)
- [x] T007 Run `npm run lint` — PASSED
- [x] T008 Run `npm test` — PASSED (78 tests)
- [x] T009 Validate 404 page renders via `curl http://localhost:3000/nonexistent` → HTTP 404, "CRITICAL MISS" in response

---

## Implementation Strategy

### MVP (Complete)

1. Phase 1: Download illustration + create shared ErrorPage component
2. Phase 2: Create all three error files
3. Phase 3: Quality gates

All tasks done. Feature is live with gaming-themed design matching Figma frame 123:1792.
