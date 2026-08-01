# Data Model: Square Product Display

## Entities (Existing — for verification)

### SquareItem (from Square API)
- `id`: CatalogObject ID
- `type`: "ITEM"
- `itemData.name`: Display title
- `itemData.categories[]`: Array of `{ id, ordinal }` category references
- `itemData.variations[]`: Array of item variations (pricing)
- `itemData.imageIds[]`: Image references

### ItemVariation
- `itemVariationData.priceMoney.amount`: Price in cents (bigint)
- `itemVariationData.priceMoney.currency`: "USD"

### ProductCard (UI)
- `title`: From itemData.name
- `category`: Parent category name
- `subCategory`: Subcategory name (if applicable)
- `price`: Normalized to dollars (amount / 100)
- `image`: Image URL or empty
- `gradient`: Tailwind gradient class (fallback)

## Data Flow (Verification Points)

```
Square Dashboard → catalogApi.searchItems() → SquareProduct[] → CategoryProductGrid → GameCard
                     ↑ check here first           ↑ check count       ↑ check render
```
