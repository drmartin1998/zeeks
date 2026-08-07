import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock next/navigation for useSearchParams + useRouter
const mockPush = vi.fn();
let mockSearch = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearch,
  useRouter: () => ({ push: mockPush }),
}));

import { ProductListingPage } from "@/components/product-listing/product-listing-page";
import type { SquareSubCategory, CategoryTreeNode } from "@/lib/square/catalog";

interface TestProduct {
  slug: string;
  title: string;
  category: string;
  subCategory?: string;
  subCategorySlug?: string;
  price: number;
  image?: string;
  gradient?: string;
  brand?: string;
  availability: "IN_STOCK" | "OUT_OF_STOCK";
}

const subCategories: SquareSubCategory[] = [
  { id: "SUB1", name: "Paints", slug: "paints" },
  { id: "SUB2", name: "Models", slug: "models" },
];

const products: TestProduct[] = [
  {
    slug: "citadel-paint-red",
    title: "Citadel Paint Red",
    category: "Miniatures",
    subCategory: "Paints",
    subCategorySlug: "paints",
    price: 5,
    brand: "Citadel",
    availability: "IN_STOCK",
  },
  {
    slug: "citadel-paint-blue",
    title: "Citadel Paint Blue",
    category: "Miniatures",
    subCategory: "Paints",
    subCategorySlug: "paints",
    price: 5,
    brand: "Citadel",
    availability: "OUT_OF_STOCK",
  },
  {
    slug: "army-painter-model",
    title: "Army Painter Model",
    category: "Miniatures",
    subCategory: "Models",
    subCategorySlug: "models",
    price: 30,
    brand: "Army Painter",
    availability: "IN_STOCK",
  },
  {
    slug: "gw-space-marine",
    title: "GW Space Marine",
    category: "Miniatures",
    subCategory: "Models",
    subCategorySlug: "models",
    price: 40,
    brand: "Games Workshop",
    availability: "IN_STOCK",
  },
];

function renderPage() {
  return render(
    <ProductListingPage
      category={{
        slug: "miniatures",
        name: "Miniatures",
        description: "Miniatures collection",
      }}
      products={products}
      subCategories={subCategories}
    />
  );
}

// Facet groups render in multiple responsive sections (sidebar, strip), so
// interact with the first matching checkbox instance.
async function clickCheckbox(user: ReturnType<typeof userEvent.setup>, name: RegExp) {
  const checkbox = screen.getAllByRole("checkbox", { name })[0];
  await user.click(checkbox);
}

describe("ProductListingPage subcategory facet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearch = new URLSearchParams();
  });

  it("should filter products by subcategory", async () => {
    renderPage();

    // All products visible initially
    expect(screen.getByText("GW Space Marine")).toBeInTheDocument();

    // Toggle "Paints" subcategory
    const user2 = userEvent.setup();
    await clickCheckbox(user2, /paints/i);

    // Only paints products shown
    expect(screen.getByText("Citadel Paint Red")).toBeInTheDocument();
    expect(screen.getByText("Citadel Paint Blue")).toBeInTheDocument();
    expect(screen.queryByText("GW Space Marine")).not.toBeInTheDocument();
  });

  it("should clear a subcategory filter", async () => {
    mockSearch = new URLSearchParams({ sub: "paints" });
    const user = userEvent.setup();
    renderPage();

    // Only paints shown initially (from URL)
    expect(screen.getByText("Citadel Paint Red")).toBeInTheDocument();
    expect(screen.queryByText("GW Space Marine")).not.toBeInTheDocument();

    // Uncheck to clear
    await clickCheckbox(user, /paints/i);

    expect(screen.getByText("GW Space Marine")).toBeInTheDocument();
  });

  it("should pre-populate the subcategory facet from subcategories", () => {
    renderPage();
    expect(screen.getAllByRole("checkbox", { name: /paints/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("checkbox", { name: /models/i }).length).toBeGreaterThan(0);
  });
});

