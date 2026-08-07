# Data Model: Faceted Product Listing Filters

**Feature**: 030-product-faceted-filters
**Date**: 2026-08-06

## Entities

### 1. SquareProduct (Application-Level, Listing)

Extended listing product shape returned from `getSquareProductsByCategorySlug()`. Two fields are added for faceting: `brand` and `availability`.

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `title` | `string` | `itemData.name` | Product display name |
| `category` | `string` | Parent category name | Top-level category name |
| `categorySlug` | `string` | Derived: `slugify(category)` | URL-safe category slug |
| `subCategory` | `string \| undefined` | Matched subcategory name | Subcategory membership |
| `subCategorySlug` | `string \| undefined` | Derived: `slugify(subCategory)` | Subcategory slug for filtering |
| `price` | `number` | First variation price / 100 | Price in dollars |
| `minPrice` | `number \| undefined` | Min variation price | Lowest price across variations |
| `maxPrice` | `number \| undefined` | Max variation price | Highest price across variations |
| `image` | `string` | Resolved image URL | Product image (currently `""` placeholder) |
| `gradient` | `string` | Default gradient | CSS Tailwind gradient class |
| `catalogObjectId` | `string \| undefined` | `CatalogObject.id` | Square catalog item ID |
| `variationId` | `string \| undefined` | First variation ID | Default variation ID |
| `hasVariations` | `boolean \| undefined` | `variations.length > 1` | Whether product has multiple variations |
| `brand` | `string \| undefined` | `itemData.customAttributeValues[brandKey].stringValue` | **NEW** manufacturer brand for the brand facet |
| `availability` | `"IN_STOCK" \| "OUT_OF_STOCK"` | Derived from variation `locationOverrides` | **NEW** availability for the availability facet |

### 2. DisplayProduct (types.ts, listing/client)

Client-facing subset passed to the listing components. Mirrors `SquareProduct` for the fields the UI needs, including the new `brand` and `availability`.

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `slug` | `string` | Derived: `slugify(title)` | URL-safe identifier |
| `title` | `string` | `itemData.name` | Product display name |
| `category` | `string` | Parent category name | Top-level category name |
| `price` | `number` | First variation price / 100 | Price in dollars |
| `image` | `string \| undefined` | Resolved image URL | Product image |
| `gradient` | `string \| undefined` | Default gradient | CSS Tailwind gradient class |
| `catalogObjectId` | `string \| undefined` | `CatalogObject.id` | Square catalog item ID |
| `variationId` | `string \| undefined` | First variation ID | Default variation ID |
| `hasVariations` | `boolean \| undefined` | `variations.length > 1` | Whether product has variations |
| `minPrice` / `maxPrice` | `number \| undefined` | Variation price range | Price range for multi-variation products |
| `brand` | `string \| undefined` | `customAttributeValues[brandKey].stringValue` | **NEW** brand facet value |
| `availability` | `"IN_STOCK" \| "OUT_OF_STOCK"` | Derived from variation overrides | **NEW** availability facet value |

### 3. FacetOption (UI, derived)

A single selectable option within a facet group, derived on the client from the loaded product set.

| Field | Type | Description |
|-------|------|-------------|
| `value` | `string` | The facet value (subcategory slug, brand key, or `IN_STOCK`/`OUT_OF_STOCK`) |
| `label` | `string` | Human-readable label (subcategory name, brand name, "In Stock"/"Out of Stock") |
| `selected` | `boolean` | Whether this option is currently active |

### 4. ActiveFilterState (UI, derived)

The set of applied filters driving the product list and the active-filter count (FR-007).

| Field | Type | Description |
|-------|------|-------------|
| `subcategories` | `string[]` | Selected subcategory slugs (OR within group) |
| `brands` | `string[]` | Selected brands (OR within group) |
| `availability` | `("IN_STOCK" \| "OUT_OF_STOCK")[]` | Selected availability states |
| `count` | `number` | Total number of active filters (sum of all selected options) |

## Relationships

- **Category (Top-level)** 1—N **Subcategory**: a top-level category contains subcategories (children whose `parentCategory.id` matches). The subcategory facet lists these.
- **Product** N—1 **Subcategory**: a product belongs to zero or one subcategory (via `itemData.categories[].id`). Used by the subcategory facet.
- **Product** N—1 **Brand**: a product has zero or one brand (custom attribute value). Used by the brand facet.
- **Product** 1—1 **Availability**: a product resolves to one availability state (in stock if any variation available). Used by the availability facet.

## Validation Rules

- A product's `availability` MUST be `"IN_STOCK"` if any of its variations is available (not sold out at the configured location); otherwise `"OUT_OF_STOCK"`.
- A product with no location-override data MUST default to `"IN_STOCK"` (no error; consistent with treating missing data as available).
- A product with no brand value MUST have `brand` set to `undefined` and MUST NOT appear under any brand option.
- A facet option MUST only appear in a facet group if at least one product in the currently filtered set carries that value (dynamic narrowing).
- Filter composition: products MUST match ALL active facet groups (AND across groups) and match ANY selected option within a group (OR within a group).

## State Transitions

- **Filter applied** → product list recomputed client-side; affected facet groups re-derive their available options (narrow); active-filter count increments; URL query params updated.
- **Filter cleared** → product list recomputed; facet options re-expand; active-filter count decrements; URL query params updated.
- **All filters cleared** → full category product list restored; all facet options shown; count = 0 (FR-007, SC-005).
- **Direct URL load with filter params** → filters applied on initial render so the displayed list matches the URL (edge case).