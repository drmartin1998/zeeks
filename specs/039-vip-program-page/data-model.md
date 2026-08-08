# Data Model: VIP Program Page

**Branch**: `039-vip-program-page` | **Date**: 2026-08-08

## Entities

### VIPSubscriptionPlan

A purchasable VIP membership tier sourced from the Square catalog (object type `SUBSCRIPTION_PLAN`). The primary instances are "VIP Basic" and "VIP Premium".

**Source**: Square Catalog `SUBSCRIPTION_PLAN` object (`subscriptionPlanData`).

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `id` | string | Square catalog object `id` | Stable identifier of the plan. |
| `name` | string | `subscriptionPlanData.name` | Display name (e.g., "VIP Basic", "VIP Premium"). |
| `priceCents` | number | `subscriptionPlanData.subscriptionPlanVariations[]` | Price in smallest currency unit (cents) for the billing cycle. |
| `billingCadence` | string | variation pricing | Billing period label (e.g., "year"). |
| `description` | string | design copy (static) | Short marketing description for the tier card. |
| `benefits` | string[] | design copy (static) | List of benefits shown on the tier card. |
| `purchaseActionLabel` | string | config | Button label (e.g., "Join", "Go Premium"). |

**Validation**:
- `name`, `id` required.
- `priceCents` must be a non-negative integer.
- Only plans whose `name` matches a known VIP tier are promoted to tier cards; unknown plans are ignored (or surfaced in an admin/empty state).

**Relationships**:
- A VIP Program page renders zero-to-many `VIPSubscriptionPlan` tier cards.
- A shopper purchasing a plan creates a Square `Subscription` (external entity, not modeled here).

### VipProgramPage

The public page at `/vip-program` presenting the program's content.

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `hero` | object | static design content | Hero title + subtitle. |
| `tiers` | VIPSubscriptionPlan[] | Square catalog | Rendered in the tier comparison. |
| `vipWeekends` | object | static design content | Title, body, feature cards. |
| `faq` | object[] | static design content | Question/answer pairs. |

## State Transitions

- **Plan availability**: A plan is either available (present in the Square catalog) or absent. When absent, the page renders the remaining available tier(s); it does not fabricate the missing tier.
- **Purchase**: A shopper initiates a purchase for a tier → routes through the existing checkout → a Square `Subscription` is created for the customer against the selected plan. Handled by the existing checkout flow (not re-modeled here).

## Validation Rules (from requirements)

- **FR-003/FR-004**: Tiers and their name/price must come from the live Square catalog; benefits are presentational.
- **FR-008 / No-Mock-Data**: On fetch failure or no matching plans, show a graceful error/empty state; never substitute hardcoded tiers.