# UI Contract: Nav Bar Authentication Integration

**Feature**: 014-clerk-sign-in | **Date**: 2026-08-02

## Component: NavBar

### Props (unchanged)

```typescript
interface NavBarProps {
  categories: NavCategory[];
}
```

No new props. The NavBar internally reads auth state from Clerk's context.

### Auth States

| State | Profile Icon Area | Component |
|-------|-------------------|-----------|
| Unauthenticated | User icon button (lucide `User`) | `<SignInButton mode="modal">` wrapping the icon |
| Authenticated | User avatar + dropdown menu | `<UserButton>` |
| Loading (transient) | Browser-default cursor; Clerk handles modal loading | Clerk internal |
| Clerk unavailable | Error message in place of icon | Error boundary or fallback text |

### Behavior Contract

1. **Click (unauthenticated)**: Opens Clerk's sign-in/sign-up modal overlay on the current page.
2. **Click (authenticated)**: Opens Clerk's user menu dropdown (profile, sign-out).
3. **Sign-out**: Clears Clerk session, `<UserButton>` reverts to `<SignInButton>`.
4. **Modal dismiss**: Modal closes; auth state unchanged; user remains on current page.
5. **Error handling**: If Clerk fails to load, display "Sign in unavailable" text (per FR-007).

### Accessibility

- `<SignInButton>` and `<UserButton>` are accessible by default (Clerk's built-in ARIA)
- Keyboard: Tab to profile icon, Enter/Space to activate, Escape to close modal
- Focus trap in Clerk modal (managed by Clerk)

### Testing Contract

Integration tests MUST verify:
1. Unauthenticated: `SignInButton` (or equivalent trigger) is rendered
2. Authenticated: `UserButton` is rendered (mock Clerk's signed-in state)
3. The profile icon area is keyboard-accessible