# Data Model: About Us Page

**Feature**: 026-about-us-page
**Date**: 2026-08-04

## Overview

This feature has no data model in the traditional sense — there are no database tables, API schemas, or persisted entities. The About page consists entirely of static content embedded in the page component.

## Static Content Entity

The "About Page Content" is a set of static string constants inline in `app/about/page.tsx`:

```typescript
const ABOUT_CONTENT = {
  headline: "Our Story",
  subheadline: "About us",
  story: "Zeek's Comics and Games opened late summer of 2015. For the past 10 Years we have been an innovative, engaging and growing community of nerdy customers, fans and family.",
  specialties: "At Zeek's we specialize in New Comics, Miniature War Gaming, Role-playing Games, Card Games and more! We strive to offer you customer service, selection and flexibility for all of your hobby and nerdy related needs.",
  address: {
    name: "Zeeks Comics and Games",
    street: "30 Cherry Tree Shopping Center, Suite A4",
    city: "Washington",
    state: "IL",
    zip: "61571",
  },
};
```

## Footer Link Mapping

The footer fix requires a URL mapping for the "About Us" link:

| Link Label | Current href | New href |
|------------|-------------|----------|
| "About Us" | `"#"` | `"/about"` |

All other footer links remain `"#"` (they are placeholders for future pages).

## Validation Rules

- All content strings are non-empty
- The route `/about` must return HTTP 200
- The footer link's href must be `"/about"`, not `"#"`