describe("ProductListingPage nested subcategory facet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearch = new URLSearchParams();
  });

  // "Games Workshop" has NO products directly assigned to it — its products
  // live in sub-subcategories (e.g., "Space Marines"). Those products are
  // annotated with subCategorySlug = "games-workshop" by the data layer, so
  // the facet option must still display and its descendant products must be
  // reachable when selected.
  it("should display a subcategory with no direct products and filter its descendants", async () => {
    const user = userEvent.setup();

    render(
      <ProductListingPage
        category={{ slug: "miniatures", name: "Miniatures", description: "" }}
        products={[
          {
            slug: "gw-space-marine",
            title: "GW Space Marine",
            category: "Miniatures",
            subCategory: "Games Workshop",
            subCategorySlug: "games-workshop",
            price: 40,
            brand: "Games Workshop",
            availability: "IN_STOCK",
          },
          {
            slug: "citadel-paint-red",
            title: "Citadel Paint Red",
            category: "Miniatures",
            subCategory: "Paints",
            subCategorySlug: "paints",
            price: 5,
            brand: "Citadel",
            availability: "IN_STOCK",
          },
        ]}
        subCategories={[
          { id: "GW", name: "Games Workshop", slug: "games-workshop" },
          { id: "PAINT", name: "Paints", slug: "paints" },
        ]}
      />
    );

    // "Games Workshop" is visible as a facet option
    expect(screen.getAllByRole("checkbox", { name: /games workshop/i }).length).toBeGreaterThan(0);

    // Select it → only its descendant products (annotated with the slug) show
    await clickCheckbox(user, /games workshop/i);

    expect(screen.getByText("GW Space Marine")).toBeInTheDocument();
    expect(screen.queryByText("Citadel Paint Red")).not.toBeInTheDocument();
  });

  // Drill-down facet reveal: given a hierarchical subcategory tree, selecting a
  // parent reveals its child subcategories as a second (indented) level, and a
  // selected parent filters to all products under it (parent + descendants).
  it("should reveal child subcategories when a parent is selected (drill-down)", async () => {
    const user = userEvent.setup();

    const tree: CategoryTreeNode[] = [
      {
        id: "GW",
        name: "Games Workshop",
        slug: "games-workshop",
        children: [
          {
            id: "SM",
            name: "Space Marines",
            slug: "space-marines",
            children: [],
          },
          {
            id: "AOS",
            name: "Age of Sigmar",
            slug: "age-of-sigmar",
            children: [],
          },
        ],
      },
      { id: "PAINT", name: "Paints", slug: "paints", children: [] },
    ];

    render(
      <ProductListingPage
        category={{ slug: "miniatures", name: "Miniatures", description: "" }}
        products={[
          {
            slug: "gw-space-marine",
            title: "GW Space Marine",
            category: "Miniatures",
            subCategory: "Space Marines",
            subCategorySlug: "space-marines",
            subCategorySlugs: ["games-workshop", "space-marines"],
            price: 40,
            brand: "GW Store",
            availability: "IN_STOCK",
          },
          {
            slug: "stormcast",
            title: "Stormcast Eternals",
            category: "Miniatures",
            subCategory: "Age of Sigmar",
            subCategorySlug: "age-of-sigmar",
            subCategorySlugs: ["games-workshop", "age-of-sigmar"],
            price: 45,
            brand: "GW Store",
            availability: "IN_STOCK",
          },
          {
            slug: "citadel-paint-red",
            title: "Citadel Paint Red",
            category: "Miniatures",
            subCategory: "Paints",
            subCategorySlug: "paints",
            subCategorySlugs: ["paints"],
            price: 5,
            brand: "Citadel",
            availability: "IN_STOCK",
          },
        ]}
        subCategoryTree={tree}
      />
    );

    // Children (Space Marines, Age of Sigmar) are NOT visible initially
    expect(screen.queryByRole("checkbox", { name: /space marines/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: /age of sigmar/i })).not.toBeInTheDocument();

    // Select "Games Workshop" → reveals its children
    await clickCheckbox(user, /games workshop/i);
    expect(screen.getAllByRole("checkbox", { name: /space marines/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("checkbox", { name: /age of sigmar/i }).length).toBeGreaterThan(0);

    // Selecting the parent filters to all products under it (parent + descendants):
    // both Space Marines and Age of Sigmar products show; Paints product is hidden.
    expect(screen.getByText("GW Space Marine")).toBeInTheDocument();
    expect(screen.getByText("Stormcast Eternals")).toBeInTheDocument();
    expect(screen.queryByText("Citadel Paint Red")).not.toBeInTheDocument();
  });

  // Selecting a grandchild filters to that grandchild's products only.
  it("should filter to a grandchild's products when a grandchild is selected", async () => {
    const user = userEvent.setup();

    const tree: CategoryTreeNode[] = [
      {
        id: "GW",
        name: "Games Workshop",
        slug: "games-workshop",
        children: [
          {
            id: "SM",
            name: "Space Marines",
            slug: "space-marines",
            children: [],
          },
          {
            id: "AOS",
            name: "Age of Sigmar",
            slug: "age-of-sigmar",
            children: [],
          },
        ],
      },
    ];

    render(
      <ProductListingPage
        category={{ slug: "miniatures", name: "Miniatures", description: "" }}
        products={[
          {
            slug: "gw-space-marine",
            title: "GW Space Marine",
            category: "Miniatures",
            subCategory: "Space Marines",
            subCategorySlug: "space-marines",
            subCategorySlugs: ["games-workshop", "space-marines"],
            price: 40,
            brand: "GW Store",
            availability: "IN_STOCK",
          },
          {
            slug: "stormcast",
            title: "Stormcast Eternals",
            category: "Miniatures",
            subCategory: "Age of Sigmar",
            subCategorySlug: "age-of-sigmar",
            subCategorySlugs: ["games-workshop", "age-of-sigmar"],
            price: 45,
            brand: "GW Store",
            availability: "IN_STOCK",
          },
        ]}
        subCategoryTree={tree}
      />
    );

    // Expand Games Workshop to reveal children
    await clickCheckbox(user, /games workshop/i);

    // Select the "Space Marines" grandchild
    await clickCheckbox(user, /space marines/i);

    // Only Space Marines product shows; Age of Sigmar product is hidden.
    expect(screen.getByText("GW Space Marine")).toBeInTheDocument();
    expect(screen.queryByText("Stormcast Eternals")).not.toBeInTheDocument();
  });

  // Selecting a child subcategory must KEEP the parent's children revealed
  // (drill-down expansion is separate from the single-select filter), while
  // still filtering to the child's products only.
  it("should keep the parent's children visible when a child is selected", async () => {
    const user = userEvent.setup();

    const tree: CategoryTreeNode[] = [
      {
        id: "GW",
        name: "Games Workshop",
        slug: "games-workshop",
        children: [
          {
            id: "SM",
            name: "Space Marines",
            slug: "space-marines",
            children: [
              {
                id: "SM40K",
                name: "Warhammer 40K",
                slug: "warhammer-40k",
                children: [],
              },
            ],
          },
          {
            id: "AOS",
            name: "Age of Sigmar",
            slug: "age-of-sigmar",
            children: [],
          },
        ],
      },
    ];

    render(
      <ProductListingPage
        category={{ slug: "miniatures", name: "Miniatures", description: "" }}
        products={[
          {
            slug: "gw-space-marine",
            title: "GW Space Marine",
            category: "Miniatures",
            subCategory: "Warhammer 40K",
            subCategorySlug: "warhammer-40k",
            subCategorySlugs: ["games-workshop", "space-marines", "warhammer-40k"],
            price: 40,
            brand: "GW Store",
            availability: "IN_STOCK",
          },
          {
            slug: "stormcast",
            title: "Stormcast Eternals",
            category: "Miniatures",
            subCategory: "Age of Sigmar",
            subCategorySlug: "age-of-sigmar",
            subCategorySlugs: ["games-workshop", "age-of-sigmar"],
            price: 45,
            brand: "GW Store",
            availability: "IN_STOCK",
          },
        ]}
        subCategoryTree={tree}
      />
    );

    // Select the parent "Games Workshop" → reveals its children.
    await clickCheckbox(user, /games workshop/i);
    expect(screen.getAllByRole("checkbox", { name: /space marines/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("checkbox", { name: /age of sigmar/i }).length).toBeGreaterThan(0);

    // Select the child "Space Marines" → its own child "Warhammer 40K" is revealed.
    await clickCheckbox(user, /space marines/i);
    expect(screen.getAllByRole("checkbox", { name: /warhammer 40k/i }).length).toBeGreaterThan(0);

    // The parent's other child ("Age of Sigmar") STAYS visible — the parent
    // remains expanded even though it is no longer the selected filter node.
    expect(screen.getAllByRole("checkbox", { name: /age of sigmar/i }).length).toBeGreaterThan(0);

    // Filtering still narrows to the selected child's products only.
    expect(screen.getByText("GW Space Marine")).toBeInTheDocument();
    expect(screen.queryByText("Stormcast Eternals")).not.toBeInTheDocument();
  });
});

describe("ProductListingPage brand facet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearch = new URLSearchParams();
  });

  it("should filter products by a single brand", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByText("GW Space Marine")).toBeInTheDocument();

    await clickCheckbox(user, /citadel/i);

    // Only Citadel products (paints) shown
    expect(screen.getByText("Citadel Paint Red")).toBeInTheDocument();
    expect(screen.getByText("Citadel Paint Blue")).toBeInTheDocument();
    expect(screen.queryByText("GW Space Marine")).not.toBeInTheDocument();
  });

  it("should include products matching EITHER brand (OR semantics)", async () => {
    const user = userEvent.setup();
    renderPage();

    await clickCheckbox(user, /citadel/i);
    await clickCheckbox(user, /army painter/i);

    // Citadel + Army Painter products shown
    expect(screen.getByText("Citadel Paint Red")).toBeInTheDocument();
    expect(screen.getByText("Army Painter Model")).toBeInTheDocument();
    expect(screen.queryByText("GW Space Marine")).not.toBeInTheDocument();
  });

  it("should restore all products when all brand filters cleared", async () => {
    const user = userEvent.setup();
    renderPage();

    await clickCheckbox(user, /citadel/i);
    await clickCheckbox(user, /citadel/i);

    expect(screen.getByText("GW Space Marine")).toBeInTheDocument();
  });
});

