# Data Model: Subcategory Browsing & Filtering

## Entities

### SquareCategory (Top-Level)
```
interface SquareCategory {
  title: string;       // "Board Games", "Miniatures"
  slug: string;        // "board-games", "miniatures"
  image: string;        // category card image path
  href: string;         // "/categories/board-games"
}
```
**Source**: `catalogApi.search({ objectTypes: ["CATEGORY"] })` → filtered by `isTopLevelCategory()`

### SquareSubCategory (Child)
```
interface SquareSubCategory {
  id: string;           // Square category ID (e.g., "CAT_ABC123")
  name: string;         // "Strategy", "Family"
  slug: string;         // "strategy", "family"
}
```
**Source**: Same catalog API call → filtered by `parentCategory.id === parent.id` and `!isTopLevelCategory()`

### SquareProduct (Item)
```
interface SquareProduct {
  title: string;             // "Catan"
  category: string;          // parent category name "Board Games"
  categorySlug: string;      // "board-games"
  subCategory?: string;      // "Strategy" (undefined if direct parent)
  subCategorySlug?: string;  // "strategy"
  price: number;             // in dollars (converted from cents)
  image: string;             // product image URL
  gradient: string;          // Tailwind gradient class
}
```
**Source**: `catalogApi.searchItems({ categoryIds: [...] })` with cursor pagination

### NavCategory (Navigation Link)
```
interface NavCategory {
  label: string;       // "Board Games", "About Us"
  href: string;        // "/categories/board-games", "/about"
  highlight?: boolean; // true for "Sale" 
}
```
**Source**: Square top-level categories + `STATIC_NAV_CATEGORIES`

## Data Flow

```
Page Request (/categories/:slug)
  │
  ├─ Promise.all([
  │     getSquareCategoryBySlug(slug),     → SquareCategory | null
  │     getSquareProductsByCategorySlug(slug), → SquareProduct[] | null
  │     getSquareSubcategories(slug),       → SquareSubCategory[]
  │   ])
  │
  ├─ Internal: fetchAllCategories() → all CATEGORY objects (shared call)
  │
  ├─ getSquareProductsByCategorySlug():
  │    1. Find parent ID from categories
  │    2. Build subCategoryMap<id, SquareSubCategory>
  │    3. Loop: catalogApi.searchItems({ categoryIds, cursor, limit:1000 })
  │       Until cursor is undefined
  │    4. Map each item → SquareProduct with subcategory annotation
  │
  └─ Client: CategoryProductGrid or ProductListingPage
       └─ Filter by subCategorySlug (client-side state)
```

## Relationships

```
SquareCategory (top-level)
    │
    │ 1:N (via parentCategory.id)
    ▼
SquareSubCategory (child)
    │
    │ N:M (via itemData.categories[])
    ▼
SquareProduct (item)
    │
    └─ subCategory / subCategorySlug (resolved at fetch time)
```

## Pagination Model

```
Square searchItems response:
  { items: CatalogObject[], cursor?: string }

Loop:
  request: { categoryIds, cursor?, limit: 1000 }
  response: { items, cursor? }
  
  accumulate items → allItems.push(...items)
  set next cursor → cursor = response.cursor
  
  exit when cursor is undefined (last page)
```

## UI Pagination Model

```
CategoryProductGrid (categories/[slug]):
  - Total items across all Square pages
  - Client-side pagination: 12 items/page
  - Page controls: <Pagination currentPage totalPages onPageChange>
  - Pagination applied AFTER subcategory filtering

ProductListingPage (shop/[category]):
  - Same as above, already implemented
```

## URL Filter State Model

```
/categories/board-games              → default: "All" filter active
/categories/board-games?sub=strategy → "Strategy" chip active, filtered view
/categories/board-games?sub=family   → "Family" chip active, filtered view

Implementation:
  Server: searchParams passed to client component as initialFilter prop
  Client: useSearchParams() reads current filter; chip click updates router.push()
  Back/Forward: browser navigates URL history; client reads updated searchParams
```
