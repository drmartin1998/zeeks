# Data Model: Gaming-Themed Error Page

**Feature**: 011-error-page
**Date**: 2026-08-02
**Updated**: 2026-08-02

## Component: ErrorPage

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showNav` | `boolean` | `true` | Whether to include nav/footer wrapper (false for global-error) |

All text content and styling is hardcoded to match the Figma design:

| Element | Content | Styling |
|---------|---------|---------|
| Illustration | `error-illustration.png` | 640×380, `next/image` priority |
| Badge text | "FAILED SAVING THROW" | White, Rubik Bold 12px |
| Badge subtext | "You Rolled a Natural 1" | `#E89516` amber, Rubik Bold 14px |
| Eyebrow | "You Rolled a Natural 1" | `#E89516` amber, Rubik Bold, uppercase |
| Headline | "CRITICAL MISS!" | `#7B4FA2` purple, Outfit Black 56px, center |
| Subheading | Thematic text | `#9090A8` grey-purple, Rubik Regular 16px, center, 1.6 line-height |
| Button | "Regroup at Homepage" | Primary variant, size xl |
| Link | "Visit our homepage" | Standard link beside button |

## Files

| File | Type | Role |
|------|------|------|
| `not-found.tsx` | Server Component | 404 handler, renders NavBar + ErrorPage + Footer |
| `error.tsx` | Client Component | Runtime error boundary, renders ErrorPage (nav/footer from layout) |
| `global-error.tsx` | Client Component | Root error boundary, standalone (own `<html>`/`<body>`) |