describe("ProductListingPage availability facet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearch = new URLSearchParams();
  });

  it("should filter to in-stock products", async () => {
    const user = userEvent.setup();
    renderPage();

    await clickCheckbox(user, /in stock/i);

    expect(screen.getByText("Citadel Paint Red")).toBeInTheDocument();
    expect(screen.queryByText("Citadel Paint Blue")).not.toBeInTheDocument();
  });

  it("should filter to out-of-stock products", async () => {
    const user = userEvent.setup();
    renderPage();

    await clickCheckbox(user, /out of stock/i);

    expect(screen.getByText("Citadel Paint Blue")).toBeInTheDocument();
    expect(screen.queryByText("Citadel Paint Red")).not.toBeInTheDocument();
  });

  it("should clear an availability filter", async () => {
    const user = userEvent.setup();
    renderPage();

    await clickCheckbox(user, /in stock/i);
    await clickCheckbox(user, /in stock/i);

    expect(screen.getByText("Citadel Paint Blue")).toBeInTheDocument();
  });
});

describe("ProductListingPage large-screen sidebar layout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearch = new URLSearchParams();
  });

  it("should NOT render the Price Range facet", () => {
    renderPage();
    expect(screen.queryByText("Price Range")).not.toBeInTheDocument();
    expect(screen.queryByRole("slider", { name: /minimum price/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("slider", { name: /maximum price/i })).not.toBeInTheDocument();
  });

  it("should render the Categories, Brand, and Availability facets", () => {
    renderPage();
    expect(screen.getAllByText("Categories").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Brand").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Availability").length).toBeGreaterThan(0);
  });
});