# Implementation Plan: Custom User Menu (Authenticated)

**Branch**: `018-custom-user-menu` | **Date**: 2026-08-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/018-custom-user-menu/spec.md`

## Summary

Replace Clerk's `<UserButton />` in the nav bar with a custom user menu component (`UserMenu`) that matches the site design. The menu uses the same Portal-based `fixed` positioning pattern as `AuthDropdown` (spec 017), displays the user's name/email, and provides "My Account" and "Logout" links. The trigger icon is the same profile SVG used by `AuthDropdown` for visual consistency.

## Technical Context

**Language/Version**: TypeScript 5.x, Next.js 16.2.10, React 19.2.4

**Primary Dependencies**: `@clerk/nextjs` v7.6.4 (`useUser()`, `useClerk()` for `signOut`), existing `AuthDropdown` pattern

**Storage**: N/A — Clerk handles auth state.

**Testing**: Vitest + @testing-library/react (integration for UserMenu and nav-bar)

**Target Platform**: Vercel (Next.js App Router)

**Scale/Scope**: 1 new component, 1 nav-bar update, 4 test cases. Single user story, 10 functional requirements, 6 Gherkin scenarios.

## Constitution Check

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Server Components First | ✅ PASS | `UserMenu` is a client component at a leaf node (auth UI). Nav-bar is already `"use client"`. |
| II | API Route Security | ✅ PASS | No new Square API calls. Clerk handles auth natively. |
| III | Type-Safe Data Flow | ✅ PASS | `useUser()` and `useClerk()` provide TypeScript types. `@/*` imports only. |
| IV | Vercel-Native Performance | ✅ PASS | Tiny client component. No impact on static/ISR pages. |
| V | Progressive Enhancement | ⚠️ MINOR | Auth state requires JavaScript — inherent to Clerk. Core shopping flow remains JS-optional. |
| VI | Gherkin-First Testing (Testing Trophy) | ✅ PASS | 6 Gherkin scenarios. Integration tests for UserMenu and nav-bar. |
| VII | No Mock Data Fallback | ✅ PASS | No mock data. Clerk provides live user data. |

**Gate Result**: ALL PASS.

## Project Structure

```text
components/
├── nav-bar.tsx                      # MODIFY — replace <UserButton /> with <UserMenu />
├── __tests__/
│   └── nav-bar.test.tsx             # MODIFY — update authenticated tests
├── auth/
│   ├── user-menu.tsx                # NEW — authenticated user dropdown
│   └── __tests__/
│       └── user-menu.test.tsx       # NEW — integration tests
