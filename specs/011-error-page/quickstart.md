# Quickstart: Gaming-Themed Error Page

**Feature**: 011-error-page
**Date**: 2026-08-02
**Updated**: 2026-08-02

## Prerequisites

- Dev server running (`vercel dev` on port 3000)
- `public/images/error-illustration.png` exists (battlefield illustration from Figma)

## Validation Scenarios

### VS-1: 404 page displays gaming-themed content

```bash
curl -s http://localhost:3000/nonexistent-page | grep "CRITICAL MISS"
```

**Expected**: Returns "CRITICAL MISS" text with HTTP 404.

### VS-2: Error page matches Figma design

Navigate to any nonexistent URL in the browser.
**Expected**: Page shows:
- Nav bar at top
- Battlefield illustration with D20 dice
- "FAILED SAVING THROW" purple badge overlay with "You Rolled a Natural 1"
- "CRITICAL MISS!" heading in large purple Outfit font
- Thematic subheading
- "Regroup at Homepage" primary button (amber)
- "Visit our homepage" link
- Footer at bottom

### VS-3: Homepage navigation works

Click "Regroup at Homepage" or "Visit our homepage" on the error page.
**Expected**: Browser navigates to the homepage (`/`).
