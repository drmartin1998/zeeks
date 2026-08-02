# Data Model: Subcategory Filtering on Category Pages

**Feature**: 008-subcategory-filtering | **Date**: 2026-08-02

## Entities

### Category

Represents a top-level product category from the product catalog.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique catalog identifier from Square |
| `name` | `string` | Display name (e.g., "Miniatures") |
| `slug` | `string` | URL-safe identifier derived from `name` |
| `isTopLevel` | `boolean` | Whether this is a top-level category (no parent) |
| `parentCategory.id` | `string \| null` | ID of parent category; `null` for top-level |

**Validation**: `isTopLevel` = `parentCategory.id === null`

### Subcategory

Represents a child category nested under a parent Category.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique catalog identifier from Square |
| `name` | `string` | Display name (e.g., "Strategy") |
| `slug` | `string` | URL-safe identifier derived from `name` |
| `parentCategory.id` | `string` | References parent Category's `id` |

**Validation**: `parentCategory.id` must reference an existing top-level Category.

### Product

Represents a sellable item from the product catalog.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique catalog item identifier |
| `title` | `string` | Product display name |
| `slug` | `string` | URL-safe identifier |
| `category` | `string` | Parent category display name |
| `categorySlug` | `string` | URL-safe parent category identifier |
| `subCategory` | `string \| undefined` | Subcategory display name (if applicable) |
| `subCategorySlug` | `string \| undefined` | URL-safe subcategory identifier (if applicable) |
| `price` | `number` | Price in dollars (normalized from Square's cent-based amounts) |
| `image` | `string` | Product image URL |
| `gradient` | `string \| undefined` | CSS gradient class for card background |

**Validation**: `price >= 0`. `subCategory` must match a known Subcategory's `name` when present.

## Relationships

```
Category (Top-Level)
  │
  ├── has many → Subcategory (via parentCategory.id → Category.id)
  │
  └── has many → Product (via categorySlug → Category.slug)
       │
       └── Product may also belong to → Subcategory (via subCategorySlug → Subcategory.slug)
```

- A Product always has exactly one parent Category (`categorySlug` is always set)
- A Product may optionally belong to one Subcategory (`subCategorySlug` is optional)
- A Product may belong to multiple Subcategories (multiple category ID assignments in Square)
- A Category may have zero or more Subcategories
- A Category may have zero or more Products directly (not via subcategories)

## Data Flow

### 1. Category Page Load (`/categories/[slug]`)

```text
User navigates to /categories/board-games
  ↓
Server Component (RSC):
  1. getSquareCategoryBySlug("board-games") → Category | null
  2. getSquareProductsByCategorySlug("board-games") → Product[]
     - Internally: resolve parent ID → collect child IDs → search by all IDs
     - Products annotated with subCategory/subCategorySlug
  3. getSquareSubcategories("board-games") → Subcategory[]
     - Internally: fetchAllCategories → filter by parentCategory.id
  ↓
Props passed to client component:
  - category: Category
  - products: Product[]
  - subCategories: Subcategory[]
  ↓
CategoryProductGrid (Client Component):
  - Read ?sub= from URL → setActiveSub
  - Render filter chips from subCategories
  - Filter products by activeSub (client-side)
  - Paginate filtered products (client-side, 12/page)
```

### 2. Filter State Transition

```text
Initial state: activeSub = null (from URL or default)
  ↓
User clicks "Strategy" chip:
  1. setActiveSub("strategy")
  2. setCurrentPage(1)
  3. router.push("?sub=strategy", { scroll: false })
  4. filteredProducts = products.filter(p => p.subCategorySlug === "strategy")
  ↓
User clicks "All" chip:
  1. setActiveSub(null)
  2. setCurrentPage(1)
  3. router.push("?", { scroll: false })
  4. filteredProducts = products (no filter)
```

### 3. URL → State → URL Cycle

```text
Browser URL: /categories/board-games?sub=strategy
  ↓
useSearchParams().get("sub") → "strategy"
  ↓
Validate: subCategories.some(s => s.slug === "strategy") → true
  ↓
setActiveSub("strategy")
  ↓
User interaction → handleChipClick(newSlug) → router.push("?sub=" + newSlug)
  ↓
Browser back button → URL changes → useSearchParams re-reads → state updates
```

## Pagination Model

```text
Total products: N (parent + all subcategories)
After filter: F (≤ N)
Items per page: 12
Total pages: Math.max(1, Math.ceil(F / 12))
Current page: P (default 1, reset to 1 on filter change)

Displayed products: filteredProducts.slice((P-1)*12, P*12)
```

## URL State Model

| URL | activeSub | Behavior |
|-----|-----------|----------|
| `/categories/board-games` | `null` | Show all products (All chip active) |
| `/categories/board-games?sub=strategy` | `"strategy"` | Filter to Strategy products |
| `/categories/board-games?sub=family` | `"family"` | Filter to Family products |
| `/categories/board-games?sub=nonexistent` | `null` | Invalid slug → fallback to All |
