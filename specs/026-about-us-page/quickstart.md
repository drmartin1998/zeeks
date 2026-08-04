# Quickstart: About Us Page

**Feature**: 026-about-us-page
**Date**: 2026-08-04

## Prerequisites

- Dev server running (`vercel dev` on port 3000)
- TypeScript compilation passes (`tsc --noEmit`)
- Lint passes (`npm run lint`)

## Validation Scenarios

### VS-1: About page is accessible from navigation

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/about
```

**Expected**: HTTP 200.

### VS-2: About page displays core content

```bash
curl -s http://localhost:3000/about | grep -o "Our Story"
```

**Expected**: Returns "Our Story".

```bash
curl -s http://localhost:3000/about | grep -o "Zeek's Comics and Games opened late summer of 2015"
```

**Expected**: Returns the founding story text.

### VS-3: About page displays the store address

```bash
curl -s http://localhost:3000/about | grep -o "30 Cherry Tree Shopping Center"
```

**Expected**: Returns the address text.

### VS-4: About page displays product specialties

```bash
curl -s http://localhost:3000/about | grep -o "New Comics"
```

**Expected**: Returns "New Comics" (part of the specialties section).

### VS-5: CTA links to shop

```bash
curl -s http://localhost:3000/about | grep -o 'href="/shop"'
```

**Expected**: At least one match — the CTA button links to `/shop`.

### VS-6: Footer "About Us" links to /about

```bash
curl -s http://localhost:3000/about | grep -o 'href="/about".*About Us'
```

**Expected**: The footer contains a link with `href="/about"` and text "About Us".

### VS-7: Visual validation (browser)

Navigate to `http://localhost:3000/about` in the browser.

**Expected**:
- Dark hero header with "Our Story" headline in gold/purple accent
- "About us" subheadline visible
- Two paragraphs of narrative content (founding story, specialties)
- Store address section clearly separated from narrative
- "Browse Our Products" CTA button visible, links to `/shop`
- Footer visible at bottom of page
- Page is readable and properly laid out on mobile (375px), tablet (768px), and desktop (1440px)
- No horizontal scroll on any viewport

### VS-8: Static type checking and lint

```bash
tsc --noEmit && npm run lint
```

**Expected**: Zero errors.
