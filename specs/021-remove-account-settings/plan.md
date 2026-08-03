# Implementation Plan: Remove Account Settings Button

**Branch**: `021-remove-account-settings` | **Date**: 2026-08-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/021-remove-account-settings/spec.md`

## Summary

Remove the non-functional "Account Settings" button from the profile header card component. This is a single-file change in `components/account/profile-header-card.tsx`.

## Constitution Check

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Server Components First | **PASS** | ProfileHeaderCard is a presentational Server Component |
| II | API Route Security | **N/A** | No API changes |
| III | Type-Safe Data Flow | **PASS** | No type changes |
| IV | Vercel-Native Performance | **PASS** | No perf impact |
| V | Progressive Enhancement | **PASS** | No JS dependency change |
| VI | Gherkin-First Testing | **PASS** | .feature file exists |
| VII | Environment-Driven Configuration | **N/A** | No env changes |

## Project Structure

```
specs/021-remove-account-settings/
├── spec.md
├── plan.md
├── features/
│   └── remove-account-settings.feature
└── checklists/
    └── requirements.md

components/account/
└── profile-header-card.tsx          # MODIFY: Remove Account Settings button
```

## Complexity Tracking

No violations.
