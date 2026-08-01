<!-- BEGIN:dev-server-rule -->
# Dev Server: Check Before Starting

The user often runs `vercel dev` manually. Before starting a dev server,
ALWAYS check if port 3000 is in use (`lsof -ti:3000`). If it is, use the
existing server — DO NOT start a second one or kill the user's process.
ALWAYS use `vercel dev`, never `npm run dev` or `next dev`.
<!-- END:dev-server-rule -->


<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
