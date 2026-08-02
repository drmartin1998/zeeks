# Feature Specification: Clerk-to-Square Customer Sync

**Feature Branch**: `008-clerk-square-customer-sync`

**Created**: 2026-08-02

**Status**: Draft

**Input**: User description: "As the system backend, when a user.created event is verified from Clerk, I need to look up or create a corresponding customer in Square, and save that Square ID back to the Clerk user profile."

## Clarifications

### Session 2026-08-02

- Q: How should the system respond when Square API returns a rate-limited (429) response? → A: Retry with exponential backoff (up to 3 attempts), then return 500 to trigger Clerk's automatic webhook redelivery.
- Q: Are there data privacy or compliance requirements for Square customer PII? → A: No compliance requirements for v1; deletion/right-to-erasure will be addressed in a future feature handling `user.deleted` webhooks.
- Q: What is the expected daily and peak new user registration volume? → A: Low volume: ≤100 registrations per day, peak ≤20 concurrent webhook deliveries.
- Q: What is the maximum timeout for each individual Square API call, and what happens on timeout? → A: 3-second per-call timeout; on timeout, retry with exponential backoff (same as rate-limit), return 500 after 3 failures.
- Q: Should v1 include a mechanism for detecting or manually recovering from permanently failed customer syncs? → A: No recovery mechanism in v1; rely on Clerk's automatic webhook retry and observability logs for manual investigation.


## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automatic Square Customer Creation on Registration (Priority: P1)

When a new customer signs up on the Zeeks storefront via Clerk, the backend automatically ensures a corresponding customer record exists in Square. If the customer already exists in Square (matched by email), the existing record is linked. If not, a new Square customer is created with the user's name and email. In both cases, the Square customer ID is persisted back to the Clerk user profile so all subsequent Square operations (checkout, order history) can reference the correct customer.

**Why this priority**: This is the foundational integration between the authentication system (Clerk) and the commerce backend (Square). Without this sync, checkout flows cannot associate orders with customers, order history cannot be retrieved, and every downstream Square API call would fail or require manual customer lookup. This feature must work before any customer-facing Square operations can function.

**Independent Test**: Can be verified by registering a new user through the storefront, then checking that the user's Clerk profile contains a `squareCustomerId` in private metadata, and that a corresponding customer exists in the Square merchant dashboard with matching name and email.

**Acceptance Scenarios**:

1. **Given** a new user registers through Clerk and no Square customer exists with that email, **When** the Clerk `user.created` webhook is delivered and verified, **Then** a new Square customer is created with the user's first name, last name, and primary email, and the resulting Square customer ID is saved to the Clerk user's `privateMetadata.squareCustomerId`.
2. **Given** a returning user with an existing Square customer record (matched by email) registers again, **When** the Clerk `user.created` webhook is delivered and verified, **Then** the existing Square customer ID is retrieved and saved to the Clerk user's `privateMetadata.squareCustomerId` without creating a duplicate Square customer.
3. **Given** a Clerk `user.created` webhook is delivered, **When** the webhook signature verification fails, **Then** the system responds with a 400 status and does NOT attempt any Square API calls or Clerk profile updates.


---

### User Story 2 - Graceful Error Handling During Sync (Priority: P2)

When the Square API is unreachable, returns an error, or the Clerk user lacks required profile data (name, email), the system handles the failure gracefully. It logs the error for observability, returns an appropriate HTTP status, and ensures no partial state is left behind (e.g., a Square customer created without the Clerk profile being updated, or vice versa).

**Why this priority**: While Square and Clerk are reliable services, network failures and edge cases (users without names, emails that fail validation) must not leave the system in an inconsistent state. Silent failures would cause hard-to-diagnose checkout errors later.

**Independent Test**: Can be tested by temporarily providing invalid Square credentials, simulating a Square API outage, or sending a webhook payload with a user missing email address, and verifying the system returns appropriate error responses and neither Square nor Clerk records are partially modified.

**Acceptance Scenarios**:

1. **Given** the Square API is unreachable, **When** a Clerk `user.created` webhook is processed, **Then** the system logs the error, returns a 500 status, and does NOT update the Clerk user profile.
2. **Given** a Clerk `user.created` webhook payload contains a user without a primary email address, **When** the webhook is processed, **Then** the system logs a warning, returns a 400 status, and does NOT attempt any Square API calls.
4. **Given** the Square API returns a rate-limited response (HTTP 429) or the call times out, **When** a Clerk `user.created` webhook is processed, **Then** the system retries with exponential backoff up to 3 attempts (3-second timeout each), and if all retries fail, returns a 500 status with error logged and does NOT update the Clerk user profile.
3. **Given** a Clerk `user.created` webhook payload contains a user without a first name or last name, **When** the webhook is processed and a new Square customer must be created, **Then** the Square customer is still created using available data (email only) and the sync completes.

---

### User Story 3 - Idempotent Webhook Processing (Priority: P3)

Clerk may deliver the same `user.created` webhook event multiple times (at-least-once delivery). The system detects whether a Square customer ID already exists for the Clerk user and skips redundant Square API calls, ensuring no duplicate customers are created and no unnecessary API requests are made.

**Why this priority**: Webhook idempotency is a reliability concern. While Clerk's delivery is generally reliable, at-least-once semantics mean duplicate events are possible. Without idempotency, duplicate Square customers could be created, leading to fragmented order history and customer confusion.

**Independent Test**: Can be verified by sending the same Clerk `user.created` webhook payload twice and confirming that only one Square customer lookup occurs, the second delivery returns 200 immediately, and the Clerk user has exactly one `squareCustomerId` value.

**Acceptance Scenarios**:

