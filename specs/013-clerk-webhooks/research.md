# Research: Clerk Webhook Integration

## 1. Webhook Signature Verification Method

**Decision**: Use the `svix` library's `Webhook` class directly (not Clerk's `@clerk/nextjs/webhooks` wrapper).

**Rationale**:
- `svix` (^1.99.1) is already a project dependency — no new package installation needed.
- Clerk uses Svix (Standard Webhooks) under the hood for all webhook signatures. The `@clerk/nextjs/webhooks` package is a thin wrapper around the same Svix verification.
- Direct Svix usage gives full control over error handling and avoids pulling in the entire `@clerk/nextjs` dependency tree for a single route handler.
- The Svix `Webhook.verify()` method accepts raw payload string + headers, matching Next.js App Router's `req.text()` pattern.

**Alternatives considered**:
- `@clerk/nextjs/webhooks` `verifyWebhook()`: Adds `@clerk/nextjs` dependency (~50+ transitive deps) for a single utility function. Rejected to keep dependencies minimal.
- Manual HMAC verification: Error-prone and unnecessary when a well-tested library exists.
- `standardwebhooks` package directly: Svix wraps `standardwebhooks` (already a transitive dep). Using `svix` is the documented approach.

## 2. Raw Body Parsing in Next.js App Router

**Decision**: Use `await req.text()` to read the raw request body before signature verification.

**Rationale**:
- Svix signature verification requires the exact raw body bytes as received. Any transformation (JSON parsing/re-stringification, whitespace changes) will break the HMAC signature.
- In Next.js App Router, `req.text()` returns the raw body as a string. No special config needed (unlike Pages Router which required `bodyParser: false`).
- The `Webhook.verify()` method from Svix internally parses the verified payload as JSON and returns it as `unknown`, so we don't need a separate `JSON.parse()` call.

**Alternatives considered**:
- `req.json()`: Would parse and re-serialize, breaking the signature. Rejected.
- Buffer-based reading: `req.text()` is sufficient since webhook payloads are small (<100KB). Buffer approach adds complexity without benefit.

## 3. Environment Variable Configuration

**Decision**: Store the webhook secret in `CLERK_WEBHOOK_SECRET` environment variable, read via `process.env.CLERK_WEBHOOK_SECRET`.

**Rationale**:
- Consistent with Clerk's official documentation naming convention.
- Server-side only (never prefixed with `NEXT_PUBLIC_`), satisfying Constitution Principle II.
- Read at module load time (module-level constant) for fast access without repeated `process.env` lookups.
- No Zod validation needed at module level — a simple truthiness check in the handler suffices, and the Svix library will throw on an invalid/empty secret anyway.

**Alternatives considered**:
- Zod validation in `lib/env.ts`: Adds ceremony for a single string. Module-level `if (!secret)` guard is simpler and provides a clear error message.
- Hardcoded constant: Security risk. Rejected.

## 4. Error Handling Strategy

**Decision**: Three-tier error handling: (1) missing secret → 500, (2) invalid signature → 400, (3) Svix library errors → 400.

**Rationale**:
- Missing secret (500) is a server configuration error — it's not the client's fault. The 500 status signals to Clerk's dashboard that the endpoint is misconfigured.
- Invalid signature (400) means the request is malformed or forged — a client error. Clerk will not retry on 400.
- The `try/catch` around `wh.verify()` catches all Svix errors (invalid signature, missing headers, malformed payload) uniformly.
- Logging errors via `console.error` aids debugging in Vercel's log viewer.

**Alternatives considered**:
- 401 for invalid signature: 400 is more appropriate since it's a malformed request, not an authentication challenge.
- Differentiating error types (missing header vs. invalid signature): Over-engineering for v1. All lead to the same outcome: reject the request.

## 5. Console Logging Format

**Decision**: Log in a single `console.log()` call with template literal: `` `Clerk webhook received — type: ${evt.type}, data.id: ${evt.data.id}` ``.

**Rationale**:
- Single log line per event keeps Vercel logs clean and greppable.
- Template literal format is human-readable and machine-parseable.
- Uses string interpolation which is safe (no object logging that could expose sensitive data).
- The event type prefix makes filtering easy: `grep "Clerk webhook"` in logs.

**Alternatives considered**:
- `console.log(JSON.stringify(evt))`: Would log the entire event payload, potentially exposing sensitive user data. Rejected for security.
- Structured logging (JSON): Adds complexity; simple string is sufficient for v1.

## 6. Response Format

**Decision**: Use `NextResponse.json()` for all responses, with typed return values.

**Rationale**:
- Consistent with existing Route Handler patterns in the project (`app/api/catalog/categories/route.ts`).
- `NextResponse.json()` automatically sets `Content-Type: application/json`.
- Typed return (`Promise<NextResponse<{ error: string } | { success: true }>>`) satisfies Constitution Principle III.
- Clerk expects a 2xx response to acknowledge successful delivery; 200 is standard.

**Alternatives considered**:
- `new Response(...)`: Works but less idiomatic in Next.js App Router. `NextResponse.json()` is the recommended approach.
- 201 Created status: Inaccurate — we're acknowledging receipt, not creating a resource. 200 is correct.

## 7. Type Definition for Clerk Events

**Decision**: Define a minimal `ClerkWebhookEvent` interface with only the fields needed for v1: `type: string` and `data: { id: string }`.

**Rationale**:
- Narrow typing (only the fields we use) is preferred over wide typing (importing Clerk's full event types) per Constitution Principle III.
- The verified payload from Svix is `unknown` — a type assertion is necessary and safe after signature verification.
- Only `type` and `data.id` are used for logging in v1. Additional fields can be added later when downstream processing is implemented.

**Alternatives considered**:
- Full Clerk event types from `@clerk/types`: Requires installing `@clerk/types` for types we won't use. Rejected.
- Zod validation of event shape: Would add runtime validation but is unnecessary at this stage since we only log. Can be added when downstream processing needs guaranteed field presence.
