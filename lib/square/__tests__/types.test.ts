import { describe, it, expect } from "vitest";
import {
  isTopLevelCategory,
  mapSquareCategoryToNavCategory,
  type SquareCatalogCategory,
} from "@/lib/square/types";

describe("isTopLevelCategory", () => {
  it("should return true when parentCategoryId is undefined", () => {
    const cat: SquareCatalogCategory = {
      id: "CAT1",
      type: "CATEGORY",
      categoryData: { name: "Board Games" },
    };
    expect(isTopLevelCategory(cat)).toBe(true);
  });

  it("should return true when parentCategoryId is empty string", () => {
    const cat: SquareCatalogCategory = {
      id: "CAT2",
      type: "CATEGORY",
      categoryData: { name: "Miniatures", parentCategoryId: "" },
    };
    expect(isTopLevelCategory(cat)).toBe(true);
  });

  it("should return false when parentCategoryId is set", () => {
    const cat: SquareCatalogCategory = {
      id: "CAT3",
      type: "CATEGORY",
      categoryData: {
        name: "Warhammer 40K",
        parentCategoryId: "CAT1",
      },
    };
    expect(isTopLevelCategory(cat)).toBe(false);
  });

  it("should use explicit isTopLevel boolean when present (true)", () => {
    const cat: SquareCatalogCategory = {
      id: "CAT4",
      type: "CATEGORY",
      categoryData: {
        name: "Card Games",
        isTopLevel: true,
        parentCategoryId: "SOME_PARENT",
      },
    };
    // isTopLevel overrides parentCategoryId
    expect(isTopLevelCategory(cat)).toBe(true);
  });

  it("should use explicit isTopLevel boolean when present (false)", () => {
    const cat: SquareCatalogCategory = {
      id: "CAT5",
      type: "CATEGORY",
      categoryData: {
        name: "Draft Boosters",
        isTopLevel: false,
      },
    };
    expect(isTopLevelCategory(cat)).toBe(false);
  });

  it("should return true when parentCategoryId is null", () => {
    const cat: SquareCatalogCategory = {
      id: "CAT6",
      type: "CATEGORY",
      categoryData: {
        name: "Paints",
        parentCategoryId: null as unknown as undefined,
      },
    };
    expect(isTopLevelCategory(cat)).toBe(true);
  });
});

describe("mapSquareCategoryToNavCategory", () => {
  it("should generate correct href from category name", () => {
    const sqCat: SquareCatalogCategory = {
      id: "CAT1",
      type: "CATEGORY",
      categoryData: { name: "Board Games" },
    };

    const result = mapSquareCategoryToNavCategory(sqCat);

    expect(result).toEqual({
      label: "Board Games",
      href: "/categories/board-games",
    });
  });

  it("should handle names with special characters", () => {
    const sqCat: SquareCatalogCategory = {
      id: "CAT2",
      type: "CATEGORY",
      categoryData: { name: "Warhammer 40K" },
    };

    const result = mapSquareCategoryToNavCategory(sqCat);

    expect(result.label).toBe("Warhammer 40K");
    expect(result.href).toBe("/categories/warhammer-40k");
  });

  it("should handle names with multiple spaces and punctuation", () => {
    const sqCat: SquareCatalogCategory = {
      id: "CAT3",
      type: "CATEGORY",
      categoryData: { name: "Paints & Tools" },
    };

    const result = mapSquareCategoryToNavCategory(sqCat);

    expect(result.label).toBe("Paints & Tools");
    expect(result.href).toBe("/categories/paints-tools");
  });

  it("should strip leading and trailing dashes from slugs", () => {
    const sqCat: SquareCatalogCategory = {
      id: "CAT4",
      type: "CATEGORY",
      categoryData: { name: "  Cool Stuff!  " },
    };

    const result = mapSquareCategoryToNavCategory(sqCat);

    expect(result.label).toBe("  Cool Stuff!  ");
    // Label preserves original name, slug is cleaned
    expect(result.href).toBe("/categories/cool-stuff");
  });

  it("should not set highlight by default", () => {
    const sqCat: SquareCatalogCategory = {
      id: "CAT5",
      type: "CATEGORY",
      categoryData: { name: "Miniatures" },
    };

    const result = mapSquareCategoryToNavCategory(sqCat);

    expect(result.highlight).toBeUndefined();
  });
});
