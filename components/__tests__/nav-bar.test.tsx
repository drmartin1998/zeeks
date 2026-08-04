import { render, screen, fireEvent } from "@testing-library/react";
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
import type { NavCategory, LocationBarData } from "@/lib/square/types";

const mockSquareCategories: NavCategory[] = [
  { label: "Board Games", href: "/categories/board-games" },
  { label: "Miniatures", href: "/categories/miniatures" },
  { label: "Card Games", href: "/categories/card-games" },
  { label: "Paints & Tools", href: "/categories/paints-tools" },
  { label: "About Us", href: "/about" },
  { label: "Locations", href: "/locations" },
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

  it("should render a profile icon for unauthenticated visitors", () => {
    render(<NavBar categories={[]} />);

    const profileButton = screen.getByRole("button", { name: "Account menu" });
    expect(profileButton).toBeInTheDocument();
    expect(profileButton).toHaveAttribute("aria-expanded", "false");
  });

  it("should open dropdown when profile icon is clicked", () => {
    render(<NavBar categories={[]} />);

    const profileButton = screen.getByRole("button", { name: "Account menu" });
    expect(screen.queryByText("Login")).not.toBeInTheDocument();
    fireEvent.click(profileButton);
    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.getByText("Sign Up")).toBeInTheDocument();
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

  it("should render UserMenu when user is signed in", () => {
    render(<NavBar categories={[]} />);

    const menuButton = screen.getByRole("button", { name: "Account menu" });
    expect(menuButton).toBeInTheDocument();
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

    expect(
      screen.getByRole("button", { name: "Account menu" })
    ).toBeInTheDocument();

    unmount();
    render(<NavBar categories={[]} />);

    expect(
      screen.getByRole("button", { name: "Account menu" })
    ).toBeInTheDocument();
  });
});

// ============================================================
// Location Bar Integration (001-nav-location-bar)
// ============================================================

describe("NavBar — Location Bar", () => {
  beforeEach(() => {
    setClerkMockConfig({ signedIn: false });
  });

  const locationData: LocationBarData = {
    cityState: "Seattle, WA",
    hoursDisplay: "Open today: 9 AM \u2013 9 PM",
    status: "open",
    statusText: "Open Now",
  };

  it("should render LocationBar with cityState when locationData is provided", () => {
    render(<NavBar categories={[]} locationData={locationData} />);
    expect(screen.getByText("Seattle, WA")).toBeInTheDocument();
  });

  it("should render LocationBar with hours when locationData is provided", () => {
    render(<NavBar categories={[]} locationData={locationData} />);
    expect(
      screen.getByText("Open today: 9 AM \u2013 9 PM")
    ).toBeInTheDocument();
  });

  it("should render LocationBar with status text when locationData is provided", () => {
    render(<NavBar categories={[]} locationData={locationData} />);
    expect(screen.getByText("Open Now")).toBeInTheDocument();
  });

  it("should not render store location text when locationData is null", () => {
    render(<NavBar categories={[]} locationData={null} />);
    expect(screen.queryByText("Seattle, WA")).not.toBeInTheDocument();
  });

  it("should still render categories when locationData is null", () => {
    render(
      <NavBar
        categories={[{ label: "Board Games", href: "/categories/board-games" }]}
        locationData={null}
      />
    );
    expect(
      screen.getByRole("link", { name: "Board Games" })
    ).toBeInTheDocument();
  });

  it("should render closing-soon status", () => {
    render(
      <NavBar
        categories={[]}
        locationData={{ ...locationData, status: "closing-soon", statusText: "Closing Soon" }}
      />
    );
    expect(screen.getByText("Closing Soon")).toBeInTheDocument();
  });

  it("should render closed status", () => {
    render(
      <NavBar
        categories={[]}
        locationData={{ ...locationData, status: "closed", statusText: "Closed Now" }}
      />
    );
    expect(screen.getByText("Closed Now")).toBeInTheDocument();
  });
});
