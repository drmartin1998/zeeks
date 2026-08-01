# Dev Server Conflict Avoidance

The user frequently runs the dev server (`vercel dev` on port 3000) while
an AI agent is working. Starting a second dev server causes port conflicts.

## Rule

**BEFORE running `vercel dev` or any command that starts the local server:**

1. Check if port 3000 is already in use:
   ```bash
   lsof -ti:3000 || ss -tlnp 'sport = :3000' 2>/dev/null || true
   ```
2. If the port is in use, **DO NOT start another dev server**. Instead:
   - Run `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` to
     verify the server is responsive.
   - If responsive, use the existing server. Do not kill it — the user may
     be actively using it.
   - If not responsive (e.g., stale process), ask the user before killing it.
3. If port 3000 is free, start the dev server with `vercel dev`.
   - **ALWAYS use `vercel dev` instead of `npm run dev` or `next dev`.**
   - `vercel dev` pulls environment variables from Vercel and mirrors the
     production environment, including Square API credentials and
     `VERCEL_URL`.

## For E2E Tests

Playwright tests use `process.env.VERCEL_URL` for CI or fall back to
`http://localhost:3000` locally. When running E2E tests locally:
- Use the existing dev server if already running
- Only start `vercel dev` if port 3000 is free
