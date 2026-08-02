# Feature Specification: Clerk Webhook Integration

**Feature Branch**: `013-clerk-webhooks`

**Created**: 2026-08-02

**Status**: Draft

**Input**: User description: "As the system backend, I need to securely receive webhook events from Clerk so that I know when a new user registers on the headless storefront."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Securely Receive Clerk Webhook Events (Priority: P1)

As the system backend, I need to receive and verify webhook events sent by Clerk so that I know when user lifecycle events (registration, update, deletion) occur on the headless storefront.

**Why this priority**: This is the core requirement — without webhook verification, the backend cannot trust incoming Clerk events, and any downstream user synchronization logic (e.g., database upserts, welcome emails) would be impossible to build securely.

**Independent Test**: Send a signed webhook request to the endpoint with valid `svix-*` headers and a matching `CLERK_WEBHOOK_SECRET`. Verify the endpoint returns 200 and logs the event type and data ID. Send a request with an invalid signature and verify the endpoint returns 400.

**Acceptance Scenarios**:

1. **Given** a Clerk webhook event is dispatched with valid `svix-id`, `svix-timestamp`, and `svix-signature` headers, **When** the webhook endpoint receives the POST request, **Then** the signature is verified successfully, the event type and data ID are logged to the console, and a 200 response is returned.
2. **Given** a Clerk webhook event is dispatched with an invalid or tampered `svix-signature` header, **When** the webhook endpoint receives the POST request, **Then** the signature verification fails and a 400 response is returned with an error message.
3. **Given** a request is sent without the required `svix-*` headers, **When** the webhook endpoint receives the POST request, **Then** signature verification fails and a 400 response is returned.
4. **Given** the `CLERK_WEBHOOK_SECRET` environment variable is not configured, **When** the webhook endpoint receives any POST request, **Then** a 500 response is returned indicating the webhook secret is not configured.

---

### User Story 2 - Observability via Console Logging (Priority: P2)

As a developer, I need the webhook endpoint to log received events to the console so that I can monitor and debug the webhook integration in development and production logs.

**Why this priority**: Logging is essential for debugging the integration and verifying that Clerk is sending the expected events. Without it, failures would be silent and hard to diagnose.

**Independent Test**: Send a valid webhook to the endpoint and verify that `console.log` outputs the event type and data ID in a human-readable format.

**Acceptance Scenarios**:

1. **Given** a valid `user.created` webhook event is received, **When** the endpoint processes it, **Then** the console log includes the string `"Clerk webhook received — type: user.created, data.id: <user_id>"`.
2. **Given** a valid webhook event of any type is received, **When** the endpoint processes it, **Then** the console log includes both the event type and the data object's ID field.

---

### Edge Cases

- What happens when the webhook body is not valid JSON? The Svix `verify()` method will fail (the signature won't match a tampered body), returning 400.
- What happens when the request body is empty? The Svix `verify()` method will reject it (empty payload won't match any valid signature), returning 400.
- What happens when the `CLERK_WEBHOOK_SECRET` is present but incorrect (doesn't match Clerk's signing secret)? All requests will fail signature verification, returning 400.
- What happens if the Clerk event payload is missing `data.id`? The console log will log `undefined` for the ID, but the endpoint still returns 200 (the signature was valid). A future enhancement could add Zod validation of the event shape.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST expose a POST endpoint at `POST /api/webhooks/clerk` that accepts Clerk webhook events.
- **FR-002**: The system MUST verify the webhook signature using the `svix` library (`Webhook.verify()`) and the `CLERK_WEBHOOK_SECRET` environment variable.
- **FR-003**: The system MUST extract the `svix-id`, `svix-timestamp`, and `svix-signature` headers from the incoming request.
- **FR-004**: The system MUST read the raw request body as text (`req.text()`) for signature verification — the body MUST NOT be pre-parsed as JSON.
- **FR-005**: If signature verification fails, the system MUST return HTTP 400 with body `{ "error": "Invalid webhook signature" }`.
- **FR-006**: If the `CLERK_WEBHOOK_SECRET` environment variable is not set, the system MUST return HTTP 500 with body `{ "error": "Webhook secret not configured" }` and log an error.
- **FR-007**: If signature verification succeeds, the system MUST log the event type (`evt.type`) and data ID (`evt.data.id`) to the console.
- **FR-008**: If signature verification succeeds, the system MUST return HTTP 200 with body `{ "success": true }`.
- **FR-009**: The route MUST be implemented as a Next.js App Router Route Handler in `app/api/webhooks/clerk/route.ts`.
- **FR-010**: The `CLERK_WEBHOOK_SECRET` MUST be stored as a server-side environment variable and MUST NEVER be exposed to the browser.

### Key Entities

- **Clerk Webhook Event**: An HTTP POST request sent by Clerk containing an event type (e.g., `user.created`) and associated data (e.g., `{ id: "user_abc123" }`). Verified using Svix standard webhook signature headers.
- **Webhook Secret**: A shared secret (`CLERK_WEBHOOK_SECRET`) provisioned from the Clerk Dashboard. Used to generate and verify HMAC signatures via Svix.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of requests with valid signatures are accepted (200 response) and logged.
- **SC-002**: 100% of requests with invalid or missing signatures are rejected (400 response).
- **SC-003**: Signature verification adds less than 5ms of processing overhead per request.
- **SC-004**: No `CLERK_WEBHOOK_SECRET` value appears in any client-side bundle, network response, or browser-accessible code.

## Assumptions

- Clerk is configured to send webhooks to `https://<domain>/api/webhooks/clerk` via the Clerk Dashboard.
- The `CLERK_WEBHOOK_SECRET` (signing secret) has been copied from the Clerk Dashboard and added as a Vercel Environment Variable for production, and to `.env.local` for local development.
- The `svix` library (version ^1.99.1) is already installed as a project dependency.
- No database or persistent storage is involved in v1 — the endpoint only logs events. Downstream processing (e.g., database upserts) is out of scope for this feature.
- The endpoint accepts all Clerk event types (`user.created`, `user.updated`, `user.deleted`, etc.) without filtering by type.
- Only one Clerk webhook secret is supported at this time. Multi-secret or secret rotation is out of scope for v1.