1. **Given** a Clerk user already has a `squareCustomerId` in their private metadata, **When** a duplicate `user.created` webhook is delivered, **Then** the system returns 200 without making any Square API calls.
2. **Given** a Clerk user has a `squareCustomerId`, **When** the corresponding Square customer is looked up and found to still exist, **Then** the system takes no further action and returns 200.


### Edge Cases

- What happens when the Clerk user has multiple email addresses and the primary one is not set? The system MUST use the first available email address or return an error if none exist.
- What happens when the Square customer lookup returns multiple customers with the same email? The system MUST use the first result (most recent) and log a warning for manual review.
- What happens when the Clerk `user.created` webhook arrives before the user profile is fully populated (e.g., name fields are empty)? The system MUST still create the Square customer with available data.
- What happens when the user profile update fails after a Square customer is already created? The system MUST log the inconsistency for manual reconciliation — the Square customer exists but the user profile is not updated.
- What happens when Square API rate-limits the customer search or create request (HTTP 429) or the call times out? The system MUST retry with exponential backoff up to 3 attempts (each with a 3-second timeout), then return a 500 status to trigger Clerk's automatic webhook redelivery.
- What happens when a Square customer was previously deleted but the Clerk user still references it? The system MUST detect the missing Square customer and create a new one.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST verify webhook signatures using the configured webhook secret before processing any event — unverified or tampered requests MUST be rejected with a 400 status.
- **FR-002**: The system MUST extract the primary email address from the Clerk `user.created` webhook payload's `data.email_addresses` array. If no primary email is set, it MUST use the first available email.
- **FR-003**: The system MUST connect to the Square customer service using configured credentials (access token and environment) to perform customer operations.
- **FR-004**: The system MUST search for an existing Square customer by email address before creating a new one.
- **FR-005**: If a matching Square customer is found by email, the system MUST save that Square customer ID to the Clerk user's profile under the designated customer identifier field (`squareCustomerId` in private metadata).
- **FR-006**: If no matching Square customer is found, the system MUST create a new Square customer using the user's given name, family name, and email address, then save the resulting Square customer ID to the Clerk user's profile under the designated customer identifier field.
- **FR-007**: The system MUST be idempotent — if the Clerk user already has a Square customer identifier in their profile, the system MUST return 200 without making any external service calls.
- **FR-008**: The system MUST log all webhook events (event type and user ID) for observability and debugging.
- **FR-009**: The system MUST log errors from external service calls with sufficient context (user ID, email, error details) for troubleshooting.
- **FR-011**: The system MUST apply a 3-second timeout to each individual Square API call, retry with exponential backoff (up to 3 attempts) on timeout or rate-limit (HTTP 429), then return a 500 status if all retries fail to trigger Clerk's webhook redelivery.
- **FR-010**: The system MUST return appropriate HTTP status codes: 200 on success or idempotent skip, 400 on invalid/missing data, 500 on Square API or Clerk SDK failures.

### Key Entities *(include if feature involves data)*

- **Clerk User**: An authenticated user managed by Clerk. Key attributes include: user ID (`id`), primary email address (`email_addresses[].email_address`), first name (`first_name`), last name (`last_name`), and private metadata (`privateMetadata.squareCustomerId`).
- **Square Customer**: A customer record in Square's CRM. Key attributes include: Square customer ID (`id`), email address, given name, and family name. Created or looked up during webhook processing.
- **Webhook Event**: A `user.created` event delivered by Clerk via Svix. Key attributes include: event type (`type`), user data (`data.id`, `data.email_addresses`, `data.first_name`, `data.last_name`), and Svix verification headers.




## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of successfully verified Clerk `user.created` webhooks that have valid user email data result in a `squareCustomerId` being saved to the Clerk user profile within 5 seconds of webhook receipt (with individual Square API calls completing within 3 seconds each).
- **SC-002**: Zero duplicate Square customers are created for the same email address across all webhook deliveries (including retries).
- **SC-003**: When the Square API is unreachable, 100% of webhook requests return a non-200 status (400 or 500) and no partial state is persisted in Clerk.
- **SC-004**: Webhook signature verification rejects 100% of unverified or tampered requests with a 400 status before any Square API calls are made.
- **SC-005**: The system correctly handles up to 20 concurrent `user.created` webhook deliveries without race conditions or duplicate Square customer creation, supporting up to 100 daily registrations.

## Assumptions

- The Clerk Webhook Secret is already configured and the webhook endpoint is registered in the Clerk dashboard to receive `user.created` events.
- Square API credentials (access token and environment) are already configured and valid for customer management operations.
- The identity provider's user management capabilities allow updating user profile metadata programmatically.
- The existing webhook endpoint already verifies signatures and parses event types — this feature extends that handler to process `user.created` events specifically.
- Square's customer lookup supports exact email matching to find existing customers.
- If multiple Square customers share the same email, the first result from the search is used (the system logs a warning for manual review of duplicates).
- The Clerk `user.created` event payload always includes the user's unique identifier, email address list, first name, and last name fields (these are standard user attributes).
- The feature is scoped to the `user.created` webhook event only — other events (`user.updated`, `user.deleted`) are out of scope for this version.
- The expected volume is low for v1: ≤100 new user registrations per day with peak concurrency of ≤20 simultaneous webhook deliveries.
- No automated recovery or replay mechanism for permanently failed syncs is included in v1; manual investigation via logs is sufficient for the low-volume deployment.
- Customer data deletion and right-to-erasure compliance (GDPR, etc.) are deferred to a future feature that will handle `user.deleted` webhooks.
- Duplicate customer creation is prevented by the email-based search-first approach and idempotency check, so no additional deduplication mechanism is required.
