import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/navigation for useRouter
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock Clerk @clerk/nextjs for auth UI components
import {
  setClerkMockConfig,
} from "@/components/__tests__/__mocks__/clerk";

vi.mock("@clerk/nextjs", async () => {
  const actual =
    await vi.importActual<typeof import("./__mocks__/clerk")>(
      "./__mocks__/clerk",
    );
  return actual;
});

import { NavBar } from "@/components/nav-bar";
import type { NavCategory } from "@/lib/square/types";

const mockSquareCategories: NavCategory[] = [
  { label: "Board Games", href: "/categories/board-games" },
  { label: "Miniatures", href: "/categories/miniatures" },
  { label: "Card Games", href: "/categories/card-games" },
  { label: "Paints & Tools", href: "/categories/paints-tools" },
  { label: "About Us", href: "/about" },
  { label: "Locations", href: "/locations" },
  { label: "Sale", href: "/categories/sale", highlight: true },
];

describe("NavBar", () => {
  beforeEach(() => {
    setClerkMockConfig({ signedIn: false });
  });

  it("should render categories passed as prop", () => {
    const categories: NavCategory[] = [
      { label: "Board Games", href: "/categories/board-games" },
      { label: "Miniatures", href: "/categories/miniatures" },
    ];

    render(<NavBar categories={categories} />);

    expect(
      screen.getByRole("link", { name: "Board Games" })
    ).toHaveAttribute("href", "/categories/board-games");
    expect(
      screen.getByRole("link", { name: "Miniatures" })
    ).toHaveAttribute("href", "/categories/miniatures");
  });

  it("should render About Us and Locations links", () => {
    render(<NavBar categories={mockSquareCategories} />);

    expect(
      screen.getByRole("link", { name: "About Us" })
    ).toHaveAttribute("href", "/about");
    expect(
      screen.getByRole("link", { name: "Locations" })
    ).toHaveAttribute("href", "/locations");
  });

  it("should render Sale link with highlight class", () => {
    render(<NavBar categories={mockSquareCategories} />);

    const saleLink = screen.getByRole("link", { name: "Sale" });
    expect(saleLink).toHaveAttribute("href", "/categories/sale");
    expect(saleLink.className).toContain("text-status-sale");
  });

  it("should render non-highlight categories with muted class", () => {
    const categories: NavCategory[] = [
      { label: "Board Games", href: "/categories/board-games" },
    ];

    render(<NavBar categories={categories} />);

    const link = screen.getByRole("link", { name: "Board Games" });
    expect(link.className).toContain("text-text-muted");
  });

  it("should render the Zeeks logo with a link to home", () => {
    render(<NavBar categories={[]} />);

    const logo = screen.getByAltText("Zeeks Logo");
    expect(logo).toBeInTheDocument();

    // The logo is wrapped in a link to "/"
    const homeLink = logo.closest("a");
    expect(homeLink).toHaveAttribute("href", "/");
  });

  it("should render empty category bar when given empty array", () => {
    render(<NavBar categories={[]} />);

    // Category bar exists but has no category links (only logo, search, cart, user)
    expect(
      screen.queryByRole("link", { name: "Miniatures" })
    ).not.toBeInTheDocument();
  });
});

// ============================================================
// US1: Auth — Trigger Sign-In from Profile Icon
// ============================================================

describe("NavBar — Auth (US1): Unauthenticated", () => {
  beforeEach(() => {
    setClerkMockConfig({ signedIn: false });
  });

  it("should render a clickable profile icon for unauthenticated visitors", () => {
    render(<NavBar categories={[]} />);

    // The SignInButton mock renders a button with data-clerk-sign-in
    const signInButton = screen.getByRole("button", { name: "User account" });
    expect(signInButton).toBeInTheDocument();
    expect(signInButton).toHaveAttribute("data-clerk-sign-in");
  });

  it("should set SignInButton to modal mode for in-page auth", () => {
    render(<NavBar categories={[]} />);

    const signInButton = screen.getByRole("button", { name: "User account" });
    expect(signInButton).toHaveAttribute("data-mode", "modal");
  });
});

// ============================================================
// US2: Auth — Authenticated User Indicator
// ============================================================

describe("NavBar — Auth (US2): Authenticated", () => {
  beforeEach(() => {
    setClerkMockConfig({
      signedIn: true,
      user: { id: "user_123", email: "test@example.com" },
    });
  });

  it("should render UserButton when user is signed in", () => {
    render(<NavBar categories={[]} />);

    // The UserButton mock renders a button with data-clerk-user-button
    const userButton = screen.getByRole("button", { name: "User: test@example.com" });
    expect(userButton).toBeInTheDocument();
    expect(userButton).toHaveAttribute("data-clerk-user-button");
  });

  it("should NOT render SignInButton when user is signed in", () => {
    render(<NavBar categories={[]} />);

    // SignInButton should not be present since Show hides it for signed-in state
    expect(
      screen.queryByRole("button", { name: "User account" })
    ).not.toBeInTheDocument();
  });
});

// ============================================================
// US3: Auth — Session Persistence
// ============================================================

describe("NavBar — Auth (US3): Session Persistence", () => {
  beforeEach(() => {
    setClerkMockConfig({
      signedIn: true,
      user: { id: "user_123", email: "test@example.com" },
    });
  });

  it("should persist auth state across re-renders", () => {
    const { unmount } = render(<NavBar categories={[]} />);

    // Verify UserButton is present on first render
    expect(
      screen.getByRole("button", { name: "User: test@example.com" })
    ).toBeInTheDocument();

    // Unmount and remount — auth state should persist
    unmount();
    render(<NavBar categories={[]} />);

    expect(
      screen.getByRole("button", { name: "User: test@example.com" })
    ).toBeInTheDocument();
  });
});
