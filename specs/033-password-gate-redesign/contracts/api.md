# Contracts: Password Gate Redesign

**Feature**: 033-password-gate-redesign
**Date**: 2026-08-07

## Contract 1: Password API — `POST /api/password`

The API validates the submitted password and, on success, sets the `site_password` cookie.

### Request

```json
{ "password": "the-site-password" }
```

### Response

- **200 OK** — `{ "success": true }`; sets the `site_password` cookie with a **24-hour** `maxAge` (changed from 7 days).
- **401 Unauthorized** — `{ "error": "Invalid password" }` when the submitted password does not match `SITE_PASSWORD`.
- **400 Bad Request** — `{ "error": "Invalid request" }` on malformed input.

### Cookie properties (unchanged except `maxAge`)

| Property | Value |
|----------|-------|
| `name` | `site_password` |
| `httpOnly` | `true` |
| `secure` | `true` in production |
| `sameSite` | `lax` |
| `path` | `/` |
| `maxAge` | **86400 (24 hours)** — was `604800` (7 days) |

## Contract 2: Password Gate Page (UI Contract)

The redesigned page (`/password`) renders the Figma layout:

| Section | Content |
|---------|---------|
| Background | Dark purple (`#120E29`) with central purple glow + ember accents |
| Header | Zeeks logo (centered) |
| Headline | "SOMETHING EPIC IS COMING" |
| Subhead | "Your new home for TCGs, comics, board games, RPGs, and miniatures. Enter the password to get early access." |
| Form | Password input (placeholder "Enter the secret passphrase...") + orange "UNLOCK EARLY ACCESS" button + hint text |
| Footer | "COMING Q3 2026" + social icon row (facebook, instagram, twitter, youtube) |

### Behavior

- Submitting the correct password redirects to `returnTo` (or `/`).
- Submitting an incorrect password shows an error message.
- The page is responsive and centered at all widths.