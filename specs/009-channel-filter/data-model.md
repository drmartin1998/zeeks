# Data Model: Channel-Based Category Filtering

## Entity Changes

### SquareCatalogCategory (Modified)

Adds the `channels` field that already exists on Square API responses but was not typed.

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `id` | `string` | Square API | Unique catalog object ID |
| `type` | `"CATEGORY"` | Square API | Object type discriminator |
| `categoryData.name` | `string` | Square API | Display name (e.g., "Miniatures") |
| `categoryData.parentCategory` | `{ id?, ordinal? }` | Square API | Parent reference (nested object) |
| `categoryData.isTopLevel` | `boolean?` | Square API | Whether Square considers this top-level |
| `categoryData.channels` | `string[]` | **NEW** Square API | Channel IDs this category belongs to |

### Channel (New Configuration Entity)

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `SQUARE_CHANNEL_ID` | `string` | Environment variable | Target channel ID to filter by |

## Data Flow

```
Square API Response
  │
  │  Each category has categoryData.channels: string[]
  │
  ▼
fetchAllCategories()  ← CHANGED: add channel filter
  │
  │  Filter 1: cat.categoryData.channels?.includes(SQUARE_CHANNEL_ID)
  │  Filter 2: parentCategory.id exists OR id in ALLOWED_CATEGORY_IDS
  │
  ▼
Consumers (unchanged):
  ├── getNavCategories()        → navigation bar
  ├── getSquareCategoryBySlug() → category pages
  ├── getSquareSubcategories()  → Category dropdown
  └── getSquareProductsByCategorySlug() → product grids
```

## Filter Pipeline

```
All categories from Square
  → Step 1: Channel filter
    IF SQUARE_CHANNEL_ID is set:
      KEEP categories where channels includes SQUARE_CHANNEL_ID
    ELSE:
      console.warn, RETURN empty
  → Step 2: Allowlist filter
    IF parentCategory.id exists: KEEP (subcategory passing through)
    ELSE IF id in ALLOWED_CATEGORY_IDS: KEEP (allowed top-level)
    ELSE: DROP
  → Return to consumers
```

## State Transitions

No stateful entities. The channel filter is a pure function applied on each request.

## Validation Rules

- `SQUARE_CHANNEL_ID` must be a non-empty string. If missing/empty, no categories are returned.
- `channels` must be an array. If missing/undefined, treat as empty array (category excluded).
- Channel filter check: `Array.isArray(channels) && channels.includes(channelId)`
